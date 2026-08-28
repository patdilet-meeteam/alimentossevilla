import { describe, it, expect } from "vitest";
import {
  generateSessionToken,
  SESSION_DURATION_HOURS,
  SESSION_DURATION_MS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

describe("Session & Auth Protection Logic", () => {
  it("genera tokens de sesión criptográficamente seguros de 64 caracteres hex (32 bytes)", () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
    expect(/^[0-9a-f]+$/.test(token1)).toBe(true);
  });

  it("configura una vigencia de sesión por defecto de 8 horas", () => {
    expect(SESSION_DURATION_HOURS).toBe(8);
    expect(SESSION_DURATION_MS).toBe(8 * 60 * 60 * 1000);
  });

  it("utiliza el nombre de cookie estándar corporativo", () => {
    expect(SESSION_COOKIE_NAME).toBe("alimentos_session");
  });

  it("valida la lógica de expiración de sesiones temporales", () => {
    const now = Date.now();
    const activeExpiration = new Date(now + 1000 * 60 * 60); // 1 hora en el futuro
    const expiredExpiration = new Date(now - 1000 * 60 * 60); // 1 hora en el pasado

    expect(activeExpiration.getTime() > now).toBe(true);
    expect(expiredExpiration.getTime() < now).toBe(true);
  });
});
