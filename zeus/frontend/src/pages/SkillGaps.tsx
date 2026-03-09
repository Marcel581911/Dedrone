import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, PageTitle, Btn, Badge, EmptyState } from "../components/ui";

export default function SkillGaps() {
  const [gaps, setGaps] = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  const load = () => api.getSkillGaps().then(setGaps);
  useEffect(() => { load(); }, []);

  const generate = async (id: string) => {
    setGenerating(id);
    try {
      await api.generateStub(id);
      load();
    } catch (e: any) { alert(e.message); }
    finally { setGenerating(null); }
  };

  const unresolved = gaps.filter((g) => !g.resolved);
  const resolved = gaps.filter((g) => g.resolved);

  return (
    <div className="max-w-4xl">
      <PageTitle>Skill Gaps</PageTitle>

      <div className="mb-6">
        <h3 className="text-xs font-medium mb-3" style={{ color: "var(--accent)" }}>Unresolved ({unresolved.length})</h3>
        <div className="space-y-2">
          {unresolved.map((g) => (
            <Card key={g.id} className="border-[rgba(229,162,16,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-mono font-medium" style={{ color: "var(--text-primary)" }}>{g.skillName}</span>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{g.triggerContext}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{new Date(g.createdAt).toLocaleString()}</p>
                </div>
                <Btn variant="primary" onClick={() => generate(g.id)} disabled={generating === g.id}>
                  {generating === g.id ? "..." : "Generate Stub"}
                </Btn>
              </div>
            </Card>
          ))}
          {unresolved.length === 0 && <EmptyState>No unresolved gaps.</EmptyState>}
        </div>
      </div>

      {resolved.length > 0 && (
        <div>
          <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Resolved ({resolved.length})</h3>
          <div className="space-y-2">
            {resolved.map((g) => (
              <Card key={g.id} className="opacity-60">
                <div className="flex items-center gap-2">
                  <Badge color="green">resolved</Badge>
                  <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{g.skillName}</span>
                </div>
                {g.generatedPath && <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>{g.generatedPath}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
