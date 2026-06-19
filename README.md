# Nutricount Backend

Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `GOOGLE_CLIENT_ID`

3. Generate and push database schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/v1/auth/google`: Login with Google ID Token
- `POST /api/v1/auth/refresh`: Refresh Access Token
- `POST /api/v1/auth/logout`: Logout
- `GET /api/v1/auth/me`: Get current user (Protected)
# nutricount-backend
