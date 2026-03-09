import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import OpenAI from "openai";

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/api/settings", async () => {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    const SECRET_KEYS = ["openai_api_key", "telegram_bot_token"];
    for (const s of settings) {
      map[s.key] = SECRET_KEYS.includes(s.key) && s.value
        ? s.value.slice(0, 8) + "..." + s.value.slice(-4)
        : s.value;
    }
    return map;
  });

  app.get("/api/settings/raw", async () => {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  });

  app.put("/api/settings", async (req) => {
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
