import Fastify from "fastify";
import cors from "@fastify/cors";
import { settingsRoutes } from "./routes/settings.js";
import { agentRoutes } from "./routes/agents.js";
import { ticketRoutes } from "./routes/tickets.js";
import { skillRoutes } from "./routes/skills.js";
import { chatRoutes } from "./routes/chat.js";
import { logRoutes } from "./routes/logs.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { log } from "./logger.js";
import { startWorker } from "./services/worker.js";

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

const PORT = parseInt(process.env.PORT || "3000");

try {
  const address = await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`⚡ ZEUS Backend running at ${address}`);
  await log("info", "system", `ZEUS Backend started on ${address}`);

  // Start the ticket worker loop inside the same process
  startWorker();
} catch (err) {
  console.error(err);
  process.exit(1);
}
