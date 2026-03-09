import { FastifyInstance } from "fastify";
import {
  isOnboarded,
  setupPassword,
  verifyPassword,
  createSession,
  destroySession,
  getVmAddress,
  setVmAddress,
} from "../services/auth.js";
import { log } from "../logger.js";

export async function authRoutes(app: FastifyInstance) {
  // Check if onboarding is complete
  app.get("/api/auth/status", async () => {
    const onboarded = await isOnboarded();
    const vmAddress = await getVmAddress();
    return { onboarded, vmAddress };
  });

  // Onboarding: set password + VM address for the first time
  app.post("/api/auth/onboard", async (req, reply) => {
    const onboarded = await isOnboarded();
    if (onboarded) {
      return reply.status(400).send({ error: "Already onboarded. Use login instead." });
    }

    const { password, vmAddress } = req.body as { password: string; vmAddress: string };
    if (!password || password.length < 4) {
      return reply.status(400).send({ error: "Password must be at least 4 characters." });
    }
    if (!vmAddress) {
      return reply.status(400).send({ error: "VM IP address is required." });
    }

    await setupPassword(password);
    await setVmAddress(vmAddress);

    const token = createSession();
    reply.setCookie("zeus_session", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 86400,
    });

    await log("info", "auth", "Onboarding completed");
    return { success: true, vmAddress };
  });

  // Login
  app.post("/api/auth/login", async (req, reply) => {
    const { password } = req.body as { password: string };
    const valid = await verifyPassword(password);

    if (!valid) {
      await log("warn", "auth", "Failed login attempt");
      return reply.status(401).send({ error: "Invalid password." });
    }

    const token = createSession();
    reply.setCookie("zeus_session", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 86400,
    });

    await log("info", "auth", "Login successful");
    return { success: true };
  });

  // Logout
  app.post("/api/auth/logout", async (req, reply) => {
    const token = req.cookies.zeus_session;
    if (token) destroySession(token);
    reply.clearCookie("zeus_session", { path: "/" });
    return { success: true };
  });

  // Change password (requires current session)
  app.put("/api/auth/password", async (req, reply) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const valid = await verifyPassword(currentPassword);
    if (!valid) {
      return reply.status(401).send({ error: "Current password is incorrect." });
    }

    if (!newPassword || newPassword.length < 4) {
      return reply.status(400).send({ error: "New password must be at least 4 characters." });
    }

    await setupPassword(newPassword);
    await log("info", "auth", "Password changed");
    return { success: true };
  });

  // Update VM address
  app.put("/api/auth/vm-address", async (req) => {
    const { vmAddress } = req.body as { vmAddress: string };
    await setVmAddress(vmAddress);
    return { success: true, vmAddress };
  });
}
