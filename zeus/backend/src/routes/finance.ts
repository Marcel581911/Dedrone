import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { log } from "../logger.js";
import { fetchQuotes } from "../services/stock-prices.js";
import { parseStatementCsv, parseStatementPdf } from "../services/bank-statement.js";

export async function financeRoutes(app: FastifyInstance) {

  // ── NET WORTH SUMMARY ─────────────────────────────
  app.get("/api/finance/summary", async (req) => {
    const userId = req.userId;
    const [accounts, assets, stocks, debts] = await Promise.all([
      prisma.bankAccount.findMany({ where: { userId } }),
      prisma.asset.findMany({ where: { userId } }),
      prisma.stockHolding.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId } }),
    ]);

    // Cash in bank accounts
    const cashTotal = accounts.reduce((s, a) => s + a.balance, 0);

    // Physical + other assets
    const assetTotal = assets.reduce((s, a) => s + a.value, 0);

    // Stock portfolio (cost basis only — live values fetched separately)
    const stockCostBasis = stocks.reduce((s, h) => s + h.shares * h.avgCost, 0);

    const totalAssets = cashTotal + assetTotal + stockCostBasis;
    const totalLiabilities = debts.reduce((s, d) => s + d.balance, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Monthly income/expense (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const txThisMonth = await prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
    });
    const monthlyIncome = txThisMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = txThisMonth.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    // Asset breakdown
    const breakdown = [
      { label: "Cash & Bank", value: cashTotal, type: "cash" },
      { label: "Investments", value: stockCostBasis, type: "stocks" },
      ...Object.entries(
        assets.reduce((acc: Record<string, number>, a) => {
          acc[a.type] = (acc[a.type] || 0) + a.value;
          return acc;
        }, {})
      ).map(([type, value]) => ({ label: type, value, type })),
    ].filter(b => b.value > 0);

    return {
      netWorth, totalAssets, totalLiabilities,
      cashTotal, assetTotal, stockCostBasis,
      monthlyIncome, monthlyExpenses,
      breakdown,
    };
  });

  // ── BANK ACCOUNTS ─────────────────────────────────
  app.get("/api/finance/accounts", async (req) => {
    return prisma.bankAccount.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "asc" } });
  });

  app.post("/api/finance/accounts", async (req) => {
    const body = req.body as any;
    return prisma.bankAccount.create({
      data: {
        userId: req.userId,
        name: body.name || "Account",
        type: body.type || "checking",
        currency: body.currency || "EUR",
        balance: parseFloat(body.balance) || 0,
        institution: body.institution || "",
        color: body.color || "",
      },
    });
  });

  app.put("/api/finance/accounts/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const acct = await prisma.bankAccount.findFirst({ where: { id, userId: req.userId } });
    if (!acct) return reply.status(404).send({ error: "Not found" });
    const body = req.body as any;
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.balance !== undefined) data.balance = parseFloat(body.balance);
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.institution !== undefined) data.institution = body.institution;
    if (body.color !== undefined) data.color = body.color;
    return prisma.bankAccount.update({ where: { id }, data });
  });

  app.delete("/api/finance/accounts/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const acct = await prisma.bankAccount.findFirst({ where: { id, userId: req.userId } });
    if (!acct) return reply.status(404).send({ error: "Not found" });
    await prisma.bankAccount.delete({ where: { id } });
    return { success: true };
  });

  // Import bank statement (CSV or PDF)
  app.post("/api/finance/accounts/:id/import", async (req, reply) => {
    const { id } = req.params as { id: string };
    const acct = await prisma.bankAccount.findFirst({ where: { id, userId: req.userId } });
    if (!acct) return reply.status(404).send({ error: "Account not found" });

    const file = await req.file();
    if (!file) return reply.status(400).send({ error: "No file provided" });
    const buffer = await file.toBuffer();
    const filename = file.filename || "upload";
    const ext = filename.toLowerCase().split(".").pop() || "";

    let parsed: any[] = [];
    if (ext === "pdf") {
      parsed = await parseStatementPdf(buffer);
    } else {
      parsed = await parseStatementCsv(buffer.toString("utf-8"));
    }

    if (parsed.length === 0) {
      return { imported: 0, message: "No transactions found. Check the file format." };
    }

    // Deduplicate against existing transactions (same date+amount+desc)
    const existing = await prisma.transaction.findMany({
      where: { accountId: id },
      select: { date: true, amount: true, description: true },
    });
    const existingSet = new Set(existing.map(t => `${t.date.toISOString().slice(0,10)}|${t.amount}|${t.description}`));

    let imported = 0, skipped = 0;

    for (const tx of parsed) {
      const key = `${tx.date.toISOString().slice(0,10)}|${tx.amount}|${tx.description}`;
      if (existingSet.has(key)) { skipped++; continue; }

      await prisma.transaction.create({
        data: {
          accountId: id,
          userId: req.userId,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
        },
      });
      imported++;
    }

    // Update account lastSyncAt
    if (imported > 0) {
      await prisma.bankAccount.update({
        where: { id },
        data: { lastSyncAt: new Date() },
      });
    }

    await log("info", "finance", `Imported ${imported} transactions into account ${acct.name}`);
    return { imported, skipped, message: `Imported ${imported} transactions (${skipped} duplicates skipped).` };
  });

  // ── TRANSACTIONS ──────────────────────────────────
  app.get("/api/finance/transactions", async (req) => {
    const q = req.query as any;
    const where: any = { userId: req.userId };
    if (q.accountId) where.accountId = q.accountId;
    if (q.category) where.category = q.category;
    if (q.from) where.date = { ...where.date, gte: new Date(q.from) };
    if (q.to) where.date = { ...where.date, lte: new Date(q.to) };
    if (q.search) where.description = { contains: q.search };
    return prisma.transaction.findMany({
      where,
      include: { account: { select: { name: true, currency: true, color: true } } },
      orderBy: { date: "desc" },
      take: parseInt(q.limit || "100"),
    });
  });

  app.post("/api/finance/transactions", async (req, reply) => {
    const body = req.body as any;
    const acct = await prisma.bankAccount.findFirst({ where: { id: body.accountId, userId: req.userId } });
    if (!acct) return reply.status(400).send({ error: "Account not found" });

    const tx = await prisma.transaction.create({
      data: {
        accountId: body.accountId,
        userId: req.userId,
        date: new Date(body.date),
        description: body.description || "",
        amount: parseFloat(body.amount),
        category: body.category || "Other",
        notes: body.notes || "",
      },
    });
    return tx;
  });

  app.put("/api/finance/transactions/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const tx = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
    if (!tx) return reply.status(404).send({ error: "Not found" });
    const body = req.body as any;
    const data: any = {};
    if (body.category !== undefined) data.category = body.category;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.description !== undefined) data.description = body.description;
    if (body.isReconciled !== undefined) data.isReconciled = body.isReconciled;
    return prisma.transaction.update({ where: { id }, data });
  });

  app.delete("/api/finance/transactions/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const tx = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
    if (!tx) return reply.status(404).send({ error: "Not found" });
    await prisma.transaction.delete({ where: { id } });
    return { success: true };
  });

  // ── ASSETS ────────────────────────────────────────
  app.get("/api/finance/assets", async (req) => {
    return prisma.asset.findMany({ where: { userId: req.userId }, orderBy: [{ type: "asc" }, { value: "desc" }] });
  });

  app.post("/api/finance/assets", async (req) => {
    const body = req.body as any;
    return prisma.asset.create({
      data: {
        userId: req.userId,
        name: body.name || "Asset",
        type: body.type || "other",
        value: parseFloat(body.value) || 0,
        currency: body.currency || "EUR",
        purchasePrice: parseFloat(body.purchasePrice) || 0,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        notes: body.notes || "",
        metadata: JSON.stringify(body.metadata || {}),
      },
    });
  });

  app.put("/api/finance/assets/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const asset = await prisma.asset.findFirst({ where: { id, userId: req.userId } });
    if (!asset) return reply.status(404).send({ error: "Not found" });
    const body = req.body as any;
    const data: any = {};
    for (const k of ["name", "type", "notes", "currency"]) if (body[k] !== undefined) data[k] = body[k];
    if (body.value !== undefined) data.value = parseFloat(body.value);
    if (body.purchasePrice !== undefined) data.purchasePrice = parseFloat(body.purchasePrice);
    if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    if (body.metadata !== undefined) data.metadata = JSON.stringify(body.metadata);
    return prisma.asset.update({ where: { id }, data });
  });

  app.delete("/api/finance/assets/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const asset = await prisma.asset.findFirst({ where: { id, userId: req.userId } });
    if (!asset) return reply.status(404).send({ error: "Not found" });
    await prisma.asset.delete({ where: { id } });
    return { success: true };
  });

  // ── STOCKS & CRYPTO HOLDINGS ──────────────────────
  app.get("/api/finance/stocks", async (req) => {
    return prisma.stockHolding.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "asc" } });
  });

  app.post("/api/finance/stocks", async (req) => {
    const body = req.body as any;
    const ticker = (body.ticker || "").toUpperCase().trim();
    if (!ticker) throw new Error("Ticker is required");

    // Check if already exists — update shares instead
    const existing = await prisma.stockHolding.findFirst({ where: { userId: req.userId, ticker } });
    if (existing) {
      const totalCost = existing.shares * existing.avgCost + parseFloat(body.shares) * parseFloat(body.avgCost);
      const totalShares = existing.shares + parseFloat(body.shares);
      return prisma.stockHolding.update({
        where: { id: existing.id },
        data: { shares: totalShares, avgCost: totalCost / totalShares },
      });
    }

    return prisma.stockHolding.create({
      data: {
        userId: req.userId,
        ticker,
        name: body.name || ticker,
        shares: parseFloat(body.shares),
        avgCost: parseFloat(body.avgCost),
        currency: body.currency || "USD",
      },
    });
  });

  app.put("/api/finance/stocks/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const h = await prisma.stockHolding.findFirst({ where: { id, userId: req.userId } });
    if (!h) return reply.status(404).send({ error: "Not found" });
    const body = req.body as any;
    const data: any = {};
    if (body.shares !== undefined) data.shares = parseFloat(body.shares);
    if (body.avgCost !== undefined) data.avgCost = parseFloat(body.avgCost);
    if (body.name !== undefined) data.name = body.name;
    if (body.currency !== undefined) data.currency = body.currency;
    return prisma.stockHolding.update({ where: { id }, data });
  });

  app.delete("/api/finance/stocks/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const h = await prisma.stockHolding.findFirst({ where: { id, userId: req.userId } });
    if (!h) return reply.status(404).send({ error: "Not found" });
    await prisma.stockHolding.delete({ where: { id } });
    return { success: true };
  });

  // Live prices for all user holdings
  app.get("/api/finance/stocks/prices", async (req) => {
    const holdings = await prisma.stockHolding.findMany({ where: { userId: req.userId } });
    if (holdings.length === 0) return { quotes: {}, updatedAt: new Date() };

    const tickers = [...new Set(holdings.map(h => h.ticker))];
    const quotes = await fetchQuotes(tickers);
    return { quotes, updatedAt: new Date() };
  });

  // ── DEBTS ─────────────────────────────────────────
  app.get("/api/finance/debts", async (req) => {
    return prisma.debt.findMany({ where: { userId: req.userId }, orderBy: { balance: "desc" } });
  });

  app.post("/api/finance/debts", async (req) => {
    const body = req.body as any;
    return prisma.debt.create({
      data: {
        userId: req.userId,
        name: body.name || "Debt",
        type: body.type || "other",
        balance: parseFloat(body.balance) || 0,
        originalAmount: parseFloat(body.originalAmount) || parseFloat(body.balance) || 0,
        interestRate: parseFloat(body.interestRate) || 0,
        monthlyPayment: parseFloat(body.monthlyPayment) || 0,
        currency: body.currency || "EUR",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || "",
      },
    });
  });

  app.put("/api/finance/debts/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const debt = await prisma.debt.findFirst({ where: { id, userId: req.userId } });
    if (!debt) return reply.status(404).send({ error: "Not found" });
    const body = req.body as any;
    const data: any = {};
    for (const k of ["name", "type", "currency", "notes"]) if (body[k] !== undefined) data[k] = body[k];
    for (const k of ["balance", "originalAmount", "interestRate", "monthlyPayment"]) {
      if (body[k] !== undefined) data[k] = parseFloat(body[k]);
    }
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    return prisma.debt.update({ where: { id }, data });
  });

  app.delete("/api/finance/debts/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const debt = await prisma.debt.findFirst({ where: { id, userId: req.userId } });
    if (!debt) return reply.status(404).send({ error: "Not found" });
    await prisma.debt.delete({ where: { id } });
    return { success: true };
  });

  // Spending categories summary
  app.get("/api/finance/spending", async (req) => {
    const q = req.query as any;
    const from = q.from ? new Date(q.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = q.to ? new Date(q.to) : new Date();

    const txs = await prisma.transaction.findMany({
      where: { userId: req.userId, amount: { lt: 0 }, date: { gte: from, lte: to } },
    });

    const byCategory: Record<string, number> = {};
    for (const tx of txs) {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + Math.abs(tx.amount);
    }

    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    const categories = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return { categories, total, from, to };
  });
}
