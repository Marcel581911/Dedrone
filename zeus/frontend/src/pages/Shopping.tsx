import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Card, Btn, Badge, Input, Label } from "../components/ui";

// ── helpers ────────────────────────────────────────────────────────────────

function fmtPrice(p: number | null | undefined, currency = "USD") {
  if (p == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(p);
}

function timeSince(dateStr: string | null | undefined) {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PRIORITY_COLOR: Record<string, string> = { high: "#f87171", normal: "var(--text-muted)", low: "#6ee7b7" };
const PRIORITY_LABEL: Record<string, string> = { high: "!", normal: "", low: "↓" };

const SHOP_COLORS = ["#FF9900", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];
const SHOP_ICONS = ["🛒", "🛍", "🏪", "🏬", "📦", "🥦", "💊", "💻", "👗", "🐾"];

// ── ShopBadge ─────────────────────────────────────────────────────────────

function ShopBadge({ shop, selected, onClick, count }: { shop: any; selected: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
      style={{
        background: selected ? (shop.color || "var(--accent)") : "var(--bg-input)",
        color: selected ? "#fff" : "var(--text-secondary)",
        border: `1px solid ${selected ? (shop.color || "var(--accent)") : "var(--border)"}`,
      }}
    >
      <span>{shop.icon || "🛒"}</span>
      <span>{shop.name}</span>
      {count != null && <span className="opacity-70">({count})</span>}
    </button>
  );
}

// ── ItemRow ────────────────────────────────────────────────────────────────

function ItemRow({ item, onStatusChange, onDelete, shops }: { item: any; onStatusChange: (id: string, status: string) => void; onDelete: (id: string) => void; shops: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = item.status === "pending";
  const isBought = item.status === "bought";
  const shop = shops.find((s: any) => s.id === item.shopId);

  return (
    <div
      className="flex items-start gap-2 py-2 px-1 rounded-lg transition-all"
      style={{ opacity: isBought ? 0.5 : 1, background: expanded ? "var(--bg-input)" : "transparent" }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onStatusChange(item.id, isBought ? "pending" : "bought")}
        className="w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5"
        style={{
          borderColor: isBought ? "var(--accent)" : "var(--border)",
          background: isBought ? "var(--accent)" : "transparent",
        }}
      >
        {isBought && <span className="text-white text-[10px]">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-sm cursor-pointer"
            style={{
              color: "var(--text-primary)",
              textDecoration: isBought ? "line-through" : "none",
              fontWeight: item.priority === "high" ? 600 : 400,
            }}
            onClick={() => setExpanded(!expanded)}
          >
            {item.name}
          </span>
          {item.quantity !== "1" && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>×{item.quantity}</span>
          )}
          {item.priority !== "normal" && (
            <span className="text-[10px] font-bold" style={{ color: PRIORITY_COLOR[item.priority] }}>
              {PRIORITY_LABEL[item.priority]}
            </span>
          )}
          {item.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
              {item.category}
            </span>
          )}
          {shop && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: shop.color + "22", color: shop.color }}>
              {shop.icon} {shop.name}
            </span>
          )}
          {item.addedBy === "agent" && (
            <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>AI</span>
          )}
          {item.addedBy === "rule" && (
            <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>auto</span>
          )}
        </div>
        {item.price != null && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{fmtPrice(item.price)}</span>
        )}
        {item.notes && !expanded && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{item.notes}</p>
        )}
        {expanded && (
          <div className="mt-1 space-y-0.5">
            {item.notes && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.notes}</p>}
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "var(--accent)" }}>
                View product
              </a>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isPending && (
          <button
            onClick={() => onStatusChange(item.id, "skipped")}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: "var(--text-muted)", background: "var(--bg-input)" }}
          >
            skip
          </button>
        )}
        {item.status === "skipped" && (
          <button
            onClick={() => onStatusChange(item.id, "pending")}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: "var(--accent)", background: "var(--accent-bg)" }}
          >
            undo
          </button>
        )}
        <button onClick={() => onDelete(item.id)} className="text-[10px] px-1 py-0.5 rounded" style={{ color: "#f87171" }}>✕</button>
      </div>
    </div>
  );
}

// ── AddItemForm ────────────────────────────────────────────────────────────

