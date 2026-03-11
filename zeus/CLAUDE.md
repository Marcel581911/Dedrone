# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZEUS (branded as "Gulli" in the UI) is a self-hosted personal AI assistant platform. It runs a multi-agent system where a primary Orchestrator agent handles user requests, delegates tasks to specialized agents via a ticket queue, and interacts with built-in tools (calendar, email, notes, tasks, automations).

## Commands

**Package manager:** `pnpm` (monorepo with `backend` and `frontend` workspaces)

```bash
# Development (both frontend + backend with hot reload)
pnpm dev

# Production (build frontend, then serve via backend)
pnpm build && pnpm --filter backend dev

# Database
pnpm db:migrate          # Run pending migrations
pnpm db:generate         # Regenerate Prisma client after schema changes
pnpm seed                # Seed database with default agents/skills

# Worker (runs separately from main server in production)
pnpm worker
```

**Backend only:**
```bash
pnpm --filter backend dev        # tsx watch src/index.ts
pnpm --filter backend db:migrate # prisma migrate dev
```

**Frontend only:**
```bash
pnpm --filter frontend dev   # Vite dev server
pnpm --filter frontend build # Output to frontend/dist/
```

No test runner is configured beyond the single skill stub test in `skills/read_email_inbox/index.test.ts`.

## Architecture

### Monorepo Layout
- `backend/` — Fastify API server (Node.js, TypeScript, Prisma/SQLite)
- `frontend/` — React SPA (Vite, Tailwind CSS v4, React Router v7)
- `skills/` — File-based skill stubs (auto-generated, not yet wired into execution)
- `modules/` — Module manifests (`manifest.json`) that declare agents, skills, and scheduled tasks to install

### Backend

**Entry point:** `backend/src/index.ts` — registers all Fastify plugins and routes, starts the worker, scheduler, and Telegram bot.

**Auth flow:** Session cookie (`zeus_session`) validated via `backend/src/services/auth.ts`. All `/api/*` routes except `/api/auth/*` require a valid session. First-time setup goes through an onboarding flow that gates the entire API.

**Database:** SQLite via Prisma. Schema at `backend/prisma/schema.prisma`. All configuration is stored in the `Setting` key/value table (OpenAI key, Telegram token, email credentials, etc.).

**Routes** (`backend/src/routes/`): One file per feature area. Each exports a Fastify plugin registered in `index.ts`.

**Services** (`backend/src/services/`):
- `chat.ts` — Core LLM loop. Calls OpenAI with agent system prompt + memory context + skills as tools. Runs up to 5 tool-call rounds per message. Detects missing skills and records `SkillGap` entries.
- `worker.ts` — Background polling loop (5s interval) that picks up `queued` tickets, creates a conversation, and calls `chatWithAgent` to produce output. Runs in the same process as the main server.
- `scheduler.ts` — Runs `ScheduledTask` records on their configured intervals.
- `memory.ts` — Semantic memory using OpenAI embeddings (`text-embedding-3-small`). Stores chunked text with cosine-similarity search. Pruning keeps max 500 memories per agent.
- `skill-executor.ts` — Routes skill calls from the LLM to built-in handlers (e.g. `create_ticket`, `assign_ticket`, `send_email`, `add_calendar_event`, `save_note`, etc.). Skills not in `BUILTIN_SKILLS` return a failure and generate a `SkillGap`.
- `telegram.ts` — Telegraf bot that routes messages from paired Telegram chats to their assigned agent.

### Agent / Skill System

Agents are database records with `model`, `temperature`, `maxTokens`, `systemPrompt`, `role`, and `mission`. The special agent `orchestrator-001` is the primary user-facing agent.

Skills are registered in the `Skill` table and assigned to agents via `AgentSkill`. When an agent calls a tool, `skill-executor.ts` looks it up in `BUILTIN_SKILLS` first; if missing, a `SkillGap` is recorded. The UI can generate a stub file under `skills/<name>/` from the Skill Gaps page.

Agents can delegate to other agents by calling `create_ticket` + `assign_ticket` — the worker then picks up the ticket and processes it with the assigned agent.

### Module System

Modules live in `modules/<slug>/manifest.json`. A manifest declares `agents`, `skills`, `scheduledTasks`, and `pages`. Installing a module via the API (`/api/modules/:slug/install`) provisions those resources. Modules can require config fields (e.g. API keys) before activation.

### Frontend

Single-page React app. All backend calls go through `frontend/src/api.ts` which wraps `fetch` with credential cookies and dispatches a `zeus:logout` event on 401.

**Routing:**
- `/` → `Home` (Orchestrator chat + dashboard widgets)
- `/tools/*` → `Tools` hub with sub-routes: `todo`, `calendar`, `email`, `notes`, `automations`
- `/settings` → Settings (connections, agents, skills, logs, access)
- `/settings/agents/:id` → `AgentDetail`

**UI primitives:** `frontend/src/components/ui.tsx` exports `Card`, `Btn`, `Badge`, `Input`, `Label`.

**Theme:** CSS custom properties (`--bg-root`, `--bg-surface`, `--bg-card`, `--bg-input`, `--accent`, `--accent-bg`, `--border`, `--text-primary`, `--text-secondary`, `--text-muted`). Always use these variables for new UI rather than hardcoded colors.

### Key Environment Variables

- `DATABASE_URL` — SQLite file path (e.g. `file:./zeus.db`)
- `PORT` — Backend port (default `3000`)

OpenAI API key, Telegram bot token, IMAP/SMTP credentials, and other runtime config are stored in the `Setting` table (not env vars), managed through the Settings UI.
