import { prisma } from "./db.js";
import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(import.meta.dirname, "../../data/logs");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export async function log(
  level: "info" | "warn" | "error" | "debug",
  source: string,
  message: string,
  meta: Record<string, unknown> = {}
) {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}\n`;
  const logFile = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFileSync(logFile, line);

  try {
    await prisma.logEntry.create({
      data: { level, source, message, meta: JSON.stringify(meta) },
    });
  } catch {
    // DB might not be ready during bootstrap
  }
}
