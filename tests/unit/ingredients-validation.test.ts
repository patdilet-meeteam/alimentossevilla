import { describe, it, expect } from "vitest";
import {
  ingredientSchema,
  ingredientFilterSchema,
  nutritionalProfileSchema,
  normalizeSiesaCode,
  getSiesaPrefix,
  categorizeBySiesaCode,
} from "@/lib/validations/ingredients";
// zod for type inference

describe("Validaciones de Ingredientes", () => {
  describe("ingredientSchema", () => {
    it("debe validar un ingrediente válido con código SIESA 11", () => {
      const valid = {
        name: "Carne de res molida",
        siesaCode: "1100001",
        category: "CARNE" as const,
        isAllergen: false,
        allergenTags: [],
      };
      expect(() => ingredientSchema.parse(valid)).not.toThrow();
    });

    it("debe validar un ingrediente válido con código SIESA 12", () => {
      const valid = {
        name: "Harina de trigo",
        siesaCode: "1200001",
        category: "MATERIA_SECA" as const,
        isAllergen: true,
        allergenTags: ["Gluten"],
      };
      expect(() => ingredientSchema.parse(valid)).not.toThrow();
    });

    it("debe rechazar código SIESA inválido (longitud o caracteres no permitidos)", () => {
      // Tras la relajación de SPEC-003, "999999" pasa (6 chars alnum). Usamos un caso realmente inválido.
      const invalid = {
        name: "Test",
        siesaCode: "ABC!@", // contiene caracteres no permitidos y longitud incorrecta
        category: "OTRO" as const,
      };
      expect(() => ingredientSchema.parse(invalid)).toThrow();
    });

    it("debe rechazar nombre vacío", () => {
      const invalid = {
        name: "",
        siesaCode: "1100001",
        category: "CARNE" as const,
      };
      expect(() => ingredientSchema.parse(invalid)).toThrow();
    });

    it("debe rechazar nombre muy largo", () => {
      const invalid = {
        name: "a".repeat(256),
        siesaCode: "1100001",
        category: "CARNE" as const,
      };
      expect(() => ingredientSchema.parse(invalid)).toThrow();
    });
  });

  describe("ingredientFilterSchema", () => {
    it("debe validar filtros vacíos", () => {
      expect(() => ingredientFilterSchema.parse({})).not.toThrow();
    });

    it("debe validar filtro por prefijo SIESA válido", () => {
      expect(() => ingredientFilterSchema.parse({ siesaPrefix: "11" })).not.toThrow();
      expect(() => ingredientFilterSchema.parse({ siesaPrefix: "12" })).not.toThrow();
      expect(() => ingredientFilterSchema.parse({ siesaPrefix: "13" })).not.toThrow();
    });

    it("debe rechazar filtro por prefijo SIESA inválido", () => {
      expect(() => ingredientFilterSchema.parse({ siesaPrefix: "99" })).toThrow();
    });
  });

  describe("nutritionalProfileSchema", () => {
    it("debe validar un perfil nutricional válido", () => {
      const valid = {
        ingredientId: "test-id",
        source: "BANCO_ALIMENTOS" as const,
        validFrom: new Date(),
        referenceBase: "100g",
      };
      expect(() => nutritionalProfileSchema.parse(valid)).not.toThrow();
    });

    it("debe usar valores por defecto", () => {
      const valid = {
        ingredientId: "test-id",
        source: "LAB_PROVEEDOR" as const,
      };
      const parsed = nutritionalProfileSchema.parse(valid);
      expect(parsed.referenceBase).toBe("100g");
      expect(parsed.isActive).toBe(true);
    });
  });

  describe("normalizeSiesaCode", () => {
    it("debe normalizar código SIESA a mayúsculas", () => {
      expect(normalizeSiesaCode("110001")).toBe("110001");
      expect(normalizeSiesaCode("11 00 01")).toBe("110001");
      expect(normalizeSiesaCode("  110001  ")).toBe("110001");
    });
  });

  describe("getSiesaPrefix", () => {
    it("debe extraer prefijo SIESA válido", () => {
      expect(getSiesaPrefix("110001")).toBe("11");
      expect(getSiesaPrefix("120001")).toBe("12");
      expect(getSiesaPrefix("130001")).toBe("13");
      // SPEC-003: prefijo MP para códigos reales del cliente
      expect(getSiesaPrefix("MPCC010")).toBe("MP");
    });

    it("debe devolver null para código inválido (vacío o muy corto)", () => {
      expect(getSiesaPrefix("")).toBeNull();
      expect(getSiesaPrefix("9")).toBeNull(); // <2 chars
    });
  });

  describe("categorizeBySiesaCode", () => {
    it("debe categorizar correctamente por prefijo", () => {
      expect(categorizeBySiesaCode("110001")).toBe("CARNE");
      expect(categorizeBySiesaCode("120001")).toBe("MATERIA_SECA");
      expect(categorizeBySiesaCode("130001")).toBe("EMPAQUE");
    });

    it("debe devolver OTRO para prefijo desconocido", () => {
      expect(categorizeBySiesaCode("990001")).toBe("OTRO");
    });
  });
});
