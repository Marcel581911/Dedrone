import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

from app.agent import chat as agent_chat
from app.config import get_agent_name
from app.storage import init_db, save_message, get_history
from app.telegram_bridge import start_telegram_bot, stop_telegram_bot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("openclaw-poc")

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await start_telegram_bot()
    logger.info("ZEUS-POC agent runtime started.")
    yield
    await stop_telegram_bot()
    logger.info("ZEUS-POC agent runtime stopped.")


app = FastAPI(title="ZEUS-POC Agent Runtime", lifespan=lifespan)


class ChatRequest(BaseModel):
    sender: str
    text: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/v1/agent")
async def agent_info():
    return {"name": get_agent_name(), "status": "ready"}


@app.post("/api/v1/chat")
async def chat_endpoint(req: ChatRequest):
    reply = await agent_chat(req.text)
    await save_message(req.sender, req.text, reply)
    return {"reply": reply}


@app.get("/api/v1/history")
async def history(limit: int = 50):
    rows = await get_history(limit)
    return {"history": rows}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await ws.send_json({"reply": "Error: invalid JSON"})
                continue

            sender = msg.get("sender", "anonymous")
            text = msg.get("text", "")
            if not text:
                await ws.send_json({"reply": "Error: empty message"})
                continue

            reply = await agent_chat(text)
            await save_message(sender, text, reply)
            await ws.send_json({"reply": reply})
    except WebSocketDisconnect:
        pass


@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    index = FRONTEND_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index), media_type="text/html")
    return HTMLResponse("<h1>ZEUS-POC</h1><p>Frontend not found.</p>")
