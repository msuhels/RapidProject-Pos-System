# Base image
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Debug: List what was copied
RUN ls -la
RUN ls -la src/ || echo "src directory not found!"

# Build arguments
ARG DATABASE_URL
ARG NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy everything (non-standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"]