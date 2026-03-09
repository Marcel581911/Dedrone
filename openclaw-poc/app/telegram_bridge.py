import asyncio
import logging

from app.config import load_config
from app.agent import chat as agent_chat
from app.storage import save_message

logger = logging.getLogger("openclaw-poc")

_bot_task: asyncio.Task | None = None


async def start_telegram_bot() -> None:
    global _bot_task
    cfg = load_config()
    if not cfg.get("telegram_enabled"):
        logger.info("Telegram bridge is disabled.")
        return
    token = cfg.get("telegram_bot_token", "")
    if not token:
        logger.warning("Telegram enabled but no bot token configured.")
        return

    try:
        from telegram import Update
        from telegram.ext import (
            ApplicationBuilder,
            CommandHandler,
            MessageHandler,
            ContextTypes,
            filters,
        )
    except ImportError:
        logger.error("python-telegram-bot is not installed. Skipping Telegram bridge.")
        return

    async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await update.message.reply_text("Connected to agent. Send me a message!")

    async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        user_text = update.message.text
        sender = update.effective_user.username or str(update.effective_user.id)
        reply = await agent_chat(user_text)
        await save_message(sender, user_text, reply)
        await update.message.reply_text(reply)

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", handle_start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Starting Telegram bot...")
    _bot_task = asyncio.create_task(_run_bot(app))


async def _run_bot(app) -> None:
    try:
        await app.initialize()
        await app.start()
        await app.updater.start_polling()
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        logger.error("Telegram bot error: %s", exc)
    finally:
        try:
            await app.updater.stop()
            await app.stop()
            await app.shutdown()
        except Exception:
            pass


async def stop_telegram_bot() -> None:
    global _bot_task
    if _bot_task and not _bot_task.done():
        _bot_task.cancel()
        try:
            await _bot_task
        except asyncio.CancelledError:
            pass
    _bot_task = None
