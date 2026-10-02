import { describe, it, expect } from "vitest";
import { generarContrasena } from "@/lib/auth/password-generator";
import { createUserSchema } from "@/lib/validations/auth";

describe("Unit: generador de contraseñas para cuentas creadas por CLI", () => {
  it("genera 20 caracteres por defecto", () => {
    expect(generarContrasena()).toHaveLength(20);
  });

  it("incluye siempre mayúscula, minúscula, número y símbolo", () => {
    for (let i = 0; i < 200; i++) {
      const c = generarContrasena();
      expect(c).toMatch(/[A-Z]/);
      expect(c).toMatch(/[a-z]/);
      expect(c).toMatch(/\d/);
      expect(c).toMatch(/[!#%+\-=?@_]/);
    }
  });

  it("cumple la política de contraseñas de la plataforma", () => {
    const r = createUserSchema.safeParse({
      name: "Prueba",
      email: "prueba@example.com",
      role: "VIEWER",
      password: generarContrasena(),
    });
    expect(r.success).toBe(true);
  });

  it("no repite contraseñas", () => {
    const vistas = new Set(Array.from({ length: 500 }, () => generarContrasena()));
    expect(vistas.size).toBe(500);
  });

  it("evita caracteres ambiguos al leerse en voz alta", () => {
    for (let i = 0; i < 200; i++) expect(generarContrasena()).not.toMatch(/[0O1lI]/);
  });
});
