# Multi-stage build for OWP Pool server
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S owp && \
    adduser -S owp -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/schema.sql ./src/database/schema.sql

# Create data directory for SQLite
RUN mkdir -p /data && chown owp:owp /data

# Switch to non-root user
USER owp

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8787/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Environment variables
ENV NODE_ENV=production
ENV OWP_HOST=0.0.0.0
ENV OWP_PORT=8787
ENV OWP_DB_PATH=/data/pool.db

# Start server
CMD ["node", "dist/main.js"]
