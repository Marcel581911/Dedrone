import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import OpenAI from "openai";

// Keys that contain credentials — only admins can read/write these
const ADMIN_ONLY_KEYS = new Set([
  "openai_api_key",
  "telegram_bot_token",
  "twilio_account_sid", "twilio_auth_token", "twilio_from",
  "email_imap_host", "email_imap_port", "email_imap_user", "email_imap_pass",
  "email_smtp_host", "email_smtp_port", "email_smtp_user", "email_smtp_pass",
  "email_from_address", "email_from_name",
  "flight_api_key", "flight_api_url",
]);

// Keys shown masked to admins (not plain-text)
const MASK_KEYS = new Set(["openai_api_key", "telegram_bot_token", "twilio_auth_token", "email_imap_pass", "email_smtp_pass"]);

function mask(value: string) {
  if (!value) return "";
  return value.slice(0, 4) + "••••••••" + value.slice(-3);
}

export async function settingsRoutes(app: FastifyInstance) {
  // Returns settings visible to the current user:
  //   admin  → all keys, credential values masked
  //   member → only non-sensitive keys + integration status booleans
  app.get("/api/settings", async (req) => {
    const isAdmin = req.userRole === "admin";
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};

    for (const s of settings) {
      if (!isAdmin && ADMIN_ONLY_KEYS.has(s.key)) continue;
      map[s.key] = (isAdmin && MASK_KEYS.has(s.key) && s.value)
        ? mask(s.value)
        : s.value;
    }

    // Non-admins get boolean status flags so they know which integrations are live
    if (!isAdmin) {
      const all = Object.fromEntries(settings.map(s => [s.key, s.value]));
      // Telegram: check the requesting user's own bot token (per-user, not global)
      const userRecord = await prisma.user.findUnique({ where: { id: req.userId }, select: { telegramBotToken: true } });
      map["_status_openai"]    = all["openai_api_key"]       ? "1" : "0";
      map["_status_telegram"]  = userRecord?.telegramBotToken ? "1" : "0";
      map["_status_email"]     = all["email_smtp_host"]      ? "1" : "0";
      map["_status_sms"]       = all["twilio_account_sid"]   ? "1" : "0";
    }

    return map;
  });

  // Full unmasked values — admin only (used internally by services)
  app.get("/api/settings/raw", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only" });
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  });

  // Update settings — admin only
  app.put("/api/settings", async (req, reply) => {
    if (req.userRole !== "admin") return reply.status(403).send({ error: "Admin only" });
    const body = req.body as Record<string, string>;
    const results: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      results[key] = setting.value;
    }
    return results;
  });

  app.post("/api/settings/test", async () => {
    const apiKeySetting = await prisma.setting.findUnique({
      where: { key: "openai_api_key" },
    });
    if (!apiKeySetting?.value) {
      return { success: false, error: "No API key configured" };
    }
    try {
      const client = new OpenAI({ apiKey: apiKeySetting.value });
      const models = await client.models.list();
      const modelIds = [];
      for await (const model of models) {
        modelIds.push(model.id);
        if (modelIds.length >= 3) break;
      }
      return { success: true, models: modelIds };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
