import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Badge } from "../components/ui";

export default function Modules() {
  const [modules, setModules] = useState<any[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => api.getModules().then(setModules);
  useEffect(() => { load(); }, []);

  const install = async (slug: string) => {
    setActing(slug);
    try {
      const r = await api.installModule(slug);
      if (r.success) load();
      else alert(r.message);
    } finally { setActing(null); }
  };

  const uninstall = async (slug: string) => {
    if (!confirm("Uninstall this module? Its agents and tasks will be removed.")) return;
    setActing(slug);
    try { await api.uninstallModule(slug); load(); }
    finally { setActing(null); }
  };

  const installed = modules.filter((m) => m.status === "installed");
  const available = modules.filter((m) => m.status !== "installed");

  return (
    <div className="max-w-4xl">
      <PageTitle>Modules</PageTitle>

      {installed.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Installed ({installed.length})</h3>
          <div className="grid grid-cols-2 gap-3">
            {installed.map((m) => (
              <Card key={m.id} className="hover:border-[var(--border-hover)] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ background: "var(--accent-bg)" }}>
                    {m.icon || m.slug.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                      <Badge color="green">Installed</Badge>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{m.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>v{m.version}</span>
                      <button onClick={() => uninstall(m.slug)} disabled={acting === m.slug}
                        className="text-[10px] ml-auto" style={{ color: "#f87171" }}>
                        {acting === m.slug ? "..." : "Uninstall"}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Available ({available.length})</h3>
        <div className="grid grid-cols-2 gap-3">
          {available.map((m) => (
            <Card key={m.id} className="hover:border-[var(--border-hover)] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                  {m.icon || m.slug.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{m.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>v{m.version}</span>
                    <Btn variant="primary" onClick={() => install(m.slug)} disabled={acting === m.slug}
                      style={{ marginLeft: "auto", padding: "4px 12px", fontSize: 11 }}>
                      {acting === m.slug ? "Installing..." : "Install"}
                    </Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {available.length === 0 && (
            <p className="text-sm col-span-2 py-8 text-center" style={{ color: "var(--text-muted)" }}>All modules installed.</p>
          )}
        </div>
      </div>
    </div>
  );
}
