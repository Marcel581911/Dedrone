## Cursor Cloud specific instructions

### Project overview

ZEUS ("Gulli" in the UI) is a self-hosted personal AI assistant. Monorepo under `zeus/` with `backend` (Fastify + Prisma) and `frontend` (Vite + React). See `zeus/CLAUDE.md` for full architecture and commands.

### Database

The Prisma schema (`zeus/backend/prisma/schema.prisma`) uses `provider = "postgresql"`. PostgreSQL must be running on `localhost:5432` with database `zeus` and user `zeus` (password `zeus`). The backend `.env` must have `DATABASE_URL="postgresql://zeus:zeus@localhost:5432/zeus"`.

**Important:** The migration SQL files under `zeus/backend/prisma/migrations/` contain SQLite-specific syntax (e.g. `datetime` type) that is incompatible with PostgreSQL. Use `npx prisma db push --accept-data-loss` instead of `prisma migrate dev` to sync the schema. After pushing, seed with `pnpm seed`.

### Starting PostgreSQL

```bash
sudo pg_ctlcluster 16 main start
```

### Dev commands

Standard commands are documented in `zeus/CLAUDE.md` and `zeus/package.json`. Key ones:

- `pnpm dev` — starts both backend (:3000) and frontend (:5173) with hot reload
- `pnpm seed` — seeds default agents, skills, scheduled tasks, modules
- `pnpm build` — builds frontend to `zeus/frontend/dist/`

### Onboarding

On first run, the app requires setup via the UI wizard or POST to `/api/auth/setup` with `{name, password, assistantName, assistantPersonality, city, timezone}`.

### Lint / Tests

No ESLint or test runner is configured. TypeScript type-checking (`npx tsc --noEmit`) has pre-existing errors in both backend and frontend that do not affect runtime — the app uses `tsx` (esbuild) and Vite for transpilation. The only test file is `zeus/skills/read_email_inbox/index.test.ts` (stub).

### Runtime notes

- The backend emits a harmless `punycode` deprecation warning on startup — this is a Node.js core module deprecation and can be ignored.
- The frontend Vite dev server warns about a duplicate `"Cuba"` key in `Travel.tsx` — non-blocking.
- The worker and scheduler start automatically with the backend in dev mode.
