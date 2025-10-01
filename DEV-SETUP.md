# Local Development Setup

This project now runs entirely on your local machine. No container tooling is required for day-to-day development.

## Available Scripts

### start-local.bat
- Stops anything listening on ports 5000 and 3000
- Rewrites `frontend/.env` so the UI calls `http://localhost:5000/api`
- Starts the backend (`npm run start`) in a new terminal
- Starts the frontend (`npm run dev`) in a new terminal

### start-dev.bat
- Legacy filename kept for convenience
- Prints a reminder that the legacy container workflow is retired and forwards to `start-local.bat`

### start-frontend.bat
- Starts only the React dev server on http://localhost:3000

### stop-all.bat
- Looks for processes bound to ports 3000 and 5000
- Force terminates anything it finds

## NPM Commands

Run these once in each workspace (backend and frontend) to make sure dependencies are installed:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

To launch services manually (if you prefer not to use the batch files):

```powershell
# Backend
cd backend
npm run start

# Frontend (in a second terminal)
cd frontend
npm run dev
```

The backend listens on http://localhost:5000 and exposes a `/health` endpoint. The frontend proxies `/api` calls to that backend and serves the UI on http://localhost:3000.

## Troubleshooting

1. If you see "address already in use" errors, run `stop-all.bat` and try again.
2. Make sure `backend/.env` and `frontend/.env` contain the Supabase keys supplied in the repository.
3. Confirm Node.js 18+ and npm 9+ are installed locally: `node -v`, `npm -v`.

With these scripts, you can develop without any container tooling.
