# Imagen de producción de la plataforma.
#
# Etapas:
#   deps         dependencias completas (pnpm, lockfile congelado)
#   build        compila Next en modo standalone y genera el cliente Prisma
#   herramientas imagen con el CLI de Prisma y tsx: migraciones y bootstrap
#   runtime      solo lo necesario para servir la app, como usuario sin privilegios
#
# Todas parten de la misma base Debian para que el motor de Prisma compilado en
# `build` sea el mismo que se ejecuta en `runtime`.

FROM node:22-bookworm-slim AS base
# Prisma necesita OpenSSL en tiempo de ejecución. Con reintentos: la red del
# servidor de producción pierde conexiones con los espejos de Debian.
RUN for intento in 1 2 3 4 5; do \
      apt-get -o Acquire::Retries=5 update \
      && apt-get -o Acquire::Retries=5 install -y --no-install-recommends openssl ca-certificates \
      && break; \
      echo "apt falló (intento $intento), reintentando..."; sleep 15; \
    done \
 && command -v openssl >/dev/null \
 && rm -rf /var/lib/apt/lists/*
# pnpm fijo e instalado globalmente: con corepack, el usuario sin privilegios
# de las etapas finales no ve la versión preparada como root y descarga otra.
RUN npm install -g pnpm@9.15.9 && npm cache clean --force
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
# Reintentos de red para el registro de npm (misma razón que arriba).
RUN pnpm install --frozen-lockfile --network-concurrency 8 --fetch-retries 5 \
      --fetch-retry-mintimeout 20000 --fetch-retry-maxtimeout 120000

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` corre con NODE_ENV=production pero sin los secretos reales: la
# validación de src/lib/auth/config.ts lo reconoce por NEXT_PHASE.
RUN pnpm build

FROM build AS herramientas
RUN chown -R node:node /app
USER node
CMD ["pnpm", "db:deploy"]

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
