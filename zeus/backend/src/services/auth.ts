import crypto from "crypto";
import { prisma } from "../db.js";

const activeSessions = new Map<string, { userId: string; createdAt: number }>();
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export async function isSetup(): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}

export async function createUser(data: {
  name: string;
  password: string;
  role?: string;
  city?: string;
  timezone?: string;
  assistantName?: string;
  assistantPersonality?: string;
}) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(data.password, salt);
  return prisma.user.create({
    data: {
      name: data.name.trim(),
      passwordHash: `${salt}:${hash}`,
      role: data.role || "user",
      city: data.city || "",
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      assistantName: data.assistantName || "Gulli",
      assistantPersonality: data.assistantPersonality || "",
    },
  });
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(newPassword, salt);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: `${salt}:${hash}` },
  });
}

export async function findUserByName(name: string) {
  return prisma.user.findUnique({ where: { name: name.trim() } });
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  const [salt, storedHash] = user.passwordHash.split(":");
  return hashPassword(password, salt) === storedHash;
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

export function validateSession(token: string): { userId: string } | null {
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    activeSessions.delete(token);
    return null;
  }
  return { userId: session.userId };
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export async function createInviteCode(createdBy: string, role = "user"): Promise<string> {
  const code = crypto.randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.inviteCode.create({ data: { code, role, createdBy, expiresAt } });
  return code;
}

export async function validateInviteCode(code: string) {
  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite) return null;
  if (invite.usedBy) return null;
  if (invite.expiresAt < new Date()) return null;
  return invite;
}

export async function markInviteUsed(code: string, userId: string): Promise<void> {
  await prisma.inviteCode.update({ where: { code }, data: { usedBy: userId } });
}
