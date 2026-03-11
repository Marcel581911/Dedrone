import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Card, Btn, Badge, Input, Label } from "../components/ui";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number, currency = "EUR") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

const fmtDec = (n: number, currency = "EUR") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

const ACCOUNT_TYPES = ["checking", "savings", "investment", "cash", "crypto", "other"];
const ASSET_TYPES = ["real_estate", "vehicle", "crypto", "nft", "collectible", "other"];
const DEBT_TYPES = ["mortgage", "car_loan", "personal_loan", "credit_card", "student_loan", "other"];
const CATEGORIES = ["Income", "Housing", "Food", "Transport", "Healthcare", "Utilities", "Entertainment", "Shopping", "Savings", "Education", "Travel", "Insurance", "Other"];
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"];

const typeLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const statColor = (n: number) => n >= 0 ? "#10b981" : "#f87171";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card>
      <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-xl font-semibold" style={{ color: color || "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </Card>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [summary, setSummary] = useState<any>(null);
  const [spending, setSpending] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.financeSummary(), api.getSpending()])
      .then(([s, sp]) => { setSummary(s); setSpending(sp); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>Loading...</p>;
  if (!summary) return <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No data yet — add accounts, assets, or investments to get started.</p>;

  const netWorthColor = summary.netWorth >= 0 ? "#10b981" : "#f87171";

  return (
    <div className="space-y-5">
      {/* Net worth hero */}
      <Card style={{ borderColor: "var(--accent)" }}>
        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Net Worth</p>
        <p className="text-3xl font-bold" style={{ color: netWorthColor }}>{fmt(summary.netWorth)}</p>
        <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>Assets: <strong style={{ color: "var(--text-primary)" }}>{fmt(summary.totalAssets)}</strong></span>
          <span>Liabilities: <strong style={{ color: "#f87171" }}>{fmt(summary.totalLiabilities)}</strong></span>
        </div>
      </Card>

      {/* Month stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Cash & Bank" value={fmt(summary.cashTotal)} />
        <StatCard label="Investments" value={fmt(summary.stockCostBasis)} sub="cost basis" />
        <StatCard label="This month in" value={fmt(summary.monthlyIncome)} color="#10b981" />
        <StatCard label="This month out" value={fmt(summary.monthlyExpenses)} color="#f87171" />
      </div>

      {/* Asset breakdown */}
      {summary.breakdown?.length > 0 && (
        <Card>
          <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Asset breakdown</h3>
          <div className="space-y-2">
            {summary.breakdown.map((b: any) => {
              const pctVal = summary.totalAssets > 0 ? (b.value / summary.totalAssets) * 100 : 0;
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: "var(--text-primary)" }}>{typeLabel(b.label)}</span>
                    <span style={{ color: "var(--text-muted)" }}>{fmt(b.value)} — {pctVal.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pctVal}%`, background: "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Spending this month */}
      {spending?.categories?.length > 0 && (
        <Card>
          <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Spending this month — {fmt(spending.total)}</h3>
          <div className="space-y-2">
            {spending.categories.slice(0, 8).map((c: any) => (
              <div key={c.category}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span style={{ color: "var(--text-primary)" }}>{c.category}</span>
                  <span style={{ color: "var(--text-muted)" }}>{fmtDec(c.amount)} — {c.pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: "#f59e0b" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Accounts Tab ─────────────────────────────────────────────────────────────
function AccountsTab() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [txFilter, setTxFilter] = useState({ category: "", search: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", type: "checking", currency: "EUR", balance: "", institution: "", color: COLORS[0] });
  const [txForm, setTxForm] = useState({ date: new Date().toISOString().slice(0, 10), description: "", amount: "", category: "Other", notes: "" });
  const [editTxId, setEditTxId] = useState<string | null>(null);
  const [editTxData, setEditTxData] = useState({ category: "", notes: "" });

  const loadAccounts = () => api.getAccounts().then(setAccounts).catch(() => {});
  useEffect(() => { loadAccounts(); }, []);

  const loadTxs = (accountId: string) => {
    const params: Record<string, string> = { accountId, limit: "200" };
    if (txFilter.category) params.category = txFilter.category;
    if (txFilter.search) params.search = txFilter.search;
    api.getTransactions(params).then(setTxs).catch(() => {});
  };

  useEffect(() => { if (selected) loadTxs(selected); }, [selected, txFilter]);

  const saveAccount = async () => {
    try {
      if (editId) {
        await api.updateAccount(editId, form);
      } else {
        await api.createAccount(form);
      }
      setAddOpen(false); setEditId(null);
      setForm({ name: "", type: "checking", currency: "EUR", balance: "", institution: "", color: COLORS[0] });
      loadAccounts();
    } catch (e: any) { alert(e.message); }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("Delete account and all its transactions?")) return;
    await api.deleteAccount(id).catch(() => {});
    if (selected === id) { setSelected(null); setTxs([]); }
    loadAccounts();
  };

  const startEdit = (a: any) => {
    setForm({ name: a.name, type: a.type, currency: a.currency, balance: String(a.balance), institution: a.institution || "", color: a.color || COLORS[0] });
    setEditId(a.id); setAddOpen(true);
  };

  const importStatement = async (accountId: string) => {
    fileRef.current?.click();
    // store which account we're importing into
    setImporting(accountId);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importing) return;
    try {
      const r = await api.importStatement(importing, file);
      setImportResult(r.message || `Imported ${r.imported} transactions`);
      if (selected === importing) loadTxs(importing);
      loadAccounts();
    } catch (err: any) {
      setImportResult("Error: " + err.message);
    }
    e.target.value = "";
  };

  const addTx = async () => {
    if (!selected) return;
    try {
      await api.createTransaction({ ...txForm, accountId: selected, amount: parseFloat(txForm.amount) });
      setAddTxOpen(false);
      setTxForm({ date: new Date().toISOString().slice(0, 10), description: "", amount: "", category: "Other", notes: "" });
      loadTxs(selected);
    } catch (e: any) { alert(e.message); }
  };

  const saveTxEdit = async (id: string) => {
    await api.updateTransaction(id, editTxData).catch(() => {});
    setEditTxId(null);
    if (selected) loadTxs(selected);
  };

  const deleteTx = async (id: string) => {
    await api.deleteTransaction(id).catch(() => {});
    setTxs(txs.filter(t => t.id !== id));
  };

  const selectedAccount = accounts.find(a => a.id === selected);

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept=".csv,.pdf" className="hidden" onChange={onFileChange} />

      {importResult && (
        <div className="p-3 rounded text-xs" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
          {importResult} <button className="ml-2 underline" onClick={() => setImportResult(null)}>dismiss</button>
        </div>
      )}

      {/* Accounts list */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Bank Accounts ({accounts.length})</h3>
        <Btn variant="primary" onClick={() => { setAddOpen(true); setEditId(null); setForm({ name: "", type: "checking", currency: "EUR", balance: "", institution: "", color: COLORS[0] }); }} style={{ padding: "4px 12px", fontSize: 11 }}>+ Add Account</Btn>
      </div>

      {addOpen && (
        <Card style={{ borderColor: "var(--accent)" }}>
          <h4 className="text-xs font-medium mb-3" style={{ color: "var(--text-primary)" }}>{editId ? "Edit Account" : "New Account"}</h4>
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Main Checking" /></div>
            <div><Label>Type</Label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} placeholder="EUR" /></div>
            <div><Label>Balance</Label><Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} placeholder="0" /></div>
            <div><Label>Institution</Label><Input value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder="Bank name" /></div>
            <div><Label>Color</Label>
              <div className="flex gap-1.5 mt-1">
                {COLORS.map(c => <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-5 h-5 rounded-full border-2" style={{ background: c, borderColor: form.color === c ? "var(--text-primary)" : "transparent" }} />)}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3"><Btn variant="primary" onClick={saveAccount}>{editId ? "Save" : "Create"}</Btn><Btn onClick={() => { setAddOpen(false); setEditId(null); }}>Cancel</Btn></div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map(a => (
          <div key={a.id} onClick={() => setSelected(selected === a.id ? null : a.id)} className="cursor-pointer">
            <Card style={{ borderColor: selected === a.id ? "var(--accent)" : undefined }}>
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: a.color || "var(--accent)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                    <span className="text-sm font-semibold ml-2" style={{ color: "var(--text-primary)" }}>{fmt(a.balance, a.currency)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge>{typeLabel(a.type)}</Badge>
                    {a.institution && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{a.institution}</span>}
                  </div>
                  <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                    <button className="text-[10px] underline" style={{ color: "var(--accent)" }} onClick={() => { setSelected(a.id); importStatement(a.id); }}>Import statement</button>
                    <button className="text-[10px] underline" style={{ color: "var(--text-muted)" }} onClick={() => startEdit(a)}>Edit</button>
                    <button className="text-[10px]" style={{ color: "#f87171" }} onClick={() => deleteAccount(a.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-sm col-span-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>No accounts yet. Add one to get started.</p>}
      </div>

      {/* Transactions panel */}
      {selected && selectedAccount && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Transactions — {selectedAccount.name}</h3>
            <div className="flex gap-2">
              <Input placeholder="Search..." value={txFilter.search} onChange={e => setTxFilter({ ...txFilter, search: e.target.value })} style={{ width: 140, padding: "3px 8px", fontSize: 11 }} />
              <select value={txFilter.category} onChange={e => setTxFilter({ ...txFilter, category: e.target.value })} className="px-2 py-1 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Btn variant="primary" onClick={() => setAddTxOpen(!addTxOpen)} style={{ padding: "4px 10px", fontSize: 11 }}>+ Add</Btn>
            </div>
          </div>

          {addTxOpen && (
            <Card className="mb-3" style={{ borderColor: "var(--accent)" }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
                <div><Label>Date</Label><Input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} /></div>
                <div><Label>Amount (- expense)</Label><Input type="number" step="0.01" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} placeholder="-50.00" /></div>
                <div><Label>Category</Label>
                  <select value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2"><Label>Description</Label><Input value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} placeholder="Grocery store" /></div>
                <div><Label>Notes</Label><Input value={txForm.notes} onChange={e => setTxForm({ ...txForm, notes: e.target.value })} placeholder="" /></div>
              </div>
              <div className="flex gap-2 mt-3"><Btn variant="primary" onClick={addTx}>Add</Btn><Btn onClick={() => setAddTxOpen(false)}>Cancel</Btn></div>
            </Card>
          )}

          <Card style={{ padding: 0 }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Date", "Description", "Category", "Amount", ""].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                        {editTxId === tx.id
                          ? <Input value={editTxData.notes} onChange={e => setEditTxData({ ...editTxData, notes: e.target.value })} placeholder="Notes" style={{ padding: "2px 6px", fontSize: 11 }} />
                          : <span>{tx.description}{tx.notes && <span style={{ color: "var(--text-muted)" }}> — {tx.notes}</span>}</span>
                        }
                      </td>
                      <td className="px-3 py-2">
                        {editTxId === tx.id
                          ? <select value={editTxData.category} onChange={e => setEditTxData({ ...editTxData, category: e.target.value })} className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          : <Badge>{tx.category}</Badge>
                        }
                      </td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap text-right" style={{ color: tx.amount >= 0 ? "#10b981" : "#f87171" }}>
                        {fmtDec(tx.amount, tx.account?.currency || selectedAccount.currency)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        {editTxId === tx.id
                          ? <><button className="text-[10px] underline mr-2" style={{ color: "var(--accent)" }} onClick={() => saveTxEdit(tx.id)}>Save</button><button className="text-[10px]" style={{ color: "var(--text-muted)" }} onClick={() => setEditTxId(null)}>Cancel</button></>
                          : <><button className="text-[10px] underline mr-2" style={{ color: "var(--text-muted)" }} onClick={() => { setEditTxId(tx.id); setEditTxData({ category: tx.category, notes: tx.notes || "" }); }}>Edit</button><button className="text-[10px]" style={{ color: "#f87171" }} onClick={() => deleteTx(tx.id)}>Del</button></>
                        }
                      </td>
                    </tr>
                  ))}
                  {txs.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>No transactions. Import a statement or add manually.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Portfolio Tab ─────────────────────────────────────────────────────────────
function PortfolioTab() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [quotesAt, setQuotesAt] = useState<string | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ticker: "", name: "", shares: "", avgCost: "", currency: "USD" });

  const loadHoldings = () => api.getStocks().then(setHoldings).catch(() => {});
  const refreshPrices = () => {
    setLoadingPrices(true);
    api.getStockPrices().then(r => { setQuotes(r.quotes || {}); setQuotesAt(r.updatedAt); }).catch(() => {}).finally(() => setLoadingPrices(false));
  };

  useEffect(() => { loadHoldings(); refreshPrices(); }, []);

  const save = async () => {
    try {
      if (editId) {
        await api.updateStock(editId, { shares: parseFloat(form.shares), avgCost: parseFloat(form.avgCost), name: form.name, currency: form.currency });
      } else {
        await api.createStock({ ticker: form.ticker, name: form.name, shares: parseFloat(form.shares), avgCost: parseFloat(form.avgCost), currency: form.currency });
      }
      setAddOpen(false); setEditId(null);
      setForm({ ticker: "", name: "", shares: "", avgCost: "", currency: "USD" });
      loadHoldings();
      refreshPrices();
    } catch (e: any) { alert(e.message); }
  };

  const del = async (id: string) => {
    await api.deleteStock(id).catch(() => {});
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const startEdit = (h: any) => {
    setForm({ ticker: h.ticker, name: h.name, shares: String(h.shares), avgCost: String(h.avgCost), currency: h.currency });
    setEditId(h.id); setAddOpen(true);
  };

  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0);
  const totalLive = holdings.reduce((s, h) => {
    const q = quotes[h.ticker];
    return s + h.shares * (q?.price || h.avgCost);
  }, 0);
  const totalGain = totalLive - totalCost;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Portfolio ({holdings.length} positions)</h3>
          {holdings.length > 0 && (
            <p className="text-sm mt-0.5">
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Live: {fmt(totalLive, "USD")}</span>
              <span className="ml-2 text-xs" style={{ color: statColor(totalGain) }}>{totalGain >= 0 ? "+" : ""}{fmt(totalGain, "USD")} ({pct(totalCost > 0 ? (totalGain / totalCost) * 100 : 0)})</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Btn onClick={refreshPrices} disabled={loadingPrices} style={{ padding: "4px 12px", fontSize: 11 }}>{loadingPrices ? "..." : "↻ Refresh"}</Btn>
          <Btn variant="primary" onClick={() => { setAddOpen(true); setEditId(null); setForm({ ticker: "", name: "", shares: "", avgCost: "", currency: "USD" }); }} style={{ padding: "4px 12px", fontSize: 11 }}>+ Add Position</Btn>
        </div>
      </div>

      {quotesAt && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Prices as of {new Date(quotesAt).toLocaleTimeString()}</p>}

      {addOpen && (
        <Card style={{ borderColor: "var(--accent)" }}>
          <h4 className="text-xs font-medium mb-3" style={{ color: "var(--text-primary)" }}>{editId ? "Edit Position" : "Add Position"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
            {!editId && <div><Label>Ticker / Symbol</Label><Input value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="AAPL" /></div>}
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Apple Inc." /></div>
            <div><Label>Shares</Label><Input type="number" step="0.0001" value={form.shares} onChange={e => setForm({ ...form, shares: e.target.value })} placeholder="10" /></div>
            <div><Label>Avg Cost / Share</Label><Input type="number" step="0.01" value={form.avgCost} onChange={e => setForm({ ...form, avgCost: e.target.value })} placeholder="150.00" /></div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} placeholder="USD" /></div>
          </div>
          <div className="flex gap-2 mt-3"><Btn variant="primary" onClick={save}>{editId ? "Save" : "Add"}</Btn><Btn onClick={() => { setAddOpen(false); setEditId(null); }}>Cancel</Btn></div>
        </Card>
      )}

      <Card style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Ticker", "Shares", "Avg Cost", "Live Price", "Value", "Gain/Loss", ""].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const q = quotes[h.ticker];
                const livePrice = q?.price || null;
                const liveValue = livePrice ? h.shares * livePrice : null;
                const costBasis = h.shares * h.avgCost;
                const gain = liveValue !== null ? liveValue - costBasis : null;
                const gainPct = gain !== null && costBasis > 0 ? (gain / costBasis) * 100 : null;
                return (
                  <tr key={h.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-3 py-2">
                      <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{h.ticker}</div>
                      <div style={{ color: "var(--text-muted)" }}>{h.name}</div>
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{h.shares.toLocaleString()}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{fmtDec(h.avgCost, h.currency)}</td>
                    <td className="px-3 py-2">
                      {livePrice
                        ? <div>
                            <div style={{ color: "var(--text-primary)" }}>{fmtDec(livePrice, h.currency)}</div>
                            {q?.changePercent !== undefined && <div style={{ color: statColor(q.changePercent) }}>{pct(q.changePercent)}</div>}
                          </div>
                        : <span style={{ color: "var(--text-muted)" }}>—</span>
                      }
                    </td>
                    <td className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>
                      {liveValue !== null ? fmt(liveValue, h.currency) : fmt(costBasis, h.currency)}
                    </td>
                    <td className="px-3 py-2">
                      {gain !== null
                        ? <div style={{ color: statColor(gain) }}>
                            <div>{gain >= 0 ? "+" : ""}{fmtDec(gain, h.currency)}</div>
                            {gainPct !== null && <div>{pct(gainPct)}</div>}
                          </div>
                        : <span style={{ color: "var(--text-muted)" }}>—</span>
                      }
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button className="text-[10px] underline mr-2" style={{ color: "var(--text-muted)" }} onClick={() => startEdit(h)}>Edit</button>
                      <button className="text-[10px]" style={{ color: "#f87171" }} onClick={() => del(h.id)}>Del</button>
                    </td>
                  </tr>
                );
              })}
              {holdings.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>No positions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Assets Tab ────────────────────────────────────────────────────────────────
function AssetsTab() {
  const [assets, setAssets] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm = { name: "", type: "real_estate", value: "", currency: "EUR", purchasePrice: "", purchaseDate: "", notes: "" };
  const [form, setForm] = useState({ ...emptyForm });

  const load = () => api.getAssets().then(setAssets).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const data = { ...form, value: parseFloat(form.value) || 0, purchasePrice: parseFloat(form.purchasePrice) || 0 };
      if (editId) { await api.updateAsset(editId, data); } else { await api.createAsset(data); }
      setAddOpen(false); setEditId(null); setForm({ ...emptyForm }); load();
    } catch (e: any) { alert(e.message); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    await api.deleteAsset(id).catch(() => {});
    setAssets(assets.filter(a => a.id !== id));
  };

  const startEdit = (a: any) => {
    setForm({ name: a.name, type: a.type, value: String(a.value), currency: a.currency, purchasePrice: String(a.purchasePrice || ""), purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : "", notes: a.notes || "" });
    setEditId(a.id); setAddOpen(true);
  };

  const total = assets.reduce((s, a) => s + a.value, 0);

  // Group by type
  const grouped: Record<string, any[]> = {};
  for (const a of assets) {
    if (!grouped[a.type]) grouped[a.type] = [];
    grouped[a.type].push(a);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Assets ({assets.length})</h3>
          {assets.length > 0 && <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>Total: {fmt(total)}</p>}
        </div>
        <Btn variant="primary" onClick={() => { setAddOpen(true); setEditId(null); setForm({ ...emptyForm }); }} style={{ padding: "4px 12px", fontSize: 11 }}>+ Add Asset</Btn>
      </div>

      {addOpen && (
        <Card style={{ borderColor: "var(--accent)" }}>
          <h4 className="text-xs font-medium mb-3" style={{ color: "var(--text-primary)" }}>{editId ? "Edit Asset" : "New Asset"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Family home" /></div>
            <div><Label>Type</Label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </div>
            <div><Label>Current Value</Label><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="250000" /></div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
            <div><Label>Purchase Price</Label><Input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} placeholder="200000" /></div>
            <div><Label>Purchase Date</Label><Input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} /></div>
            <div className="md:col-span-3"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 mt-3"><Btn variant="primary" onClick={save}>{editId ? "Save" : "Create"}</Btn><Btn onClick={() => { setAddOpen(false); setEditId(null); }}>Cancel</Btn></div>
        </Card>
      )}

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>No assets yet. Add real estate, vehicles, crypto, collectibles, etc.</p>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>{typeLabel(type)} — {fmt(items.reduce((s, a) => s + a.value, 0))}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(a => {
              const gain = a.purchasePrice ? a.value - a.purchasePrice : null;
              const gainPct = gain !== null && a.purchasePrice > 0 ? (gain / a.purchasePrice) * 100 : null;
              return (
                <Card key={a.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</p>
                      {a.notes && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{a.notes}</p>}
                      {gain !== null && (
                        <p className="text-[11px] mt-1" style={{ color: statColor(gain) }}>
                          {gain >= 0 ? "+" : ""}{fmt(gain, a.currency)} {gainPct !== null && `(${pct(gainPct)})`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(a.value, a.currency)}</p>
                      {a.purchasePrice > 0 && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Cost: {fmt(a.purchasePrice, a.currency)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="text-[10px] underline" style={{ color: "var(--text-muted)" }} onClick={() => startEdit(a)}>Edit</button>
                    <button className="text-[10px]" style={{ color: "#f87171" }} onClick={() => del(a.id)}>Delete</button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Debts Tab ─────────────────────────────────────────────────────────────────
function DebtsTab() {
  const [debts, setDebts] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm = { name: "", type: "other", balance: "", originalAmount: "", interestRate: "", monthlyPayment: "", currency: "EUR", dueDate: "", notes: "" };
  const [form, setForm] = useState({ ...emptyForm });

  const load = () => api.getDebts().then(setDebts).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const data = { ...form, balance: parseFloat(form.balance) || 0, originalAmount: parseFloat(form.originalAmount) || 0, interestRate: parseFloat(form.interestRate) || 0, monthlyPayment: parseFloat(form.monthlyPayment) || 0 };
      if (editId) { await api.updateDebt(editId, data); } else { await api.createDebt(data); }
      setAddOpen(false); setEditId(null); setForm({ ...emptyForm }); load();
    } catch (e: any) { alert(e.message); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this debt?")) return;
    await api.deleteDebt(id).catch(() => {});
    setDebts(debts.filter(d => d.id !== id));
  };

  const startEdit = (d: any) => {
    setForm({ name: d.name, type: d.type, balance: String(d.balance), originalAmount: String(d.originalAmount || ""), interestRate: String(d.interestRate || ""), monthlyPayment: String(d.monthlyPayment || ""), currency: d.currency, dueDate: d.dueDate ? d.dueDate.slice(0, 10) : "", notes: d.notes || "" });
    setEditId(d.id); setAddOpen(true);
  };

  const total = debts.reduce((s, d) => s + d.balance, 0);
  const totalMonthly = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Debts & Liabilities ({debts.length})</h3>
          {debts.length > 0 && (
            <div className="flex gap-4 mt-0.5">
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Total: {fmt(total)}</p>
              {totalMonthly > 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Monthly: {fmt(totalMonthly)}/mo</p>}
            </div>
          )}
        </div>
        <Btn variant="primary" onClick={() => { setAddOpen(true); setEditId(null); setForm({ ...emptyForm }); }} style={{ padding: "4px 12px", fontSize: 11 }}>+ Add Debt</Btn>
      </div>

      {addOpen && (
        <Card style={{ borderColor: "var(--accent)" }}>
          <h4 className="text-xs font-medium mb-3" style={{ color: "var(--text-primary)" }}>{editId ? "Edit Debt" : "New Debt"}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Home mortgage" /></div>
            <div><Label>Type</Label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                {DEBT_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </div>
            <div><Label>Current Balance</Label><Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} placeholder="150000" /></div>
            <div><Label>Original Amount</Label><Input type="number" value={form.originalAmount} onChange={e => setForm({ ...form, originalAmount: e.target.value })} placeholder="200000" /></div>
            <div><Label>Interest Rate %</Label><Input type="number" step="0.01" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="3.5" /></div>
            <div><Label>Monthly Payment</Label><Input type="number" value={form.monthlyPayment} onChange={e => setForm({ ...form, monthlyPayment: e.target.value })} placeholder="800" /></div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 mt-3"><Btn variant="primary" onClick={save}>{editId ? "Save" : "Create"}</Btn><Btn onClick={() => { setAddOpen(false); setEditId(null); }}>Cancel</Btn></div>
        </Card>
      )}

      {debts.length === 0 && (
        <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>No debts recorded. Add mortgages, loans, credit cards, etc.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {debts.map(d => {
          const paidPct = d.originalAmount > 0 ? Math.min(100, ((d.originalAmount - d.balance) / d.originalAmount) * 100) : 0;
          return (
            <Card key={d.id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                  <Badge>{typeLabel(d.type)}</Badge>
                  {d.interestRate > 0 && <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>{d.interestRate}% APR</span>}
                </div>
                <p className="text-sm font-semibold" style={{ color: "#f87171" }}>{fmt(d.balance, d.currency)}</p>
              </div>

              {d.originalAmount > 0 && (
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>
                    <span>Paid off: {paidPct.toFixed(1)}%</span>
                    <span>Original: {fmt(d.originalAmount, d.currency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                    <div className="h-full rounded-full" style={{ width: `${paidPct}%`, background: "#10b981" }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                <span>{d.monthlyPayment > 0 && `${fmt(d.monthlyPayment, d.currency)}/mo`}</span>
                <div className="flex gap-2">
                  <button className="underline" style={{ color: "var(--text-muted)" }} onClick={() => startEdit(d)}>Edit</button>
                  <button style={{ color: "#f87171" }} onClick={() => del(d.id)}>Delete</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
const TABS = ["Overview", "Accounts", "Portfolio", "Assets", "Debts"] as const;
type Tab = typeof TABS[number];

export default function Finance() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      <div className="flex gap-0.5 mb-5 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-2 text-xs font-medium whitespace-nowrap relative shrink-0"
            style={{ color: tab === t ? "var(--accent)" : "var(--text-muted)" }}>
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent)" }} />}
          </button>
        ))}
      </div>
      {tab === "Overview" && <OverviewTab />}
      {tab === "Accounts" && <AccountsTab />}
      {tab === "Portfolio" && <PortfolioTab />}
      {tab === "Assets" && <AssetsTab />}
      {tab === "Debts" && <DebtsTab />}
    </div>
  );
}
