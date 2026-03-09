# ZEUS-POC — Minimal Agent Runtime

A lightweight proof-of-concept agent runtime that installs on Ubuntu, connects to the OpenAI API, and exposes a chat interface over HTTP and WebSocket.

## Quick Start

```bash
git clone <repo-url>
cd openclaw-poc
chmod +x install.sh
sudo ./install.sh
```

The installer will:

1. Install system dependencies (`python3`, `python3-venv`, `python3-pip`, `git`, `curl`).
2. Create a virtual environment at `/opt/openclaw-poc/venv`.
3. Install Python packages from `requirements.txt`.
4. Run onboarding (prompts for GPT API key and agent name).
5. Enable and start the `openclaw-poc` systemd service.

## Configuration

Configuration is stored in `~/.openclaw_poc/config.json` (permissions `600`).

To re-run onboarding:

```bash
sudo /opt/openclaw-poc/onboard.sh
sudo systemctl restart openclaw-poc
```

## Access the Chat UI

Open a browser and navigate to:

```
http://<SERVER_IP>:8000
```

The server listens on `0.0.0.0:8000` so it is reachable from other machines on the network.

## Connect from Another Machine

**HTTP:**

```bash
curl -X POST http://<SERVER_IP>:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"sender":"user","text":"hello"}'
```

**WebSocket:**

Connect to `ws://<SERVER_IP>:8000/ws` and send JSON:

```json
{"sender": "user", "text": "hello"}
```

## API Endpoints

| Method | Path              | Description          |
|--------|-------------------|----------------------|
| GET    | `/health`         | Health check         |
| GET    | `/api/v1/agent`   | Agent metadata       |
| POST   | `/api/v1/chat`    | Send a chat message  |
| GET    | `/api/v1/history` | Chat history         |
| WS     | `/ws`             | WebSocket chat       |
| GET    | `/`               | Web chat UI          |

## Run Tests

```bash
chmod +x tests/run_tests.sh
./tests/run_tests.sh              # test against localhost:8000
./tests/run_tests.sh 192.168.1.5  # test against remote host
```

## Enable Telegram Bot

1. Create a bot via [@BotFather](https://t.me/BotFather) and get a token.
2. Re-run onboarding and answer **y** to the Telegram question, then paste the token.
3. Restart the service:

```bash
sudo systemctl restart openclaw-poc
```

The bot will relay messages between Telegram and the agent.

## Service Management

```bash
sudo systemctl status openclaw-poc
sudo systemctl restart openclaw-poc
sudo journalctl -u openclaw-poc -f
```

## Project Structure

```
openclaw-poc/
├── install.sh                 # Idempotent installer
├── onboard.sh                 # Onboarding script
├── requirements.txt           # Python dependencies
├── README.md
├── systemd/
│   └── openclaw-poc.service   # systemd unit file
├── app/
│   ├── main.py                # FastAPI server
│   ├── agent.py               # GPT integration
│   ├── config.py              # Configuration management
│   ├── storage.py             # SQLite storage
│   └── telegram_bridge.py     # Telegram bot bridge
├── frontend/
│   └── index.html             # Chat web UI
└── tests/
    └── run_tests.sh           # Integration tests
```

## Security Notes

- The GPT API key is never logged.
- `config.json` is created with `chmod 600`.
- Network errors from the OpenAI API are handled gracefully.
