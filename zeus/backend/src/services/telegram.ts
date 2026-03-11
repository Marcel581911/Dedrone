import { Telegraf } from "telegraf";
import { prisma } from "../db.js";
import { log } from "../logger.js";
import { chatWithAgent } from "./chat.js";
import crypto from "crypto";

interface BotInstance {
  bot: Telegraf;
  username: string;
  userId: string;
}

// Registry: one bot instance per user
const bots = new Map<string, BotInstance>();

export function getBotInfo(userId: string) {
  const inst = bots.get(userId);
  return { running: !!inst, username: inst?.username || "" };
}

function buildBot(token: string, userId: string): Telegraf {
  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await ctx.reply(
      `⚡ *ZEUS Agent Runtime*\n\n` +
      `This bot connects you to your personal ZEUS assistant.\n\n` +
      `To pair this chat with your agent, get a pairing code from Settings → Profile and send:\n\n` +
      `\`/pair CODE\``,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("pair", async (ctx) => {
    const code = ctx.message.text.split(/\s+/)[1]?.trim();
    if (!code) {
      await ctx.reply("Usage: /pair CODE\n\nGenerate a code from ZEUS → Settings → Profile → Telegram.");
      return;
    }

    const pairingCode = await prisma.telegramPairingCode.findUnique({ where: { code } });
    if (!pairingCode) {
      await ctx.reply("Invalid pairing code. Generate a new one from ZEUS.");
      return;
    }
    if (pairingCode.expiresAt < new Date()) {
      await prisma.telegramPairingCode.delete({ where: { id: pairingCode.id } });
      await ctx.reply("This code has expired. Generate a new one.");
      return;
    }

    // Verify the agent belongs to this bot's owner
    const agent = await prisma.agent.findUnique({ where: { id: pairingCode.agentId } });
    if (!agent || agent.userId !== userId) {
      await ctx.reply("This code is not valid for this bot.");
      return;
    }

    const chatId = String(ctx.chat.id);
    const chatTitle = ctx.chat.type === "private"
      ? `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim()
      : (ctx.chat as any).title || `Chat ${chatId}`;

    await prisma.telegramPairing.upsert({
      where: { telegramChatId: chatId },
      update: { agentId: pairingCode.agentId, chatTitle },
      create: { telegramChatId: chatId, agentId: pairingCode.agentId, chatTitle },
    });
    await prisma.telegramPairingCode.delete({ where: { id: pairingCode.id } });

    await ctx.reply(
      `✅ *Paired!*\n\nThis chat is now connected to *${agent.name}*.\n\n` +
      `/status — Check connection\n/unpair — Disconnect\n/newchat — Fresh conversation`,
      { parse_mode: "Markdown" }
    );
    await log("info", "telegram", `"${chatTitle}" paired with agent "${agent.name}"`, { chatId, agentId: agent.id });
  });

  bot.command("status", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const pairing = await prisma.telegramPairing.findUnique({
      where: { telegramChatId: chatId },
      include: { agent: true },
    });
    if (!pairing) { await ctx.reply("Not paired. Use /pair CODE to connect."); return; }
    await ctx.reply(
      `⚡ *Status*\n\nAgent: *${pairing.agent.name}*\nRole: ${pairing.agent.role}\nModel: ${pairing.agent.model}\nStatus: ${pairing.agent.enabled ? "✅ Active" : "❌ Disabled"}`,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("unpair", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const pairing = await prisma.telegramPairing.findUnique({ where: { telegramChatId: chatId } });
    if (!pairing) { await ctx.reply("This chat is not paired."); return; }
    await prisma.telegramPairing.delete({ where: { id: pairing.id } });
    await ctx.reply("Unpaired. Disconnected from your agent.");
    await log("info", "telegram", "Chat unpaired", { chatId });
  });

  bot.command("newchat", async (ctx) => {
    const chatId = String(ctx.chat.id);
    const pairing = await prisma.telegramPairing.findUnique({ where: { telegramChatId: chatId } });
    if (!pairing) { await ctx.reply("Not paired. Use /pair CODE first."); return; }
    await prisma.telegramPairing.update({ where: { id: pairing.id }, data: { conversationId: null } });
    await ctx.reply("Fresh conversation started. Your next message begins a new thread.");
  });

  bot.on("text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    const chatId = String(ctx.chat.id);

    const pairing = await prisma.telegramPairing.findUnique({
      where: { telegramChatId: chatId },
      include: { agent: true },
    });
    if (!pairing) { await ctx.reply("Not paired. Use /pair CODE to connect."); return; }
    if (!pairing.agent.enabled) { await ctx.reply(`Agent "${pairing.agent.name}" is currently disabled.`); return; }

    let conversationId = pairing.conversationId;
    if (!conversationId) {
      const conv = await prisma.conversation.create({
        data: { agentId: pairing.agentId, title: `Telegram: ${pairing.chatTitle}` },
      });
      conversationId = conv.id;
      await prisma.telegramPairing.update({ where: { id: pairing.id }, data: { conversationId } });
    }

    await ctx.sendChatAction("typing");
    try {
      const result = await chatWithAgent(pairing.agentId, conversationId, ctx.message.text, userId);
      const response = result.message.content;
      const chunks = splitMessage(response, 4096);
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: "Markdown" }).catch(() => ctx.reply(chunk));
      }
    } catch (e: any) {
      await ctx.reply(`Error: ${e.message}`);
      await log("error", "telegram", `Message error: ${e.message}`, { chatId });
    }
  });

  return bot;
}

export async function startBot(userId: string): Promise<{ success: boolean; username?: string; error?: string }> {
  // Stop existing instance first if token changed
  if (bots.has(userId)) {
    return { success: true, username: bots.get(userId)!.username };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.telegramBotToken) {
    return { success: false, error: "No bot token configured. Add yours in Profile → Telegram." };
  }

  try {
    const bot = buildBot(user.telegramBotToken, userId);
    await bot.launch();
    const me = await bot.telegram.getMe();
    const username = me.username || "";

    bots.set(userId, { bot, username, userId });
    await log("info", "telegram", `Bot @${username} started for user ${user.name}`);
    console.log(`📱 Telegram bot @${username} started (user: ${user.name})`);

    return { success: true, username };
  } catch (e: any) {
    await log("error", "telegram", `Bot start failed for user ${userId}: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export async function stopBot(userId: string): Promise<{ success: boolean }> {
  const inst = bots.get(userId);
  if (inst) {
    try { inst.bot.stop("manual"); } catch {}
    bots.delete(userId);
  }
  await log("info", "telegram", `Bot stopped for user ${userId}`);
  return { success: true };
}

// Restart a bot (e.g. after token update)
export async function restartBot(userId: string): Promise<{ success: boolean; username?: string; error?: string }> {
  await stopBot(userId);
  return startBot(userId);
}

// Called at server startup — boot a bot for every user who has a token
export async function startAllUserBots(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { telegramBotToken: { not: "" } },
    select: { id: true, name: true },
  });
  for (const user of users) {
    const r = await startBot(user.id);
    if (!r.success) console.log(`📱 Bot for ${user.name} failed: ${r.error}`);
  }
}

// Send a message using the user's own running bot
export async function sendTelegramMessage(userId: string, chatId: string, message: string): Promise<boolean> {
  const inst = bots.get(userId);
  if (!inst) return false;
  try {
    await inst.bot.telegram.sendMessage(chatId, message, { parse_mode: "Markdown" });
    return true;
  } catch {
    // Try plain text fallback if Markdown fails
    try {
      await inst.bot.telegram.sendMessage(chatId, message);
      return true;
    } catch { return false; }
  }
}

export async function generatePairingCode(agentId: string): Promise<string> {
  await prisma.telegramPairingCode.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await prisma.telegramPairingCode.create({ data: { code, agentId, expiresAt } });
  await log("info", "telegram", `Pairing code generated for agent ${agentId}: ${code}`);
  return code;
}

function splitMessage(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) { chunks.push(remaining); break; }
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  return chunks;
}
