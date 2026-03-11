import { FastifyInstance } from "fastify";
import { sendAlert, sendTelegramAlert, sendSmsAlert } from "../services/alerts.js";

export async function alertRoutes(app: FastifyInstance) {
  // Test an alert for the current user
  app.post("/api/alerts/test", async (req) => {
    const body = req.body as any;
    const channel = body?.channel || "all"; // "telegram" | "sms" | "all"
    const message = body?.message || "🔔 Test alert from Zeus!";

    let result: { telegram?: boolean; sms?: boolean } = {};

    if (channel === "telegram") {
      result.telegram = await sendTelegramAlert(req.userId, message);
    } else if (channel === "sms") {
      result.sms = await sendSmsAlert(req.userId, message);
    } else {
      result = await sendAlert(req.userId, message);
    }

    const sent = result.telegram || result.sms;
    return {
      success: sent,
      result,
      message: sent
        ? "Alert sent successfully!"
        : "Alert not delivered — check your Telegram Chat ID / phone number and credentials in Settings.",
    };
  });
}
