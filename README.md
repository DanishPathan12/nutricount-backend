# Nutricount Backend

Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
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

## Docker & EC2 Deployment

### 1. Build and Run with Docker Compose
```bash
# Start backend container in background
docker compose up -d --build

# (Optional) Start both backend & AI microservice
docker compose --profile full up -d --build
```

### 2. EC2 Production Deployment
See [`DEPLOYMENT.md`](file:///c:/Users/Danish/Desktop/nutricount-backend/DEPLOYMENT.md) for step-by-step instructions on setting up AWS EC2, configuring Security Groups, AWS RDS connections, SSL with Nginx & Certbot, and auto-restart policies.

## API Endpoints

- `POST /api/v1/auth/google`: Login with Google ID Token
- `POST /api/v1/auth/refresh`: Refresh Access Token
- `POST /api/v1/auth/logout`: Logout
- `GET /api/v1/auth/me`: Get current user (Protected)
