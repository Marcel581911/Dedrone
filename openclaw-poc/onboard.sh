#!/usr/bin/env bash
set -euo pipefail

CONFIG_DIR="$HOME/.openclaw_poc"
CONFIG_FILE="$CONFIG_DIR/config.json"

mkdir -p "$CONFIG_DIR"

echo "==============================="
echo "  ZEUS-POC  Onboarding"
echo "==============================="
echo ""

EXISTING_KEY=""
EXISTING_NAME="zeus-agent"
EXISTING_TG="false"
EXISTING_TG_TOKEN=""

if [ -f "$CONFIG_FILE" ]; then
  EXISTING_KEY=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('gpt_api_key',''))" 2>/dev/null || true)
  EXISTING_NAME=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('agent_name','zeus-agent'))" 2>/dev/null || true)
  EXISTING_TG=$(python3 -c "import json; print(str(json.load(open('$CONFIG_FILE')).get('telegram_enabled',False)).lower())" 2>/dev/null || true)
  EXISTING_TG_TOKEN=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('telegram_bot_token',''))" 2>/dev/null || true)
fi

read -rp "GPT API Key [${EXISTING_KEY:+****${EXISTING_KEY: -4}}]: " GPT_KEY
GPT_KEY="${GPT_KEY:-$EXISTING_KEY}"

read -rp "Agent Name [$EXISTING_NAME]: " AGENT_NAME
AGENT_NAME="${AGENT_NAME:-$EXISTING_NAME}"

read -rp "Enable Telegram bot? (y/N) [$EXISTING_TG]: " TG_ENABLED
TG_ENABLED="${TG_ENABLED:-$EXISTING_TG}"
case "$TG_ENABLED" in
  y|Y|yes|true) TG_ENABLED="true" ;;
  *) TG_ENABLED="false" ;;
esac

TG_TOKEN="$EXISTING_TG_TOKEN"
if [ "$TG_ENABLED" = "true" ]; then
  read -rp "Telegram Bot Token [$EXISTING_TG_TOKEN]: " TG_TOKEN_INPUT
  TG_TOKEN="${TG_TOKEN_INPUT:-$EXISTING_TG_TOKEN}"
fi

cat > "$CONFIG_FILE" <<EOF
{
  "agent_name": "$AGENT_NAME",
  "gpt_api_key": "$GPT_KEY",
  "telegram_enabled": $TG_ENABLED,
  "telegram_bot_token": "$TG_TOKEN"
}
EOF

chmod 600 "$CONFIG_FILE"

echo ""
echo "Configuration saved to $CONFIG_FILE"
echo "Agent name: $AGENT_NAME"
echo "Telegram:   $TG_ENABLED"
echo ""
echo "Onboarding complete."
