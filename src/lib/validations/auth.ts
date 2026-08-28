import { z } from "zod";
import { Role } from "@prisma/client";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("El formato de correo electrónico no es válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .max(100, "La contraseña no debe superar los 100 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no debe superar los 120 caracteres"),
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("El formato de correo electrónico no es válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número"
    ),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "El rol seleccionado no es válido" }),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "El identificador de usuario es requerido"),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "El rol seleccionado no es válido" }),
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1, "El identificador de usuario es requerido"),
  isActive: z.boolean(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
