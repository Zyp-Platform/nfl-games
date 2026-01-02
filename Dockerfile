# Multi-stage Dockerfile: Builds frontend (React SPA) + API backend

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm@9.12.0

# Copy package files and registry config
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
COPY frontend/.npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/*.config.* ./
COPY frontend/tsconfig.json frontend/tsconfig.node.json ./

# Build React SPA
RUN pnpm build

# Stage 2: Build API (needs ALL deps for typescript, prisma)
FROM node:20-alpine AS api-builder

WORKDIR /app/api

# Install pnpm
RUN npm install -g pnpm@9.12.0

# Copy package files and registry config
COPY api/package.json api/pnpm-lock.yaml* ./
COPY api/.npmrc ./

# Copy prisma schema BEFORE install (postinstall runs prisma generate)
COPY api/prisma ./prisma

# Install ALL dependencies (needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY api/src ./src
COPY api/tsconfig.json ./

# Build API (runs prebuild: prisma generate, then tsc)
RUN pnpm build

# Stage 3: Runtime
FROM node:20-alpine

# Install OpenSSL and curl for health checks
RUN apk add --no-cache openssl curl

WORKDIR /app

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy API runtime - use node_modules and prisma from builder (includes generated Prisma client)
COPY --from=api-builder /app/api/dist ./api/dist
COPY --from=api-builder /app/api/node_modules ./api/node_modules
COPY --from=api-builder /app/api/prisma ./api/prisma
COPY api/package.json ./api/package.json

# Add health check script
RUN printf '#!/bin/sh\ncurl -f http://localhost:3205/health || exit 1\n' > /healthcheck.sh && chmod +x /healthcheck.sh

# Add startup script that runs migrations then starts server
RUN printf '#!/bin/sh\ncd /app/api\nnpx prisma migrate deploy\nnode dist/api/server.js\n' > /start.sh && chmod +x /start.sh

# Environment
ENV NODE_ENV=production

# Expose API port
EXPOSE 3205

# Start with migrations
CMD ["/start.sh"]
