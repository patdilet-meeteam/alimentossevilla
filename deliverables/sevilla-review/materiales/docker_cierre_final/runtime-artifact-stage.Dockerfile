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


FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --chown=node:node app/.next/standalone ./
COPY --chown=node:node app/.next/static ./.next/static
COPY --chown=node:node app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
