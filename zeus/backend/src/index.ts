import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import { settingsRoutes } from "./routes/settings.js";
import { agentRoutes } from "./routes/agents.js";
import { ticketRoutes } from "./routes/tickets.js";
import { skillRoutes } from "./routes/skills.js";
import { chatRoutes } from "./routes/chat.js";
import { logRoutes } from "./routes/logs.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { telegramRoutes } from "./routes/telegram.js";
import { authRoutes } from "./routes/auth.js";
import { automationRoutes } from "./routes/automations.js";
import { emailRoutes } from "./routes/email.js";
import { log } from "./logger.js";
import { startWorker } from "./services/worker.js";
import { startBot } from "./services/telegram.js";
import { startScheduler } from "./services/scheduler.js";
import { validateSession, isOnboarded } from "./services/auth.js";
import { prisma } from "./db.js";

const app = Fastify({ logger: false });

await app.register(cors, { origin: true, credentials: true });
await app.register(cookie);

// Auth middleware — protect /api/* except /api/auth/*
app.addHook("onRequest", async (req, reply) => {
  if (!req.url.startsWith("/api/")) return;
  if (req.url.startsWith("/api/auth/")) return;

  const onboarded = await isOnboarded();
  if (!onboarded) {
    reply.status(403).send({ error: "not_onboarded" });
    return;
  }

  const token = req.cookies.zeus_session;
  if (!token || !validateSession(token)) {
    reply.status(401).send({ error: "not_authenticated" });
    return;
  }
});

app.setErrorHandler((error, _request, reply) => {
  console.error(error);
  reply.status(error.statusCode || 500).send({
    error: error.message || "Internal Server Error",
  });
});

// API routes
await app.register(authRoutes);
await app.register(settingsRoutes);
await app.register(agentRoutes);
await app.register(ticketRoutes);
await app.register(skillRoutes);
await app.register(chatRoutes);
await app.register(logRoutes);
await app.register(dashboardRoutes);
await app.register(telegramRoutes);
await app.register(automationRoutes);
await app.register(emailRoutes);

// Serve frontend build (production mode)
const frontendDist = path.resolve(import.meta.dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
  await app.register(fastifyStatic, {
    root: frontendDist,
    prefix: "/",
    wildcard: false,
  });

  // SPA fallback: serve index.html for all non-API, non-file routes
  app.setNotFoundHandler(async (_req, reply) => {
    return reply.sendFile("index.html");
  });

  console.log(`📂 Serving frontend from ${frontendDist}`);
} else {
  console.log("📂 No frontend build found — run 'pnpm build' or use 'pnpm dev' for development");
}

const PORT = parseInt(process.env.PORT || "3000");

try {
  const address = await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`⚡ ZEUS Backend running at ${address}`);
  await log("info", "system", `ZEUS Backend started on ${address}`);

  startWorker();
  startScheduler();

  const tgToken = await prisma.setting.findUnique({ where: { key: "telegram_bot_token" } });
  if (tgToken?.value) {
    const result = await startBot();
    if (!result.success) {
      console.log(`📱 Telegram bot failed to auto-start: ${result.error}`);
    }
  } else {
    console.log("📱 Telegram bot: no token configured (add in Settings)");
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
