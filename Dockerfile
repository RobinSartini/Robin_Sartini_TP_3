# ========== STAGE 1 : Build ==========
FROM node:20-alpine AS builder
WORKDIR /app

# Dependencies first (caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Source code
COPY src ./src

# Clean devDependencies
RUN npm prune --production

# ========== STAGE 2 : Production ==========
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user and remove vulnerable global npm
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Copy only what's necessary, changing ownership
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/src ./src
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# Switch to non-root
USER appuser

EXPOSE 3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
