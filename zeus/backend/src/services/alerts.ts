import { prisma } from "../db.js";
import { log } from "../logger.js";
import { sendTelegramMessage } from "./telegram.js";

export async function sendTelegramAlert(userId: string, message: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.telegramChatId) return false;
    return sendTelegramMessage(userId, user.telegramChatId, message);
  } catch {
    return false;
  }
}

export async function sendSmsAlert(userId: string, message: string): Promise<boolean> {
  try {
    const [sid, authToken, from, user] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "twilio_account_sid" } }),
      prisma.setting.findUnique({ where: { key: "twilio_auth_token" } }),
      prisma.setting.findUnique({ where: { key: "twilio_from" } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!sid?.value || !authToken?.value || !from?.value || !user?.phone) return false;

    const body = new URLSearchParams({ To: user.phone, From: from.value, Body: message });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid.value}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${sid.value}:${authToken.value}`).toString("base64")}`,
        },
        body: body.toString(),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendAlert(
  userId: string,
  message: string
): Promise<{ telegram: boolean; sms: boolean }> {
  const [tg, sms] = await Promise.allSettled([
    sendTelegramAlert(userId, message),
    sendSmsAlert(userId, message),
  ]);

  const result = {
    telegram: tg.status === "fulfilled" && tg.value,
    sms: sms.status === "fulfilled" && sms.value,
  };

  if (result.telegram || result.sms) {
    await log("info", "alert", `Alert sent to ${userId}: tg=${result.telegram} sms=${result.sms}`);
  }
  return result;
}
