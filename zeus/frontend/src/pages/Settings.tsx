import { useEffect, useState } from "react";
import { api } from "../api";

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      if (s.default_model) setModel(s.default_model);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const data: Record<string, string> = { default_model: model };
      if (apiKey) data.openai_api_key = apiKey;
      await api.updateSettings(data);
      setApiKey("");
      const s = await api.getSettings();
      setSettings(s);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testConnection();
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">OpenAI API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings.openai_api_key || "Enter API key..."}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2.5 text-sm focus:border-amber-600 outline-none"
            />
          </div>
          {settings.openai_api_key && (
            <p className="text-xs text-gray-600 mt-1">Current: {settings.openai_api_key}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Default Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-4 py-2.5 text-sm w-full"
          >
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4-turbo">gpt-4-turbo</option>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          <button
            onClick={test}
            disabled={testing}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium disabled:opacity-50"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>

        {testResult && (
          <div className={`rounded p-4 text-sm ${
            testResult.success ? "bg-green-900/30 border border-green-800" : "bg-red-900/30 border border-red-800"
          }`}>
            {testResult.success ? (
              <div>
                <p className="text-green-400 font-medium">Connection successful!</p>
                {testResult.models && (
                  <p className="text-green-300 text-xs mt-1">
                    Available models: {testResult.models.join(", ")}...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-400">{testResult.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
