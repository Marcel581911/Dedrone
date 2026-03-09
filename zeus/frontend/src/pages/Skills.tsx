import { useEffect, useState } from "react";
import { api } from "../api";

export default function Skills() {
  const [skills, setSkills] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", implementationPath: "", version: "1.0.0",
  });

  const load = () => api.getSkills().then(setSkills);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    await api.createSkill(form);
    setForm({ name: "", description: "", implementationPath: "", version: "1.0.0" });
    setShowCreate(false);
    load();
  };

  const toggle = async (skill: any) => {
    await api.updateSkill(skill.id, { enabled: !skill.enabled });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this skill?")) return;
    await api.deleteSkill(id);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Skills</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium"
        >
          + New Skill
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Create Skill</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Name (e.g. summarize_text)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Version"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm col-span-2"
            />
            <input
              placeholder="Implementation Path"
              value={form.implementationPath}
              onChange={(e) => setForm({ ...form, implementationPath: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {skills.map((s) => (
          <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{s.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    s.enabled ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                  }`}>
                    {s.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="text-xs text-gray-600">v{s.version}</span>
                </div>
                <p className="text-sm text-gray-400">{s.description}</p>
                {s.implementationPath && (
                  <p className="text-xs text-gray-600 mt-1 font-mono">{s.implementationPath}</p>
                )}
                {s.agentSkills?.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {s.agentSkills.map((as: any) => (
                      <span key={as.id} className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                        {as.agent.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => toggle(s)}
                  className={`text-xs px-3 py-1 rounded ${
                    s.enabled ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                  }`}
                >
                  {s.enabled ? "Disable" : "Enable"}
                </button>
                <button onClick={() => remove(s.id)} className="text-xs text-gray-600 hover:text-red-400">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {skills.length === 0 && <p className="text-gray-600 text-sm">No skills registered.</p>}
      </div>
    </div>
  );
}
