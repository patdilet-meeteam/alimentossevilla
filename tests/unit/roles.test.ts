import { describe, it, expect } from "vitest";
import {
  Role,
  RoleLabels,
  RoleDescriptions,
  hasRole,
  requireRole,
} from "@/lib/auth/roles";

describe("Unit: Roles & Authorization Guards", () => {
  it("contiene exactamente los 4 roles base de la fundación", () => {
    expect(Role.ADMIN).toBe("ADMIN");
    expect(Role.R_AND_D).toBe("R_AND_D");
    expect(Role.QUALITY).toBe("QUALITY");
    expect(Role.VIEWER).toBe("VIEWER");
    expect(Object.keys(Role)).toHaveLength(4);
  });

  it("proporciona etiquetas legibles en español para todos los roles", () => {
    expect(RoleLabels[Role.ADMIN]).toBe("Administrador");
    expect(RoleLabels[Role.R_AND_D]).toBe("Investigación y Desarrollo");
    expect(RoleLabels[Role.QUALITY]).toBe("Calidad");
    expect(RoleLabels[Role.VIEWER]).toBe("Consulta");
  });

  it("proporciona descripciones para todos los roles", () => {
    expect(RoleDescriptions[Role.ADMIN]).toContain("Administración");
    expect(RoleDescriptions[Role.R_AND_D]).toContain("Investigación");
    expect(RoleDescriptions[Role.QUALITY]).toContain("Calidad");
    expect(RoleDescriptions[Role.VIEWER]).toContain("Consulta");
  });

  it("hasRole valida correctamente si un usuario tiene rol permitido", () => {
    expect(hasRole(Role.ADMIN, [Role.ADMIN])).toBe(true);
    expect(hasRole(Role.ADMIN, [Role.R_AND_D, Role.QUALITY])).toBe(false);
    expect(hasRole(Role.R_AND_D, [Role.ADMIN, Role.R_AND_D])).toBe(true);
    expect(hasRole(null, [Role.ADMIN])).toBe(false);
    expect(hasRole(undefined, [Role.ADMIN])).toBe(false);
  });

  it("requireRole arroja excepción ante falta de permisos", () => {
    expect(() => requireRole(Role.VIEWER, [Role.ADMIN])).toThrow(
      "Acceso denegado"
    );
    expect(() => requireRole(null, [Role.ADMIN])).toThrow("Acceso denegado");
    expect(() =>
      requireRole(Role.ADMIN, [Role.ADMIN, Role.QUALITY])
    ).not.toThrow();
  });
});
