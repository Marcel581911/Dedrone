import { useEffect, useState } from "react";
import { api } from "../api";

export default function SkillGaps() {
  const [gaps, setGaps] = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  const load = () => api.getSkillGaps().then(setGaps);
  useEffect(() => { load(); }, []);

  const generate = async (id: string) => {
    setGenerating(id);
    try {
      const result = await api.generateStub(id);
      alert(`Skill stub generated!\n\nFiles created:\n${result.generatedFiles.join("\n")}`);
      load();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const unresolved = gaps.filter((g) => !g.resolved);
  const resolved = gaps.filter((g) => g.resolved);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Skill Gaps</h2>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-amber-400 mb-3">
          Unresolved ({unresolved.length})
        </h3>
        <div className="space-y-3">
          {unresolved.map((g) => (
            <div key={g.id} className="bg-gray-900 border border-amber-900/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400 font-medium">△</span>
                    <h3 className="font-medium font-mono">{g.skillName}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{g.triggerContext}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Detected: {new Date(g.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => generate(g.id)}
                  disabled={generating === g.id}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium disabled:opacity-50 ml-4"
                >
                  {generating === g.id ? "Generating..." : "Generate Stub"}
                </button>
              </div>
            </div>
          ))}
          {unresolved.length === 0 && (
            <p className="text-gray-600 text-sm">No unresolved skill gaps. System is complete.</p>
          )}
        </div>
      </div>

      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-400 mb-3">
            Resolved ({resolved.length})
          </h3>
          <div className="space-y-3">
            {resolved.map((g) => (
              <div key={g.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 opacity-70">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✓</span>
                  <h3 className="font-medium font-mono">{g.skillName}</h3>
                </div>
                <p className="text-sm text-gray-400">{g.triggerContext}</p>
                {g.generatedPath && (
                  <p className="text-xs text-gray-600 mt-1 font-mono">{g.generatedPath}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
