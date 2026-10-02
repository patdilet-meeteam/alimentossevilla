/**
 * Se ejecuta una vez al iniciar el servidor, antes de atender peticiones.
 *
 * Valida la configuración de autenticación para que una instalación sin
 * secreto o sin URL pública no llegue a arrancar. Sin esta comprobación, el
 * módulo de Better Auth solo se carga con la primera petición que lo usa y el
 * error aparecería tarde, con la aplicación ya publicada.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { verificarConfiguracionDeAuth } = await import("./lib/auth/startup-check");
    verificarConfiguracionDeAuth();
  }
}
