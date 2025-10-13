# Repository Guidelines

## Project Structure & Module Organization
This monorepo separates concerns by runtime. `backend/src` houses the Express API with parallel folders for `controllers`, `services`, `routes`, `middleware`, `validators`, and `config/supabase.js`; seed helpers live in `backend/scripts/`. `frontend/src` contains the Vite React app, split into `components`, `pages`, `context`, `services`, and `test`. Serverless endpoints for Vercel reside under `api/index.js`, while operational references (SQL, deployment checklists) are curated in `docs/`. Generated assets in `dist/` are read-only.

## Build, Test, and Development Commands
Use Node 18+.  
- `npm run build` (root) installs frontend deps and writes the production bundle to `frontend/dist`.  
- `cd backend && npm install && npm run dev` runs the API with nodemon on port 5000 (`npm start` for plain Node).  
- `cd frontend && npm install && npm run dev` starts Vite dev server; `npm run build` and `npm run preview` validate production output.  
Supabase data resets should rely on the SQL in `supabase_schema.sql` or `docs/` rather than deprecated migration scripts.

## Coding Style & Naming Conventions
Stick to two-space indentation, trailing semicolons, and ES module imports. Use camelCase for variables and functions, PascalCase for React components, and SCREAMING_SNAKE_CASE for environment keys. Run `npm run lint` inside `frontend/` before pushing; align backend additions with existing controller-service-validator patterns and keep filenames descriptive.

## Testing Guidelines
Backend suites use Jest and Supertest; co-locate new specs beside the code they cover (e.g. `backend/src/controllers/leadController.test.js`) and execute with `npm test` or `npm run test:watch`. Frontend tests use Vitest with Testing Library in `frontend/src/test`; run `npm run test` for watch mode or `npm run test:run` in CI. Prioritize role-based scenarios and Supabase edge cases, and document high-risk regressions in `docs/` when automation cannot cover them.

## Commit & Pull Request Guidelines
Match the existing uppercase commit prefixes (`FEATURE:`, `FIX:`, `CHORE:`) and keep subjects under 72 characters in imperative mood. PRs should provide a concise summary, linked issue or ticket, and proof of passing tests or linting. UI-facing changes need before/after screenshots or a Vite preview link, and any schema or env updates must include accompanying SQL or documentation changes.

## Environment & Configuration Notes
`.env.example` in `backend/` and `frontend/` list required keys; copy them locally but never commit secrets. Configure Supabase, JWT, and Gemini credentials through environment variables or Vercel project settings. Keep fallback toggles (e.g. `CHATBOT_FALLBACK_ONLY`, rate limits) conservative in shared deployments and call out temporary overrides in the PR description to aid release owners.
