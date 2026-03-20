#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/opt/openclaw-poc"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==============================="
echo "  ZEUS-POC  Installer"
echo "==============================="
echo ""

# --- Check we are on a Debian/Ubuntu-like system ---
if ! command -v apt-get &>/dev/null; then
  echo "ERROR: This installer requires a Debian/Ubuntu system with apt-get."
  exit 1
fi

echo "[1/7] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip git curl >/dev/null

echo "[2/7] Creating install directory ($INSTALL_DIR)..."
mkdir -p "$INSTALL_DIR"

echo "[3/7] Copying application files..."
cp -r "$SCRIPT_DIR/app"           "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/frontend"      "$INSTALL_DIR/"
cp    "$SCRIPT_DIR/requirements.txt" "$INSTALL_DIR/"
cp    "$SCRIPT_DIR/onboard.sh"    "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/onboard.sh"

echo "[4/7] Setting up Python virtual environment..."
if [ ! -d "$INSTALL_DIR/venv" ]; then
  python3 -m venv "$INSTALL_DIR/venv"
fi
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip -q
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt" -q

echo "[5/7] Installing systemd service..."
cp "$SCRIPT_DIR/systemd/openclaw-poc.service" /etc/systemd/system/openclaw-poc.service
systemctl daemon-reload
systemctl enable openclaw-poc.service

echo "[6/7] Running onboarding..."
bash "$INSTALL_DIR/onboard.sh"

echo "[7/7] Starting service..."
systemctl restart openclaw-poc.service

echo ""
echo "==============================="
echo "  Installation complete!"
echo "==============================="
echo ""
echo "Service status:  systemctl status openclaw-poc"
echo "View logs:       journalctl -u openclaw-poc -f"
echo "Chat UI:         http://$(hostname -I | awk '{print $1}'):8000"
echo ""
