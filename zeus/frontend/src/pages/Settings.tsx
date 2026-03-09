import { useEffect, useState } from "react";
import { api } from "../api";

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [tgToken, setTgToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Telegram state
  const [tgStatus, setTgStatus] = useState<any>({ running: false, username: "" });
  const [tgAction, setTgAction] = useState(false);
  const [pairings, setPairings] = useState<any[]>([]);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      if (s.default_model) setModel(s.default_model);
    });
    loadTelegram();
  }, []);

  const loadTelegram = async () => {
    api.telegramStatus().then(setTgStatus);
    api.telegramPairings().then(setPairings);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data: Record<string, string> = { default_model: model };
      if (apiKey) data.openai_api_key = apiKey;
      if (tgToken) data.telegram_bot_token = tgToken;
      await api.updateSettings(data);
      setApiKey("");
      setTgToken("");
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

  const toggleBot = async () => {
    setTgAction(true);
    try {
      if (tgStatus.running) {
        await api.telegramStop();
      } else {
        const result = await api.telegramStart();
        if (!result.success) {
          alert(`Bot failed to start: ${result.error}`);
        }
      }
      await loadTelegram();
    } finally {
      setTgAction(false);
    }
  };

  const removePairing = async (id: string) => {
    if (!confirm("Remove this Telegram pairing?")) return;
    await api.telegramUnpair(id);
    loadTelegram();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* OpenAI */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">OpenAI</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings.openai_api_key || "Enter API key..."}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2.5 text-sm focus:border-amber-600 outline-none"
            />
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
                      Models: {testResult.models.join(", ")}...
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

      {/* Telegram */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Telegram Bot</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Bot Token</label>
            <input
              type="password"
              value={tgToken}
              onChange={(e) => setTgToken(e.target.value)}
              placeholder={settings.telegram_bot_token || "Enter Telegram bot token..."}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2.5 text-sm focus:border-amber-600 outline-none"
            />
            {settings.telegram_bot_token && (
              <p className="text-xs text-gray-600 mt-1">Current: {settings.telegram_bot_token}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Get a token from <span className="text-blue-400">@BotFather</span> on Telegram
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleBot}
              disabled={tgAction}
              className={`px-5 py-2.5 rounded text-sm font-medium disabled:opacity-50 ${
                tgStatus.running
                  ? "bg-red-700 hover:bg-red-600"
                  : "bg-green-700 hover:bg-green-600"
              }`}
            >
              {tgAction ? "..." : tgStatus.running ? "Stop Bot" : "Start Bot"}
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${tgStatus.running ? "bg-green-500 animate-pulse" : "bg-gray-600"}`} />
              <span className="text-sm text-gray-400">
                {tgStatus.running
                  ? `Running as @${tgStatus.username}`
                  : "Not running"}
              </span>
            </div>
          </div>

          {tgStatus.running && (
            <div className="bg-gray-800 rounded p-4 text-sm">
              <p className="text-gray-400 mb-2">How to pair a Telegram chat with an agent:</p>
              <ol className="list-decimal list-inside text-gray-300 space-y-1">
                <li>Go to any <strong>Agent → Telegram</strong> tab</li>
                <li>Click <strong>Generate Pairing Code</strong></li>
                <li>Open your Telegram bot (<span className="text-blue-400">@{tgStatus.username}</span>)</li>
                <li>Send: <code className="bg-gray-900 px-1 rounded">/pair CODE</code></li>
              </ol>
            </div>
          )}
        </div>

        {/* Active pairings */}
        {pairings.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Active Pairings</h4>
            <div className="space-y-2">
              {pairings.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-800 rounded p-3">
                  <div>
                    <span className="text-sm font-medium">{p.chatTitle || `Chat ${p.telegramChatId}`}</span>
                    <span className="text-xs text-gray-500 ml-2">→ {p.agent.name}</span>
                  </div>
                  <button
                    onClick={() => removePairing(p.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save All Settings"}
      </button>
    </div>
  );
}
