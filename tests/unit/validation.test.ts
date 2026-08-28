import { describe, it, expect } from "vitest";
import {
  loginSchema,
  createUserSchema,
  updateUserRoleSchema,
} from "@/lib/validations/auth";
import { Role } from "@prisma/client";

describe("Boundary Validations (Zod Schemas)", () => {
  describe("loginSchema", () => {
    it("acepta credenciales con formato correcto", () => {
      const result = loginSchema.safeParse({
        email: "admin@alimentossevilla.com",
        password: "AdminSevilla2026!#",
      });

      expect(result.success).toBe(true);
    });

    it("rechaza emails malformados o vacíos", () => {
      const invalidEmail = loginSchema.safeParse({
        email: "no-es-un-correo",
        password: "Password123!",
      });
      expect(invalidEmail.success).toBe(false);

      const emptyEmail = loginSchema.safeParse({
        email: "",
        password: "Password123!",
      });
      expect(emptyEmail.success).toBe(false);
    });

    it("rechaza contraseñas vacías", () => {
      const emptyPass = loginSchema.safeParse({
        email: "usuario@alimentossevilla.com",
        password: "",
      });
      expect(emptyPass.success).toBe(false);
    });
  });

  describe("createUserSchema", () => {
    it("valida un usuario completo con rol válido y contraseña fuerte", () => {
      const valid = createUserSchema.safeParse({
        name: "Carlos Pérez",
        email: "carlos@alimentossevilla.com",
        password: "PasswordSeguro2026!",
        role: Role.R_AND_D,
      });
      expect(valid.success).toBe(true);
    });

    it("rechaza contraseñas débiles menores a 8 caracteres", () => {
      const weak = createUserSchema.safeParse({
        name: "Carlos Pérez",
        email: "carlos@alimentossevilla.com",
        password: "Pass1",
        role: Role.R_AND_D,
      });
      expect(weak.success).toBe(false);
    });

    it("rechaza roles inexistentes", () => {
      const invalidRole = createUserSchema.safeParse({
        name: "Carlos Pérez",
        email: "carlos@alimentossevilla.com",
        password: "PasswordSeguro2026!",
        role: "SUPERADMIN_INVENTADO",
      });
      expect(invalidRole.success).toBe(false);
    });
  });

  describe("updateUserRoleSchema", () => {
    it("acepta cambio a rol existente", () => {
      const valid = updateUserRoleSchema.safeParse({
        userId: "user_123",
        role: Role.QUALITY,
      });
      expect(valid.success).toBe(true);
    });
  });
});
