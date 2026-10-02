/**
 * Configuración sensible de Better Auth, aislada para poder probarla sin
 * levantar la base de datos.
 *
 * Reglas (ver docs/SECURITY.md §6 y §8):
 * - En producción el secreto es obligatorio y no puede ser el valor de
 *   ejemplo del repositorio: con ese valor cualquiera podría firmar sesiones.
 * - Los orígenes de confianza salen de la URL pública configurada; las
 *   direcciones locales solo se admiten fuera de producción.
 */

/** Secreto de ejemplo publicado en `.env.example`. Nunca válido en producción. */
export const DEV_AUTH_SECRET = "dev_secret_key_alimentos_sevilla_super_secure_32_chars_min";

const MIN_SECRET_LENGTH = 32;

const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
];

type Env = Record<string, string | undefined>;

/** `next build` importa los módulos del servidor sin las variables de producción. */
function isBuildPhase(env: Env): boolean {
  return env.NEXT_PHASE === "phase-production-build";
}

/**
 * Devuelve el secreto de Better Auth. En producción falla de inmediato si
 * falta, si es corto o si es el de ejemplo: es preferible que la aplicación
 * no arranque a que arranque con sesiones falsificables.
 */
export function resolveAuthSecret(env: Env = process.env): string {
  const secret = env.BETTER_AUTH_SECRET || env.AUTH_SECRET;

  if (env.NODE_ENV !== "production" || isBuildPhase(env)) {
    return secret || DEV_AUTH_SECRET;
  }

  if (!secret || secret.length < MIN_SECRET_LENGTH || secret === DEV_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET debe estar definido en producción, tener al menos 32 caracteres " +
        "y no ser el valor de ejemplo (genere uno con: openssl rand -base64 48)",
    );
  }
  return secret;
}

/** Origen (`https://dominio`) de una URL, o null si no es válida. */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Orígenes desde los que Better Auth acepta peticiones con cookies. En
 * producción solo la URL pública; en desarrollo, además, las locales.
 */
export function resolveTrustedOrigins(env: Env = process.env): string[] {
  const publicOrigins = [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL]
    .map(originOf)
    .filter((origin): origin is string => origin !== null);

  const origins =
    env.NODE_ENV === "production" ? publicOrigins : [...publicOrigins, ...LOCAL_ORIGINS];

  if (env.NODE_ENV === "production" && !isBuildPhase(env) && origins.length === 0) {
    throw new Error(
      "BETTER_AUTH_URL debe estar definido en producción con la URL pública (https://...)",
    );
  }

  return [...new Set(origins)];
}
