import { resolveAuthSecret, resolveTrustedOrigins } from "./config";

/**
 * Comprobación de arranque (solo runtime Node). Next registra los errores de
 * `register()` pero sigue sirviendo, así que se termina el proceso a mano:
 * una instalación sin secreto o sin URL pública no debe quedar publicada.
 */
export function verificarConfiguracionDeAuth(): void {
  try {
    resolveAuthSecret();
    resolveTrustedOrigins();
  } catch (error) {
    console.error(
      "❌ Configuración de autenticación inválida:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}
