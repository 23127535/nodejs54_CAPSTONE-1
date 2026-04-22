# Build stage
FROM node:20-alpine AS builder

# Install dependencies for Prisma (needed for native modules)
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for Prisma)
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine AS runner

# Install dependencies for Prisma (native module compatibility)
RUN apk add --no-cache libc6-compat

# Create app user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma generated client from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@prisma /app/node_modules/@prisma

# Copy Prisma schema
COPY --chown=nodejs:nodejs prisma ./prisma/

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3069

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3069/api-docs', (r) => {if(r.statusCode!==200)throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "server.js"]
