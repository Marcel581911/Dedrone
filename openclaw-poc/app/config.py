import json
import os
from pathlib import Path

CONFIG_DIR = Path.home() / ".openclaw_poc"
CONFIG_FILE = CONFIG_DIR / "config.json"
DB_FILE = CONFIG_DIR / "chat.db"

DEFAULT_CONFIG = {
    "agent_name": "zeus-agent",
    "gpt_api_key": "",
    "telegram_enabled": False,
    "telegram_bot_token": "",
}


def ensure_config_dir() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    ensure_config_dir()
    if not CONFIG_FILE.exists():
        return dict(DEFAULT_CONFIG)
    with open(CONFIG_FILE, "r") as f:
        data = json.load(f)
    merged = {**DEFAULT_CONFIG, **data}
    return merged


def save_config(cfg: dict) -> None:
    ensure_config_dir()
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)
    os.chmod(CONFIG_FILE, 0o600)


def get_api_key() -> str:
    return load_config().get("gpt_api_key", "")


def get_agent_name() -> str:
    return load_config().get("agent_name", "zeus-agent")
