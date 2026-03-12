import { FastifyInstance } from "fastify";
import {
  isSetup, createUser, findUserByName, verifyUserPassword,
  createSession, destroySession, validateSession,
  updateUserPassword, validateInviteCode, markInviteUsed,
} from "../services/auth.js";
import { provisionUserAgents } from "../services/user-provisioning.js";
import { provisionHousehold, joinHousehold } from "../services/household.js";
import { log } from "../logger.js";
import { prisma } from "../db.js";

const IS_PROD = process.env.NODE_ENV === "production";

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  secure: IS_PROD,       // only send over HTTPS in production
  sameSite: "lax" as const,
  maxAge: 604800,        // 7 days
};

export async function authRoutes(app: FastifyInstance) {
  // Public: what state is the app in?
  app.get("/api/auth/status", async (req) => {
    const setup = await isSetup();
    if (!setup) return { setup: false };

    const token = req.cookies.zeus_session;
    if (!token) return { setup: true, authenticated: false };

    const session = await validateSession(token);
    if (!session) return { setup: true, authenticated: false };

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, role: true, city: true, timezone: true, assistantName: true, assistantPersonality: true },
    });
    if (!user) return { setup: true, authenticated: false };

    return { setup: true, authenticated: true, user };
  });

  // Public: first-time family setup — creates admin account
  app.post("/api/auth/setup", async (req, reply) => {
    if (await isSetup()) {
      return reply.status(400).send({ error: "Already set up. Please log in." });
    }
    const { name, password, assistantName, assistantPersonality, city, timezone } = req.body as {
      name: string; password: string; assistantName?: string;
      assistantPersonality?: string; city?: string; timezone?: string;
    };
    if (!name?.trim()) return reply.status(400).send({ error: "Name is required." });
    if (!password || password.length < 4) return reply.status(400).send({ error: "Password must be at least 4 characters." });

    const user = await createUser({ name, password, role: "admin", city, timezone, assistantName, assistantPersonality });
    await provisionUserAgents(user.id, user.assistantName, user.assistantPersonality, user.name);
    await provisionHousehold(user.id);

    const token = await createSession(user.id);
    reply.setCookie("zeus_session", token, COOKIE_OPTS);
    await log("info", "auth", `Family setup complete — admin: ${user.name}`);
    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  });

  // Public: login
  app.post("/api/auth/login", async (req, reply) => {
    const { name, password } = req.body as { name: string; password: string };
    if (!name?.trim() || !password) return reply.status(400).send({ error: "Name and password are required." });

    const user = await findUserByName(name.trim());
    if (!user || !(await verifyUserPassword(user.id, password))) {
      await log("warn", "auth", `Failed login: ${name}`);
      return reply.status(401).send({ error: "Invalid name or password." });
    }

    const token = await createSession(user.id);
    reply.setCookie("zeus_session", token, COOKIE_OPTS);
    await log("info", "auth", `Login: ${user.name}`);
    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  });

  // Public: logout
  app.post("/api/auth/logout", async (req, reply) => {
    const token = req.cookies.zeus_session;
    if (token) await destroySession(token);
    reply.clearCookie("zeus_session", { path: "/" });
    return { success: true };
  });

  // Public: validate invite code before registering
  app.get("/api/auth/invite/:code", async (req, reply) => {
    const { code } = req.params as { code: string };
    const invite = await validateInviteCode(code);
    if (!invite) return reply.status(404).send({ error: "Invalid or expired invite code." });
    return { valid: true, role: invite.role };
  });

  // Public: register with invite code
  app.post("/api/auth/register", async (req, reply) => {
    const { code, name, password, assistantName, assistantPersonality, city, timezone } = req.body as {
      code: string; name: string; password: string; assistantName?: string;
      assistantPersonality?: string; city?: string; timezone?: string;
    };

    const invite = await validateInviteCode(code);
    if (!invite) return reply.status(400).send({ error: "Invalid or expired invite code." });
    if (!name?.trim()) return reply.status(400).send({ error: "Name is required." });
    if (!password || password.length < 4) return reply.status(400).send({ error: "Min 4 characters." });

    const existing = await findUserByName(name.trim());
    if (existing) return reply.status(400).send({ error: "That name is already taken." });

    const user = await createUser({ name, password, role: invite.role, city, timezone, assistantName, assistantPersonality });
    await markInviteUsed(code, user.id);
    await provisionUserAgents(user.id, user.assistantName, user.assistantPersonality, user.name);
    await joinHousehold(user.id);

    const token = await createSession(user.id);
    reply.setCookie("zeus_session", token, COOKIE_OPTS);
    await log("info", "auth", `New member joined: ${user.name} (${user.role})`);
    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  });

  // Authenticated: change own password
  app.put("/api/auth/password", async (req, reply) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!(await verifyUserPassword(req.userId, currentPassword))) {
      return reply.status(401).send({ error: "Current password is incorrect." });
    }
    if (!newPassword || newPassword.length < 4) return reply.status(400).send({ error: "Min 4 characters." });
    await updateUserPassword(req.userId, newPassword);
    await log("info", "auth", `Password changed for ${req.userId}`);
    return { success: true };
  });
}
