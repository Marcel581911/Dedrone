import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Badge, Input, Label, EmptyState } from "../components/ui";

export default function Modules() {
  const [modules, setModules] = useState<any[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});

  const load = () => api.getModules().then(setModules);
  useEffect(() => { load(); }, []);

  const install = async (slug: string) => {
    setActing(slug);
    try {
      const r = await api.installModule(slug);
      if (r.success) {
        await load();
        if (r.needsConfig) openConfig(slug);
      }
    } finally { setActing(null); }
  };

  const uninstall = async (slug: string) => {
    if (!confirm("Uninstall this module? Its agents and tasks will be removed.")) return;
    setActing(slug);
    try { await api.uninstallModule(slug); load(); }
    finally { setActing(null); }
  };

  const openConfig = (slug: string) => {
    const mod = modules.find((m) => m.slug === slug);
    if (!mod) return;
    const form: Record<string, string> = {};
    const settings = mod.manifest?.settings || [];
    for (const f of settings) {
      form[f.key] = mod.config?.[f.key] || f.default || "";
    }
    setConfigForm(form);
    setConfiguring(slug);
  };

  const saveConfig = async () => {
    if (!configuring) return;
    setActing(configuring);
    try {
      await api.updateModuleConfig(configuring, configForm);
      await api.activateModule(configuring);
      setConfiguring(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally { setActing(null); }
  };

  const installed = modules.filter((m) => m.status === "installed" || m.status === "needs_config");
  const available = modules.filter((m) => m.status === "available");

  const configuringMod = modules.find((m) => m.slug === configuring);

  return (
    <div className="max-w-4xl">
      <PageTitle>Modules</PageTitle>

      {/* Config panel */}
      {configuring && configuringMod && (
        <Card className="mb-5 border-[var(--accent)]" style={{ borderColor: "var(--accent)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{configuringMod.manifest?.icon || configuringMod.slug.charAt(0).toUpperCase()}</span>
            <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Configure {configuringMod.name}</h3>
          </div>
          <div className="space-y-3 max-w-md">
            {(configuringMod.manifest?.settings || []).map((field: any) => (
              <div key={field.key}>
                <Label>
                  {field.label}
                  {field.required && <span style={{ color: "var(--accent)" }}> *</span>}
                </Label>
                <Input
                  type={field.type === "password" ? "password" : "text"}
                  value={configForm[field.key] || ""}
                  onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                  placeholder={field.default || ""}
                />
                {field.description && (
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{field.description}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Btn variant="primary" onClick={saveConfig} disabled={acting === configuring}>
              {acting === configuring ? "..." : "Save & Activate"}
            </Btn>
            <Btn onClick={() => setConfiguring(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Installed */}
      {installed.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Installed ({installed.length})</h3>
          <div className="grid grid-cols-2 gap-3">
            {installed.map((m) => (
              <Card key={m.id} className="hover:border-[var(--border-hover)] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ background: "var(--accent-bg)" }}>
                    {m.manifest?.icon || m.slug.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                      {m.status === "needs_config" ? (
                        <Badge color="amber">Needs setup</Badge>
                      ) : (
                        <Badge color="green">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {m.manifest?.settings?.length > 0 && (
                        <button onClick={() => openConfig(m.slug)}
                          className="text-[10px] underline" style={{ color: "var(--accent)" }}>
                          Configure
                        </button>
                      )}
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

      {/* Available */}
      <div>
        <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Available ({available.length})</h3>
        <div className="grid grid-cols-2 gap-3">
          {available.map((m) => {
            const settingsCount = m.manifest?.settings?.length || 0;
            const requiredCount = m.manifest?.settings?.filter((s: any) => s.required).length || 0;
            return (
              <Card key={m.id} className="hover:border-[var(--border-hover)] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                    {m.manifest?.icon || m.slug.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.description}</p>
                    {settingsCount > 0 && (
                      <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                        {requiredCount > 0 ? `${requiredCount} required setting${requiredCount > 1 ? "s" : ""}` : "Optional settings available"}
                      </p>
                    )}
                    <div className="mt-2">
                      <Btn variant="primary" onClick={() => install(m.slug)} disabled={acting === m.slug}
                        style={{ padding: "4px 12px", fontSize: 11 }}>
                        {acting === m.slug ? "Installing..." : "Install"}
                      </Btn>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {available.length === 0 && <p className="text-sm col-span-2 py-8 text-center" style={{ color: "var(--text-muted)" }}>All modules installed.</p>}
        </div>
      </div>
    </div>
  );
}
