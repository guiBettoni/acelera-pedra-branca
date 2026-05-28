Backend proxy for Supabase operations.

Setup:

1. Copy `.env.example` to `.env` and fill `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with your Supabase project values.
2. Install dependencies: `npm install` inside `backend/`.
3. Start server: `npm start` (defaults to port from `.env` or 3000).

This server exposes simple endpoints under `/api/*` used by the frontend. Keep your `.env` out of source control.
