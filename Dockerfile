# ==========================================================
# Multi-Stage Production Dockerfile: AI Resume & ATS Analyzer
# ==========================================================

# Stage 1: Build the Vite React Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY ai-resume-analyzer/client/package*.json ./
RUN npm ci

COPY ai-resume-analyzer/client/ ./
RUN npm run build

# Stage 2: Production Server Runtime & SQLite Engine
FROM node:20-alpine AS runner
WORKDIR /app/server

# Install build tools needed for native node addons (better-sqlite3)
RUN apk add --no-cache python3 make g++ wget

ENV NODE_ENV=production
ENV PORT=4000

COPY ai-resume-analyzer/server/package*.json ./
RUN npm ci --omit=dev

COPY ai-resume-analyzer/server/ ./

# Copy compiled frontend from Stage 1 into server static public directory
COPY --from=client-builder /app/client/dist ./public

# Create dedicated persistent data directory for SQLite database
RUN mkdir -p /app/server/data

VOLUME ["/app/server/data"]

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "index.js"]
