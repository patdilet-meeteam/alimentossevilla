import { describe, it, expect } from "vitest";
import { sanitizeMetadata, isSensitiveKey } from "@/lib/audit/audit-service";

describe("Unit: Audit Sanitizer & Key Normalization (FIX-05)", () => {
  it("detecta como sensibles variantes de snake_case, camelCase y kebab-case", () => {
    const sensitiveKeys = [
      "password",
      "password_hash",
      "passwordHash",
      "token",
      "access_token",
      "refresh_token",
      "auth_token",
      "api_key",
      "apiKey",
      "api-key",
      "private_key",
      "privateKey",
      "private-key",
      "client_secret",
      "clientSecret",
      "credential",
      "credentials",
      "authorization",
      "auth_header",
      "authHeader",
      "auth-header",
      "bearer",
      "bearer_token",
      "cookie",
      "session",
      "sessionId",
      "secret",
      "signature",
      "passphrase",
    ];

    for (const key of sensitiveKeys) {
      expect(
        isSensitiveKey(key),
        `La clave "${key}" debería haber sido detectada como sensible`
      ).toBe(true);
    }
  });

  it("no marca como sensibles claves legítimas de negocio", () => {
    const legitimateKeys = [
      "productId",
      "ingredientName",
      "formulationVersion",
      "sodiumContent",
      "batchSizeKg",
      "targetUserEmail",
      "previousRole",
      "newRole",
    ];

    for (const key of legitimateKeys) {
      expect(
        isSensitiveKey(key),
        `La clave "${key}" NO debería marcarse como sensible`
      ).toBe(false);
    }
  });

  it("sanitiza un objeto plano reemplazando secretos por [REDACTED]", () => {
    const raw = {
      userEmail: "admin@alimentossevilla.com",
      password: "SuperSecretPassword123!",
      password_hash: "$2a$10$xyz...",
      api_key: "ak_live_12345",
      apiKey: "ak_test_67890",
      "api-key": "ak_header_111",
      private_key: "-----BEGIN RSA PRIVATE KEY-----",
      credentials: { user: "admin" },
      auth_header: "Bearer eyJhbGciOi...",
      bearer: "token_123",
      cookie: "session_cookie_val",
      role: "ADMIN",
      batchId: "batch_999",
    };

    const sanitized = sanitizeMetadata(raw) as Record<string, unknown>;

    expect(sanitized.userEmail).toBe("admin@alimentossevilla.com");
    expect(sanitized.role).toBe("ADMIN");
    expect(sanitized.batchId).toBe("batch_999");

    // Todos los campos sensibles deben estar ofuscados
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.password_hash).toBe("[REDACTED]");
    expect(sanitized.api_key).toBe("[REDACTED]");
    expect(sanitized.apiKey).toBe("[REDACTED]");
    expect(sanitized["api-key"]).toBe("[REDACTED]");
    expect(sanitized.private_key).toBe("[REDACTED]");
    expect(sanitized.credentials).toBe("[REDACTED]");
    expect(sanitized.auth_header).toBe("[REDACTED]");
    expect(sanitized.bearer).toBe("[REDACTED]");
    expect(sanitized.cookie).toBe("[REDACTED]");
  });

  it("sanitiza estructuras profundamente anidadas", () => {
    const nested = {
      action: "EXTERNAL_IMPORT",
      payload: {
        vendor: "Proveedor Carnes",
        config: {
          client_secret: "sec_9999",
          endpoint: "https://api.proveedor.com",
          auth: {
            token: "jwt_token_here",
            passphrase: "vault_passphrase",
          },
        },
      },
    };

    const sanitized = sanitizeMetadata(nested) as any;

    expect(sanitized.action).toBe("EXTERNAL_IMPORT");
    expect(sanitized.payload.vendor).toBe("Proveedor Carnes");
    expect(sanitized.payload.config.endpoint).toBe("https://api.proveedor.com");
    expect(sanitized.payload.config.client_secret).toBe("[REDACTED]");
    expect(sanitized.payload.config.auth).toBe("[REDACTED]");
  });

  it("sanitiza objetos dentro de arrays", () => {
    const listData = {
      items: [
        { name: "Harina de Trigo", code: "MAT-001" },
        { name: "API Config", api_key: "secret_api_key_val" },
      ],
      tokens: ["token1", "token2"],
    };

    const sanitized = sanitizeMetadata(listData) as any;

    expect(sanitized.items[0].name).toBe("Harina de Trigo");
    expect(sanitized.items[1].name).toBe("API Config");
    expect(sanitized.items[1].api_key).toBe("[REDACTED]");
    expect(sanitized.tokens).toBe("[REDACTED]");
  });
});
