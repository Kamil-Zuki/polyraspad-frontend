# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Build-time args for Next.js public env (baked into client bundle)
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_FF_AI_AGENTS=false
ARG NEXT_PUBLIC_FF_ADVANCED_MODULES=false

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_FF_AI_AGENTS=$NEXT_PUBLIC_FF_AI_AGENTS
ENV NEXT_PUBLIC_FF_ADVANCED_MODULES=$NEXT_PUBLIC_FF_ADVANCED_MODULES

# Resilient registry access (ECONNRESET / ETIMEDOUT / flaky links during docker build)
ENV NPM_CONFIG_FETCH_RETRIES=10
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_FETCH_TIMEOUT=600000
ENV NPM_CONFIG_MAXSOCKETS=5

COPY package.json package-lock.json* ./
# Outer retries: npm's fetch-retry does not always recover from read ETIMEDOUT mid-download.
RUN --mount=type=cache,target=/root/.npm \
    sh -ec 'i=0; until npm ci --no-audit --no-fund; do i=$((i+1)); [ "$i" -lt 4 ] || exit 1; echo "npm ci failed (attempt $i), retrying in 20s..."; sleep 20; done'

COPY . .
RUN mkdir -p public
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
