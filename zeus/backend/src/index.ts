import Fastify from "fastify";
import cors from "@fastify/cors";
import { settingsRoutes } from "./routes/settings.js";
import { agentRoutes } from "./routes/agents.js";
import { ticketRoutes } from "./routes/tickets.js";
import { skillRoutes } from "./routes/skills.js";
import { chatRoutes } from "./routes/chat.js";
import { logRoutes } from "./routes/logs.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { telegramRoutes } from "./routes/telegram.js";
import { log } from "./logger.js";
import { startWorker } from "./services/worker.js";
import { startBot } from "./services/telegram.js";
import { prisma } from "./db.js";

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });

app.setErrorHandler((error, _request, reply) => {
  console.error(error);
  reply.status(error.statusCode || 500).send({
    error: error.message || "Internal Server Error",
  });
});

await app.register(settingsRoutes);
await app.register(agentRoutes);
await app.register(ticketRoutes);
await app.register(skillRoutes);
await app.register(chatRoutes);
await app.register(logRoutes);
await app.register(dashboardRoutes);
await app.register(telegramRoutes);

const PORT = parseInt(process.env.PORT || "3000");

try {
  const address = await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`⚡ ZEUS Backend running at ${address}`);
  await log("info", "system", `ZEUS Backend started on ${address}`);

  startWorker();

  // Auto-start Telegram bot if token is configured
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
