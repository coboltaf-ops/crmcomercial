# ─────────────────────────────────────────────────────────────
# CRM Comercial — imagen de producción para el servidor propio (Docker).
# Misma plantilla probada en NominaCore / OperCore: build completo + `next start`.
# ─────────────────────────────────────────────────────────────

# ── 1) Dependencias ──
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2) Build ──
FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build con WEBPACK (estable), NO Turbopack (beta en producción, rompe rutas).
RUN npx next build --webpack

# ── 3) Runner (lo que se sube al server) ──
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Backend de datos por defecto para producción en el server propio.
ENV DATA_BACKEND=postgres
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario sin privilegios (no correr como root).
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
# Semilla inicial: con Postgres vacío, la primera lectura cae a estos JSON del
# bundle para inicializar el CRM (luego todo escribe/lee en Postgres).
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
