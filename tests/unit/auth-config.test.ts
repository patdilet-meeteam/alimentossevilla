import { describe, it, expect } from "vitest";
import {
  DEV_AUTH_SECRET,
  resolveAuthSecret,
  resolveTrustedOrigins,
} from "@/lib/auth/config";

const SECRETO_FUERTE = "x".repeat(48);

describe("Unit: configuración sensible de Better Auth", () => {
  describe("resolveAuthSecret", () => {
    it("en desarrollo usa el secreto de ejemplo si no hay uno configurado", () => {
      expect(resolveAuthSecret({ NODE_ENV: "development" })).toBe(DEV_AUTH_SECRET);
    });

    it("en producción exige el secreto", () => {
      expect(() => resolveAuthSecret({ NODE_ENV: "production" })).toThrow(/BETTER_AUTH_SECRET/);
    });

    it("en producción rechaza el secreto de ejemplo del repositorio", () => {
      expect(() =>
        resolveAuthSecret({ NODE_ENV: "production", BETTER_AUTH_SECRET: DEV_AUTH_SECRET })
      ).toThrow();
    });

    it("en producción rechaza secretos de menos de 32 caracteres", () => {
      expect(() =>
        resolveAuthSecret({ NODE_ENV: "production", BETTER_AUTH_SECRET: "corto" })
      ).toThrow();
    });

    it("en producción acepta un secreto fuerte", () => {
      expect(
        resolveAuthSecret({ NODE_ENV: "production", BETTER_AUTH_SECRET: SECRETO_FUERTE })
      ).toBe(SECRETO_FUERTE);
    });

    it("no falla durante `next build`, que no tiene las variables de producción", () => {
      expect(
        resolveAuthSecret({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" })
      ).toBe(DEV_AUTH_SECRET);
    });
  });

  describe("resolveTrustedOrigins", () => {
    it("en producción solo confía en la URL pública", () => {
      const origenes = resolveTrustedOrigins({
        NODE_ENV: "production",
        BETTER_AUTH_URL: "https://nutricional.alimentossevilla.digital/",
        NEXT_PUBLIC_APP_URL: "https://nutricional.alimentossevilla.digital",
      });
      expect(origenes).toEqual(["https://nutricional.alimentossevilla.digital"]);
    });

    it("en producción falla si no hay URL pública configurada", () => {
      expect(() => resolveTrustedOrigins({ NODE_ENV: "production" })).toThrow(/BETTER_AUTH_URL/);
    });

    it("en desarrollo incluye las direcciones locales", () => {
      const origenes = resolveTrustedOrigins({ NODE_ENV: "development" });
      expect(origenes).toContain("http://localhost:3000");
      expect(origenes).toContain("http://127.0.0.1:3000");
    });

    it("ignora URLs mal formadas", () => {
      const origenes = resolveTrustedOrigins({
        NODE_ENV: "production",
        BETTER_AUTH_URL: "no-es-una-url",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
      });
      expect(origenes).toEqual(["https://app.example.com"]);
    });
  });
});