function AddItemForm({ shops, onAdd, defaultShopId }: { shops: any[]; onAdd: (item: any) => void; defaultShopId?: string }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("");
  const [shopId, setShopId] = useState(defaultShopId || "");
  const [priority, setPriority] = useState("normal");
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({ name: name.trim(), quantity, category, shopId: shopId || null, priority, notes });
    setName(""); setQuantity("1"); setCategory(""); setNotes("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="mt-3">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Add item..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setExpanded(true)}
          style={{ flex: 1 }}
        />
        <Btn type="submit" variant="primary" disabled={!name.trim()}>Add</Btn>
      </div>
      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <Label>Qty</Label>
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Produce" />
          </div>
          <div>
            <Label>Shop</Label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="w-full rounded text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "6px 8px" }}
            >
              <option value="">Any</option>
              {shops.map((s: any) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "6px 8px" }}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>
        </div>
      )}
    </form>
  );
}

// ── Tab: Lists ─────────────────────────────────────────────────────────────

function ListsTab({ shops, items, loading, onReload }: { shops: any[]; items: any[]; loading: boolean; onReload: () => void }) {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    if (selectedShopId && item.shopId !== selectedShopId) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  // Group by shop when showing all
  const byShop: Record<string, any[]> = {};
  for (const item of filtered) {
    const key = item.shopId || "__none__";
    if (!byShop[key]) byShop[key] = [];
    byShop[key].push(item);
  }

  const handleAdd = async (data: any) => {
    await api.createShoppingItem({ ...data, shopId: data.shopId || (selectedShopId || null) });
    onReload();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await api.setItemStatus(id, status);
    onReload();
  };

  const handleDelete = async (id: string) => {
    await api.deleteShoppingItem(id);
    onReload();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const r = await api.searchProducts(searchQuery);
      setSearchResults(r.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addFromSearch = async (product: any) => {
    setAdding(product.asin);
    try {
      const shopId = shops.find((s: any) => s.name === "Amazon")?.id || null;
      await api.createShoppingItem({
        name: product.title.slice(0, 100),
        url: product.url,
        price: product.price,
        shopId,
        addedBy: "user",
      });
      onReload();
    } finally {
      setAdding(null);
    }
  };

  const shopCounts = shops.map((s: any) => ({
    ...s,
    pendingCount: items.filter((i: any) => i.shopId === s.id && i.status === "pending").length,
  }));

  return (
    <div>
      {/* Shop filter */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <ShopBadge
          shop={{ name: "All", icon: "🏠", color: "var(--accent)" }}
          selected={selectedShopId === null}
          onClick={() => setSelectedShopId(null)}
          count={items.filter((i: any) => i.status === "pending").length}
        />
        {shopCounts.map((s: any) => (
          <ShopBadge
            key={s.id}
            shop={s}
            selected={selectedShopId === s.id}
            onClick={() => setSelectedShopId(s.id)}
            count={s.pendingCount}
          />
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-0.5 mb-3">
        {(["pending", "bought", "skipped", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-2.5 py-1 text-xs rounded"
            style={{
              background: statusFilter === s ? "var(--accent)" : "var(--bg-input)",
              color: statusFilter === s ? "#fff" : "var(--text-muted)",
            }}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Amazon Search */}
      <Card className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search Amazon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Btn type="submit" disabled={searching || !searchQuery.trim()}>
            {searching ? "..." : "Search"}
          </Btn>
        </form>
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
            {searchResults.map((p: any) => (
              <div key={p.asin} className="flex items-start gap-2 py-1">
                {p.image && (
                  <img src={p.image} alt="" className="w-10 h-10 object-contain rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-2" style={{ color: "var(--text-primary)" }}>{p.title}</p>
                  {p.price && <p className="text-xs" style={{ color: "var(--accent)" }}>${p.price.toFixed(2)}</p>}
                </div>
                <Btn
                  variant="primary"
                  onClick={() => addFromSearch(p)}
                  disabled={adding === p.asin}
                  style={{ fontSize: 11, padding: "4px 10px", shrink: 0 }}
                >
                  {adding === p.asin ? "..." : "Add"}
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Items */}
      <Card>
        {loading ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
            {statusFilter === "pending" ? "Nothing on your list yet." : "No items."}
          </p>
        ) : selectedShopId !== null ? (
          // Single shop view
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((item: any) => (
              <ItemRow key={item.id} item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} shops={shops} />
            ))}
          </div>
        ) : (
          // Grouped by shop
          <div className="space-y-4">
            {Object.entries(byShop).map(([shopId, shopItems]) => {
              const shop = shops.find((s: any) => s.id === shopId);
              return (
                <div key={shopId}>
                  {shop && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{shop.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: shop.color || "var(--text-secondary)" }}>{shop.name}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>({shopItems.length})</span>
                    </div>
                  )}
                  {!shop && shopId === "__none__" && (
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>General</p>
                  )}
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {shopItems.map((item: any) => (
                      <ItemRow key={item.id} item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} shops={shops} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add item form */}
        <div className="pt-2 mt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <AddItemForm shops={shops} onAdd={handleAdd} defaultShopId={selectedShopId || undefined} />
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Price Alerts ──────────────────────────────────────────────────────

function AlertsTab({ shops }: { shops: any[] }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productName: "", productUrl: "", targetPrice: "", shopId: "" });

  const load = () => api.getPriceAlerts().then(setAlerts).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCheck = async (id: string) => {
    setChecking(id);
    try {
      await api.checkPrice(id);
      await load();
    } finally {
      setChecking(null);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deletePriceAlert(id);
    await load();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await api.updatePriceAlert(id, { active });
    await load();
  };

  const handleReactivate = async (id: string) => {
    await api.updatePriceAlert(id, { triggered: false, active: true });
    await load();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName || !form.productUrl || !form.targetPrice) return;
    await api.createPriceAlert({ ...form, targetPrice: parseFloat(form.targetPrice) });
    setForm({ productName: "", productUrl: "", targetPrice: "", shopId: "" });
    setShowForm(false);
    await load();
  };

  const alertColor = (a: any) => {
    if (a.triggered) return "#3B82F6";
    if (!a.active) return "var(--text-muted)";
    if (a.currentPrice == null) return "var(--text-muted)";
    const diff = (a.currentPrice - a.targetPrice) / a.targetPrice;
    if (diff <= 0.05) return "#10B981";
    if (diff <= 0.2) return "#F59E0B";
    return "#f87171";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</p>
        <Btn variant="primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 11, padding: "4px 12px" }}>
          {showForm ? "Cancel" : "+ New Alert"}
        </Btn>
      </div>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Product Name *</Label>
                <Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="e.g. Sony WH-1000XM5" required />
              </div>
              <div>
                <Label>Target Price *</Label>
                <Input type="number" step="0.01" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} placeholder="e.g. 249.99" required />
              </div>
            </div>
            <div>
              <Label>Product URL *</Label>
              <Input value={form.productUrl} onChange={(e) => setForm({ ...form, productUrl: e.target.value })} placeholder="https://amazon.com/dp/..." required />
            </div>
            <div>
              <Label>Shop (optional)</Label>
              <select
                value={form.shopId}
                onChange={(e) => setForm({ ...form, shopId: e.target.value })}
                className="w-full rounded text-sm"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "6px 8px" }}
              >
                <option value="">Any</option>
                {shops.map((s: any) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <Btn type="submit" variant="primary">Create Alert</Btn>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : alerts.length === 0 ? (
        <Card>
          <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>No price alerts. Create one to track products.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const color = alertColor(alert);
            const priceDiff = alert.currentPrice != null
              ? ((alert.currentPrice - alert.targetPrice) / alert.targetPrice * 100).toFixed(1)
              : null;
            const recent5 = (alert.history || []).slice(0, 5).reverse();

            return (
              <Card key={alert.id}>
                <div className="flex items-start gap-3">
                  {/* Color indicator */}
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{alert.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Target: <strong style={{ color: "var(--text-primary)" }}>{fmtPrice(alert.targetPrice, alert.currency)}</strong>
                          </span>
                          {alert.currentPrice != null && (
                            <span className="text-xs" style={{ color }}>
                              Now: {fmtPrice(alert.currentPrice, alert.currency)}
                              {priceDiff && ` (${parseFloat(priceDiff) > 0 ? "+" : ""}${priceDiff}%)`}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {alert.triggered ? "Triggered!" : alert.active ? "Watching" : "Paused"}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Checked {timeSince(alert.lastChecked)}
                          </span>
                        </div>

                        {/* Mini price history */}
                        {recent5.length > 1 && (
                          <div className="flex items-end gap-1 mt-2 h-6">
                            {recent5.map((h: any, i: number) => {
                              const maxP = Math.max(...recent5.map((x: any) => x.price));
                              const minP = Math.min(...recent5.map((x: any) => x.price));
                              const range = maxP - minP || 1;
                              const pct = ((h.price - minP) / range) * 100;
                              const isAtTarget = h.price <= alert.targetPrice;
                              return (
                                <div key={i} className="flex flex-col items-center gap-0.5 w-4">
                                  <div
                                    className="w-full rounded-sm"
                                    style={{
                                      height: `${Math.max(4, pct * 0.2 + 4)}px`,
                                      background: isAtTarget ? "#10B981" : color,
                                      opacity: 0.7,
                                    }}
                                    title={`$${h.price.toFixed(2)}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <Btn
                          onClick={() => handleCheck(alert.id)}
                          disabled={checking === alert.id}
                          style={{ fontSize: 10, padding: "3px 8px" }}
                        >
                          {checking === alert.id ? "..." : "Check"}
                        </Btn>
                        {alert.triggered ? (
                          <button onClick={() => handleReactivate(alert.id)} className="text-[10px] underline" style={{ color: "var(--accent)" }}>
                            Rewatch
                          </button>
                        ) : (
                          <button onClick={() => handleToggle(alert.id, !alert.active)} className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {alert.active ? "Pause" : "Resume"}
                          </button>
                        )}
                        <button onClick={() => handleDelete(alert.id)} className="text-[10px]" style={{ color: "#f87171" }}>Delete</button>
                      </div>
                    </div>

                    {alert.shop && (
                      <span className="text-[10px] mt-1 inline-block" style={{ color: "var(--text-muted)" }}>
                        {alert.shop.icon} {alert.shop.name}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Rules ─────────────────────────────────────────────────────────────

function RulesTab({ shops }: { shops: any[] }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ itemName: "", quantity: "1", category: "", shopId: "", trigger: "weekly" });

  const load = () => api.getShoppingRules().then(setRules).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName) return;
    await api.createShoppingRule(form);
    setForm({ itemName: "", quantity: "1", category: "", shopId: "", trigger: "weekly" });
    setShowForm(false);
    await load();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await api.updateShoppingRule(id, { enabled });
    await load();
  };

  const handleDelete = async (id: string) => {
    await api.deleteShoppingRule(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{rules.length} rule{rules.length !== 1 ? "s" : ""}</p>
        <Btn variant="primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 11, padding: "4px 12px" }}>
          {showForm ? "Cancel" : "+ New Rule"}
        </Btn>
      </div>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Item Name *</Label>
                <Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Milk" required />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="1" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Dairy" />
              </div>
              <div>
                <Label>Frequency</Label>
                <select
                  value={form.trigger}
                  onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                  className="w-full rounded text-sm"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "6px 8px" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <Label>Shop (optional)</Label>
                <select
                  value={form.shopId}
                  onChange={(e) => setForm({ ...form, shopId: e.target.value })}
                  className="w-full rounded text-sm"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "6px 8px" }}
                >
                  <option value="">Any</option>
                  {shops.map((s: any) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
            </div>
            <Btn type="submit" variant="primary">Create Rule</Btn>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : rules.length === 0 ? (
        <Card>
          <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>No rules yet. Create rules to auto-add recurring items.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule: any) => {
            const shop = shops.find((s: any) => s.id === rule.shopId);
            return (
              <Card key={rule.id}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rule.itemName}</span>
                      {rule.quantity !== "1" && <span className="text-xs" style={{ color: "var(--text-muted)" }}>×{rule.quantity}</span>}
                      {rule.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                          {rule.category}
                        </span>
                      )}
                      <Badge color={rule.enabled ? "green" : "gray"}>{rule.trigger}</Badge>
                      {shop && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{shop.icon} {shop.name}</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Last run: {timeSince(rule.lastRun)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(rule.id, !rule.enabled)}
                      className="w-9 h-5 rounded-full relative transition-colors"
                      style={{ background: rule.enabled ? "var(--accent)" : "var(--bg-input)" }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                        style={{ transform: rule.enabled ? "translateX(18px)" : "translateX(2px)" }}
                      />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="text-[10px]" style={{ color: "#f87171" }}>Delete</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Shops ─────────────────────────────────────────────────────────────

function ShopsTab({ shops, onReload }: { shops: any[]; onReload: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", url: "", color: SHOP_COLORS[0], icon: "🛒" });

  const startEdit = (shop: any) => {
    setForm({ name: shop.name, url: shop.url, color: shop.color || SHOP_COLORS[0], icon: shop.icon || "🛒" });
    setEditingId(shop.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: "", url: "", color: SHOP_COLORS[0], icon: "🛒" });
    setEditingId(null);
    setShowForm(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    if (editingId) {
      await api.updateShop(editingId, form);
    } else {
      await api.createShop(form);
    }
    resetForm();
    onReload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shop? Items won't be deleted.")) return;
    await api.deleteShop(id);
    onReload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{shops.length} shop{shops.length !== 1 ? "s" : ""}</p>
        <Btn variant="primary" onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ fontSize: 11, padding: "4px 12px" }}>
          {showForm && !editingId ? "Cancel" : "+ New Shop"}
        </Btn>
      </div>

      {showForm && (
        <Card className="mb-4">
          <h4 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            {editingId ? "Edit Shop" : "New Shop"}
          </h4>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grocery Store" required />
            </div>
            <div>
              <Label>URL</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="flex gap-1.5 flex-wrap">
                {SHOP_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className="w-8 h-8 rounded text-lg flex items-center justify-center"
                    style={{ background: form.icon === icon ? "var(--accent-bg)" : "var(--bg-input)", border: `2px solid ${form.icon === icon ? "var(--accent)" : "transparent"}` }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {SHOP_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className="w-6 h-6 rounded-full"
                    style={{ background: color, border: `2px solid ${form.color === color ? "var(--text-primary)" : "transparent"}` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Btn type="submit" variant="primary">{editingId ? "Save" : "Create"}</Btn>
              <Btn type="button" onClick={resetForm}>Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {shops.map((shop: any) => (
          <Card key={shop.id}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ background: (shop.color || "#FF9900") + "22" }}
              >
                {shop.icon || "🛒"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{shop.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {(shop._count?.items ?? 0)} pending item{(shop._count?.items ?? 0) !== 1 ? "s" : ""}
                  {shop.url && ` · ${shop.url.replace(/^https?:\/\//, "").split("/")[0]}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(shop)} className="text-xs underline" style={{ color: "var(--accent)" }}>Edit</button>
                {!shop.isDefault && (
                  <button onClick={() => handleDelete(shop.id)} className="text-xs" style={{ color: "#f87171" }}>Delete</button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main Shopping Page ─────────────────────────────────────────────────────

const TABS = [
  { id: "lists", label: "Lists" },
  { id: "alerts", label: "Price Alerts" },
  { id: "rules", label: "Rules" },
  { id: "shops", label: "Shops" },
];

export default function Shopping() {
  const [tab, setTab] = useState("lists");
  const [shops, setShops] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShops = () => api.getShops().then(setShops).catch(() => {});
  const loadItems = () =>
    api.getShoppingItems().then(setItems).catch(() => {}).finally(() => setLoading(false));

  const reload = () => { loadShops(); loadItems(); };

  useEffect(() => { reload(); }, []);

  return (
    <div className="max-w-2xl">
      {/* Tab bar */}
      <div className="flex gap-0.5 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-2 text-xs font-medium whitespace-nowrap relative shrink-0"
            style={{ color: tab === t.id ? "var(--accent)" : "var(--text-muted)" }}
          >
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent)" }} />
            )}
          </button>
        ))}
      </div>

      {tab === "lists" && <ListsTab shops={shops} items={items} loading={loading} onReload={reload} />}
      {tab === "alerts" && <AlertsTab shops={shops} />}
      {tab === "rules" && <RulesTab shops={shops} />}
      {tab === "shops" && <ShopsTab shops={shops} onReload={loadShops} />}
    </div>
  );
}
