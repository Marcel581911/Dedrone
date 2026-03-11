import { useEffect, useState } from "react";
import { api, GuardrailError } from "../api";

interface GuardrailState {
  message: string;
  action?: string;
}

export default function GuardrailModal() {
  const [state, setState] = useState<GuardrailState | null>(null);
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const err = (e as CustomEvent<GuardrailError>).detail;
      setState({ message: err.message, action: err.action });
      setLogged(false);
    };
    window.addEventListener("zeus:guardrail", handler);
    return () => window.removeEventListener("zeus:guardrail", handler);
  }, []);

  if (!state) return null;

  const logTicket = async () => {
    setLogging(true);
    setLogError("");
    try {
      await api.createSupportTicket({
        title: `Guardrail: ${state.action || "Blocked action"}`,
        description: state.message,
        priority: "medium",
        category: "guardrail",
      });
      setLogged(true);
    } catch (e: any) {
      setLogError(e.message || "Could not log ticket. Please contact your admin.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={() => setState(null)}
    >
      <div
        className="rounded-xl p-5 w-full max-w-md shadow-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ background: "var(--bg-input)" }}
          >
            🔒
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Action not permitted
            </p>
            {state.action && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {state.action}
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {state.message}
        </p>

        {/* Actions */}
        {logged ? (
          <div className="text-sm font-medium text-center py-2" style={{ color: "#10b981" }}>
            Ticket logged — an admin will review your request.
          </div>
        ) : (
          <>
            {logError && (
              <p className="text-xs mb-2" style={{ color: "#f87171" }}>{logError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={logTicket}
                disabled={logging}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-opacity"
                style={{ background: "var(--accent)", color: "#fff", opacity: logging ? 0.6 : 1 }}
              >
                {logging ? "Logging…" : "Log a support ticket"}
              </button>
              <button
                onClick={() => setState(null)}
                className="rounded-lg px-4 py-2 text-sm"
                style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
              >
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
