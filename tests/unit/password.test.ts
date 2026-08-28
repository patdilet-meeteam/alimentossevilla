import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password Hashing & Verification (bcrypt)", () => {
  it("genera un hash seguro no idéntico a la contraseña en texto plano", async () => {
    const rawPassword = "SecurePassword2026!";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true); // Estándar bcrypt
  });

  it("verifica satisfactoriamente una contraseña correcta contra su hash", async () => {
    const rawPassword = "AdminSevilla2026!#";
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const rawPassword = "CorrectPassword123!";
    const wrongPassword = "WrongPassword999!";
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it("retorna false ante entradas vacías o indefinidas", async () => {
    expect(await verifyPassword("", "$2a$10$samplehash")).toBe(false);
    expect(await verifyPassword("password", "")).toBe(false);
  });
});
