import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Badge, Input, EmptyState } from "../components/ui";

export default function Skills() {
  const [skills, setSkills] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", implementationPath: "", version: "1.0.0" });

  const load = () => api.getSkills().then(setSkills);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    await api.createSkill(form);
    setForm({ name: "", description: "", implementationPath: "", version: "1.0.0" });
    setShowCreate(false);
    load();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <PageTitle>Skills</PageTitle>
        <Btn variant="primary" onClick={() => setShowCreate(!showCreate)}>+ New Skill</Btn>
      </div>

      {showCreate && (
        <Card className="mb-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input placeholder="Name (e.g. summarize_text)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2" />
            <Input placeholder="Implementation path" value={form.implementationPath} onChange={(e) => setForm({ ...form, implementationPath: e.target.value })} className="col-span-2" />
          </div>
          <div className="flex gap-2">
            <Btn variant="primary" onClick={create}>Create</Btn>
            <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {skills.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium font-mono" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                  <Badge color={s.enabled ? "green" : "red"}>{s.enabled ? "On" : "Off"}</Badge>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>v{s.version}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.description}</p>
                {s.implementationPath && <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>{s.implementationPath}</p>}
                {s.agentSkills?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {s.agentSkills.map((as: any) => (
                      <span key={as.id} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{as.agent.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-3">
                <button onClick={async () => { await api.updateSkill(s.id, { enabled: !s.enabled }); load(); }}
                  className="text-[10px] px-2 py-1 rounded" style={{ background: s.enabled ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: s.enabled ? "#f87171" : "#4ade80" }}>
                  {s.enabled ? "Disable" : "Enable"}
                </button>
                <button onClick={async () => { if (confirm("Delete?")) { await api.deleteSkill(s.id); load(); } }}
                  className="text-[10px] opacity-30 hover:opacity-100" style={{ color: "#f87171" }}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
        {skills.length === 0 && <EmptyState>No skills.</EmptyState>}
      </div>
    </div>
  );
}
