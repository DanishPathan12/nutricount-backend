# ==========================================
# Stage 1: Build TypeScript Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript (generates dist/)
RUN npm run build

# ==========================================
# Stage 2: Install Production Dependencies
# ==========================================
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# ==========================================
# Stage 3: Minimal Production Runner Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper PID 1 signal forwarding (graceful shutdown)
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    PORT=5000

# Create uploads directory structure and set non-root ownership
RUN mkdir -p /app/uploads/meals && \
    chown -R node:node /app

# Copy production dependencies
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules

# Copy compiled JavaScript output
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy package descriptors, drizzle migrations and AWS RDS CA certificate
COPY --chown=node:node package.json ./
COPY --chown=node:node drizzle ./drizzle
COPY --chown=node:node global-bundle.pem* ./

# Switch to standard non-root user
USER node

# Expose the API port
EXPOSE 5000

# Container healthcheck using Node's native fetch API
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Handle process signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "dist/server.js"]

