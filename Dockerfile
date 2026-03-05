# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeUser -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodeUser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeUser:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nodeUser

# Port configuration
ARG PORT=8080
ENV PORT=$PORT

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]