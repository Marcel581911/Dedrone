import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { scrapePrice, searchAmazon, extractAsin } from "../services/price-scraper.js";
import { createNotification } from "./notifications.js";
import { sendAlert } from "../services/alerts.js";
import { getUserHouseholdId } from "../services/household.js";

async function ensureAmazonShop(userId: string) {
  const existing = await prisma.shop.findFirst({ where: { userId, name: "Amazon" } });
  if (existing) return existing;
  return prisma.shop.create({
    data: { userId, name: "Amazon", url: "https://www.amazon.com", color: "#FF9900", icon: "🛒", isDefault: true },
  });
}

export async function shoppingRoutes(app: FastifyInstance) {
  // ── SHOPS ──────────────────────────────────────────────────────────────────

  app.get("/api/shopping/shops", async (req) => {
    const shops = await prisma.shop.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { items: { where: { status: "pending" } } } } },
    });

    if (shops.length === 0) {
      const amazon = await ensureAmazonShop(req.userId!);
      return [{ ...amazon, _count: { items: 0 } }];
    }

    return shops;
  });

  app.post("/api/shopping/shops", async (req) => {
    const body = req.body as any;
    return prisma.shop.create({
      data: {
        userId: req.userId!,
        name: body.name,
        url: body.url || "",
        color: body.color || "",
        icon: body.icon || "",
        isDefault: body.isDefault || false,
      },
    });
  });

  app.put("/api/shopping/shops/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId } });
    if (!shop) throw { statusCode: 404, message: "Shop not found" };
    return prisma.shop.update({
      where: { id },
      data: { name: body.name, url: body.url, color: body.color, icon: body.icon, isDefault: body.isDefault },
    });
  });

  app.delete("/api/shopping/shops/:id", async (req) => {
    const { id } = req.params as { id: string };
    const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId } });
    if (!shop) throw { statusCode: 404, message: "Shop not found" };
    await prisma.shop.delete({ where: { id } });
    return { success: true };
  });

  // ── SHOPPING ITEMS ─────────────────────────────────────────────────────────

  app.get("/api/shopping/items", async (req) => {
    const query = req.query as { shopId?: string; status?: string; category?: string };
    const householdId = await getUserHouseholdId(req.userId!);

    const orClauses: any[] = [{ userId: req.userId }];
    if (householdId) orClauses.push({ householdId });

    const where: any = { OR: orClauses };
    if (query.shopId) where.shopId = query.shopId;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    return prisma.shoppingItem.findMany({
      where,
      include: { shop: { select: { id: true, name: true, color: true, icon: true } } },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  });

  app.post("/api/shopping/items", async (req) => {
    const body = req.body as any;
    return prisma.shoppingItem.create({
      data: {
        userId: req.userId!,
        shopId: body.shopId || null,
        name: body.name,
        quantity: body.quantity || "1",
        category: body.category || "",
        notes: body.notes || "",
        url: body.url || "",
        price: body.price ? parseFloat(body.price) : null,
        status: body.status || "pending",
        addedBy: body.addedBy || "user",
        priority: body.priority || "normal",
      },
      include: { shop: { select: { id: true, name: true, color: true, icon: true } } },
    });
  });

  app.put("/api/shopping/items/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const item = await prisma.shoppingItem.findFirst({ where: { id, userId: req.userId } });
    if (!item) throw { statusCode: 404, message: "Item not found" };
    return prisma.shoppingItem.update({
      where: { id },
      data: {
        name: body.name,
        quantity: body.quantity,
        category: body.category,
        notes: body.notes,
        url: body.url,
        price: body.price !== undefined ? (body.price ? parseFloat(body.price) : null) : undefined,
        status: body.status,
        priority: body.priority,
        shopId: body.shopId !== undefined ? (body.shopId || null) : undefined,
      },
      include: { shop: { select: { id: true, name: true, color: true, icon: true } } },
    });
  });

  app.delete("/api/shopping/items/:id", async (req) => {
    const { id } = req.params as { id: string };
    const item = await prisma.shoppingItem.findFirst({ where: { id, userId: req.userId } });
    if (!item) throw { statusCode: 404, message: "Item not found" };
    await prisma.shoppingItem.delete({ where: { id } });
    return { success: true };
  });

  app.post("/api/shopping/items/:id/status", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const item = await prisma.shoppingItem.findFirst({ where: { id, userId: req.userId } });
    if (!item) throw { statusCode: 404, message: "Item not found" };
    return prisma.shoppingItem.update({
      where: { id },
      data: { status: body.status },
      include: { shop: { select: { id: true, name: true, color: true, icon: true } } },
    });
  });

  // ── PRICE ALERTS ───────────────────────────────────────────────────────────

  app.get("/api/shopping/alerts", async (req) => {
    return prisma.priceAlert.findMany({
      where: { userId: req.userId },
      include: {
        shop: { select: { id: true, name: true, color: true } },
        history: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/api/shopping/alerts", async (req) => {
    const body = req.body as any;
    const asin = body.productUrl ? extractAsin(body.productUrl) : "";
    return prisma.priceAlert.create({
      data: {
        userId: req.userId!,
        shopId: body.shopId || null,
        productName: body.productName,
        productUrl: body.productUrl,
        asin,
        targetPrice: parseFloat(body.targetPrice),
        currency: body.currency || "USD",
        notes: body.notes || "",
      },
      include: { shop: { select: { id: true, name: true, color: true } } },
    });
  });

  app.put("/api/shopping/alerts/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const alert = await prisma.priceAlert.findFirst({ where: { id, userId: req.userId } });
    if (!alert) throw { statusCode: 404, message: "Alert not found" };
    return prisma.priceAlert.update({
      where: { id },
      data: {
        productName: body.productName,
        productUrl: body.productUrl,
        targetPrice: body.targetPrice !== undefined ? parseFloat(body.targetPrice) : undefined,
        active: body.active !== undefined ? body.active : undefined,
        triggered: body.triggered !== undefined ? body.triggered : undefined,
        notes: body.notes,
        shopId: body.shopId !== undefined ? (body.shopId || null) : undefined,
      },
    });
  });

  app.delete("/api/shopping/alerts/:id", async (req) => {
    const { id } = req.params as { id: string };
    const alert = await prisma.priceAlert.findFirst({ where: { id, userId: req.userId } });
    if (!alert) throw { statusCode: 404, message: "Alert not found" };
    await prisma.priceAlert.delete({ where: { id } });
    return { success: true };
  });

  app.post("/api/shopping/alerts/:id/check", async (req) => {
    const { id } = req.params as { id: string };
    const alert = await prisma.priceAlert.findFirst({ where: { id, userId: req.userId } });
    if (!alert) throw { statusCode: 404, message: "Alert not found" };

    let result: { price: number | null; title: string | null; currency: string };
    try {
      result = await scrapePrice(alert.productUrl);
    } catch {
      result = { price: null, title: null, currency: alert.currency };
    }

    if (result.price !== null) {
      await prisma.priceHistory.create({ data: { alertId: alert.id, price: result.price } });
      const updateData: any = { currentPrice: result.price, lastChecked: new Date() };

      let justTriggered = false;
      if (!alert.triggered && result.price <= alert.targetPrice) {
        updateData.triggered = true;
        justTriggered = true;
      }

      await prisma.priceAlert.update({ where: { id: alert.id }, data: updateData });

      if (justTriggered) {
        const msg = `Price alert: "${alert.productName}" is now ${result.price} ${alert.currency} (target: ${alert.targetPrice})`;
        await createNotification(alert.userId, "info", "Price Alert!", msg, "/tools/shopping");
        sendAlert(alert.userId, msg).catch(() => {});
      }

      return { price: result.price, currency: result.currency, triggered: justTriggered || alert.triggered };
    }

    await prisma.priceAlert.update({ where: { id: alert.id }, data: { lastChecked: new Date() } });
    return { price: null, currency: alert.currency, triggered: alert.triggered, error: "Could not fetch price" };
  });

  app.get("/api/shopping/alerts/:id/history", async (req) => {
    const { id } = req.params as { id: string };
    const alert = await prisma.priceAlert.findFirst({ where: { id, userId: req.userId } });
    if (!alert) throw { statusCode: 404, message: "Alert not found" };
    return prisma.priceHistory.findMany({
      where: { alertId: id },
      orderBy: { createdAt: "asc" },
    });
  });

  // ── SHOPPING RULES ─────────────────────────────────────────────────────────

  app.get("/api/shopping/rules", async (req) => {
    return prisma.shoppingRule.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/api/shopping/rules", async (req) => {
    const body = req.body as any;
    return prisma.shoppingRule.create({
      data: {
        userId: req.userId!,
        shopId: body.shopId || null,
        itemName: body.itemName,
        quantity: body.quantity || "1",
        category: body.category || "",
        trigger: body.trigger || "weekly",
        enabled: body.enabled !== undefined ? body.enabled : true,
      },
    });
  });

  app.put("/api/shopping/rules/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const rule = await prisma.shoppingRule.findFirst({ where: { id, userId: req.userId } });
    if (!rule) throw { statusCode: 404, message: "Rule not found" };
    return prisma.shoppingRule.update({
      where: { id },
      data: {
        itemName: body.itemName,
        quantity: body.quantity,
        category: body.category,
        trigger: body.trigger,
        enabled: body.enabled !== undefined ? body.enabled : undefined,
        shopId: body.shopId !== undefined ? (body.shopId || null) : undefined,
      },
    });
  });

  app.delete("/api/shopping/rules/:id", async (req) => {
    const { id } = req.params as { id: string };
    const rule = await prisma.shoppingRule.findFirst({ where: { id, userId: req.userId } });
    if (!rule) throw { statusCode: 404, message: "Rule not found" };
    await prisma.shoppingRule.delete({ where: { id } });
    return { success: true };
  });

  // ── AMAZON SEARCH ──────────────────────────────────────────────────────────

  app.post("/api/shopping/search", async (req) => {
    const body = req.body as any;
    const query = body.query || "";
    const marketplace = body.marketplace || "com";
    if (!query) throw { statusCode: 400, message: "query is required" };
    const results = await searchAmazon(query, marketplace);
    return { results };
  });
}
