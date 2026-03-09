#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass()  { echo -e "  ${GREEN}✔${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "  ${RED}✘${NC} $1"; }
info()  { echo -e "  ${CYAN}→${NC} $1"; }

ERRORS=0
FIXED=0

echo ""
echo -e "${CYAN}⚡ ZEUS — Preflight Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. OS ────────────────────────────────────────
echo -e "${CYAN}[OS]${NC}"
if [[ "$(uname)" == "Linux" ]]; then
  . /etc/os-release 2>/dev/null || true
  pass "Linux detected (${PRETTY_NAME:-$(uname -r)})"
else
  warn "Non-Linux OS ($(uname)). ZEUS targets Ubuntu but may still work."
fi
echo ""

# ── 2. Node.js ───────────────────────────────────
echo -e "${CYAN}[Node.js]${NC}"
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
  if (( NODE_MAJOR >= 18 )); then
    pass "Node.js $NODE_VER"
  else
    fail "Node.js $NODE_VER is too old (need >= 18)"
    info "Install via: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
    ((ERRORS++))
  fi
else
  fail "Node.js not found"
  info "Install via: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
  info "Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install 22"
  ((ERRORS++))
fi
echo ""

# ── 3. pnpm ──────────────────────────────────────
echo -e "${CYAN}[pnpm]${NC}"
if command -v pnpm &>/dev/null; then
  PNPM_VER=$(pnpm -v)
  PNPM_MAJOR=$(echo "$PNPM_VER" | cut -d. -f1)
  if (( PNPM_MAJOR >= 8 )); then
    pass "pnpm $PNPM_VER"
  else
    warn "pnpm $PNPM_VER is old (recommend >= 9)"
    info "Upgrading pnpm..."
    npm install -g pnpm@latest && ((FIXED++)) || ((ERRORS++))
  fi
else
  warn "pnpm not found — installing now..."
  if command -v npm &>/dev/null; then
    npm install -g pnpm && pass "pnpm installed ($(pnpm -v))" && ((FIXED++)) || { fail "Could not install pnpm"; ((ERRORS++)); }
  elif command -v corepack &>/dev/null; then
    corepack enable && corepack prepare pnpm@latest --activate && pass "pnpm installed via corepack" && ((FIXED++)) || { fail "Could not install pnpm"; ((ERRORS++)); }
  else
    fail "Cannot install pnpm — no npm or corepack found. Install Node.js first."
    ((ERRORS++))
  fi
fi
echo ""

# ── 4. npm (optional, used by some tools) ────────
echo -e "${CYAN}[npm]${NC}"
if command -v npm &>/dev/null; then
  pass "npm $(npm -v)"
else
  warn "npm not found (not critical — pnpm is the primary package manager)"
fi
echo ""

# ── 5. Git ───────────────────────────────────────
echo -e "${CYAN}[Git]${NC}"
if command -v git &>/dev/null; then
  pass "git $(git --version | awk '{print $3}')"
else
  warn "git not found (optional, but useful)"
  info "Install via: sudo apt-get install -y git"
fi
echo ""

# ── 6. curl ──────────────────────────────────────
echo -e "${CYAN}[curl]${NC}"
if command -v curl &>/dev/null; then
  pass "curl available"
else
  warn "curl not found — installing..."
  sudo apt-get install -y curl &>/dev/null && pass "curl installed" && ((FIXED++)) || warn "Could not install curl"
fi
echo ""

# ── 7. SQLite (optional — Prisma bundles its own engine) ─
echo -e "${CYAN}[SQLite]${NC}"
if command -v sqlite3 &>/dev/null; then
  pass "sqlite3 $(sqlite3 --version | awk '{print $1}')"
else
  warn "sqlite3 CLI not found (optional — Prisma handles DB internally)"
  info "Install via: sudo apt-get install -y sqlite3"
fi
echo ""

# ── 8. Disk / write permissions ──────────────────
echo -e "${CYAN}[Filesystem]${NC}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -w "$SCRIPT_DIR" ]; then
  pass "Write access to project directory"
else
  fail "No write access to $SCRIPT_DIR"
  ((ERRORS++))
fi

DATA_DIR="$SCRIPT_DIR/data"
mkdir -p "$DATA_DIR/logs" 2>/dev/null
if [ -w "$DATA_DIR" ]; then
  pass "Data directory ready ($DATA_DIR)"
else
  fail "Cannot write to data directory ($DATA_DIR)"
  ((ERRORS++))
fi
echo ""

# ── Summary ──────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if (( ERRORS > 0 )); then
  echo -e "${RED}Preflight failed — $ERRORS issue(s) must be resolved.${NC}"
  echo ""
  exit 1
fi

if (( FIXED > 0 )); then
  echo -e "${YELLOW}Fixed $FIXED issue(s) automatically.${NC}"
fi
echo -e "${GREEN}All prerequisites met.${NC}"
echo ""

# ── Install if --install flag ────────────────────
if [[ "$1" == "--install" || "$1" == "-i" ]]; then
  echo -e "${CYAN}[Install]${NC}"
  info "Running pnpm install..."
  cd "$SCRIPT_DIR"
  pnpm install
  echo ""

  info "Generating Prisma client..."
  cd "$SCRIPT_DIR/backend"
  npx prisma generate
  echo ""

  if [ ! -f "$DATA_DIR/zeus.db" ]; then
    info "No database found — running migration + seed..."
    npx prisma migrate dev --name init --schema prisma/schema.prisma
    cd "$SCRIPT_DIR"
    pnpm seed
  else
    pass "Database already exists ($DATA_DIR/zeus.db)"
  fi

  echo ""
  echo -e "${GREEN}⚡ ZEUS is ready.${NC}"
  echo ""
  echo "  Start dev mode:    pnpm dev"
  echo "  Start worker:      pnpm worker"
  echo "  Re-seed data:      pnpm seed"
  echo ""
fi
