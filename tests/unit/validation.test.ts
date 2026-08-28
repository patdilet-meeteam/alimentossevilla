import { describe, it, expect } from "vitest";
import {
  loginSchema,
  createUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "@/lib/validations/auth";
import { Role } from "@prisma/client";

describe("Unit: Boundary Validations (Zod Schemas)", () => {
  describe("loginSchema", () => {
    it("acepta credenciales con formato válido", () => {
      const result = loginSchema.safeParse({
        email: "admin@alimentossevilla.com",
        password: "AdminSevilla2026!#",
      });

      expect(result.success).toBe(true);
    });

    it("rechaza correos electrónicos malformados o vacíos", () => {
      const invalidEmail = loginSchema.safeParse({
        email: "correo_invalido_sin_arroba",
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
    it("valida usuario completo con contraseña fuerte y rol válido", () => {
      const valid = createUserSchema.safeParse({
        name: "Carlos Gómez",
        email: "carlos@alimentossevilla.com",
        password: "PasswordSeguro2026!",
        role: Role.R_AND_D,
      });
      expect(valid.success).toBe(true);
    });

    it("rechaza contraseñas menores a 8 caracteres", () => {
      const weak = createUserSchema.safeParse({
        name: "Carlos Gómez",
        email: "carlos@alimentossevilla.com",
        password: "Short1",
        role: Role.R_AND_D,
      });
      expect(weak.success).toBe(false);
    });

    it("rechaza roles no enumerados", () => {
      const invalidRole = createUserSchema.safeParse({
        name: "Carlos Gómez",
        email: "carlos@alimentossevilla.com",
        password: "PasswordSeguro2026!",
        role: "ROL_NO_EXISTENTE",
      });
      expect(invalidRole.success).toBe(false);
    });
  });

  describe("updateUserRoleSchema", () => {
    it("acepta asignación de rol válido", () => {
      const valid = updateUserRoleSchema.safeParse({
        userId: "user_test_123",
        role: Role.QUALITY,
      });
      expect(valid.success).toBe(true);
    });

    it("rechaza identificador de usuario vacío", () => {
      const invalid = updateUserRoleSchema.safeParse({
        userId: "",
        role: Role.ADMIN,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("updateUserStatusSchema", () => {
    it("acepta cambio de estado booleano", () => {
      const valid = updateUserStatusSchema.safeParse({
        userId: "user_test_123",
        isActive: false,
      });
      expect(valid.success).toBe(true);
    });
  });
});
