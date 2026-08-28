import { describe, it, expect } from "vitest";
import { sanitizeMetadata } from "@/lib/audit/audit-service";

describe("Audit Subsystem - Metadata Sanitization", () => {
  it("retorna undefined si metadata es nulo o indefinido", () => {
    expect(sanitizeMetadata(null)).toBeUndefined();
    expect(sanitizeMetadata(undefined)).toBeUndefined();
  });

  it("ofusca claves sensibles como password, token, secret, cookie", () => {
    const raw = {
      userEmail: "admin@alimentossevilla.com",
      password: "SuperSecretPassword123!",
      sessionToken: "abc123token456",
      apiSecret: "secret_value_xyz",
      normalField: "valor_legitimo",
      role: "ADMIN",
    };

    const sanitized = sanitizeMetadata(raw) as Record<string, unknown>;

    expect(sanitized.userEmail).toBe("admin@alimentossevilla.com");
    expect(sanitized.role).toBe("ADMIN");
    expect(sanitized.normalField).toBe("valor_legitimo");

    // Claves sensibles deben haber sido reemplazadas
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.sessionToken).toBe("[REDACTED]");
    expect(sanitized.apiSecret).toBe("[REDACTED]");
  });

  it("ofusca claves sensibles en estructuras anidadas", () => {
    const nestedRaw = {
      action: "UPDATE_USER",
      authPayload: {
        newPasswordHash: "$2a$10$xyz...",
        clientCookie: "cookie_val",
      },
      auditInfo: {
        browser: "Chrome",
      },
    };

    const sanitized = sanitizeMetadata(nestedRaw) as Record<string, unknown>;
    const nestedAuth = sanitized.authPayload as Record<string, unknown>;

    expect(nestedAuth.newPasswordHash).toBe("[REDACTED]");
    expect(nestedAuth.clientCookie).toBe("[REDACTED]");
    expect((sanitized.auditInfo as Record<string, unknown>).browser).toBe(
      "Chrome"
    );
  });
});
