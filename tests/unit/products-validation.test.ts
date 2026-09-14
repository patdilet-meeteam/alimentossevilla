import { describe, it, expect } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  createPresentationSchema,
  createDraftVersionSchema,
  addIngredientToVersionSchema,
  getOrCreateFormulationSchema,
  transitionVersionSchema,
  normalizeCodigoInterno,
} from "@/lib/validations/products";

describe("products: validación Zod", () => {
  describe("createProductSchema", () => {
    it("acepta un producto válido", () => {
      const valid = {
        codigoInterno: "salchicha-desayuno",
        nombreComercial: "Salchicha Desayuno",
        categoriaProducto: "SALCHICHA" as const,
        descripcion: null,
      };
      expect(() => createProductSchema.parse(valid)).not.toThrow();
    });

    it("rechaza codigoInterno con mayúsculas o acentos", () => {
      const invalid = {
        codigoInterno: "Salchicha Desayuno",
        nombreComercial: "x",
        categoriaProducto: "SALCHICHA" as const,
      };
      expect(() => createProductSchema.parse(invalid)).toThrow();
    });

    it("rechaza nombreComercial vacío", () => {
      expect(() =>
        createProductSchema.parse({
          codigoInterno: "salchicha",
          nombreComercial: "",
          categoriaProducto: "OTRO" as const,
        }),
      ).toThrow();
    });

    it("rechaza categoría fuera del enum", () => {
      expect(() =>
        createProductSchema.parse({
          codigoInterno: "salchicha",
          nombreComercial: "Salchicha",
          categoriaProducto: "QUESO" as unknown as "OTRO",
        }),
      ).toThrow();
    });
  });

  describe("updateProductSchema", () => {
    it("requiere id", () => {
      expect(() => updateProductSchema.parse({ nombreComercial: "x" })).toThrow();
    });
    it("permite solo isActive", () => {
      expect(() => updateProductSchema.parse({ id: "abc", isActive: false })).not.toThrow();
    });
  });

  describe("createPresentationSchema", () => {
    it("acepta presentación válida", () => {
      expect(() =>
        createPresentationSchema.parse({
          productId: "p1",
          gramajeNeto: 480,
          unidadesPorEmpaque: 14,
          porcionDeclarada: 34,
          porcionPorEnvase: 14,
        }),
      ).not.toThrow();
    });

    it("rechaza gramajeNeto negativo", () => {
      expect(() =>
        createPresentationSchema.parse({ productId: "p1", gramajeNeto: -10 }),
      ).toThrow();
    });

    it("acepta campos opcionales nulos", () => {
      expect(() =>
        createPresentationSchema.parse({
          productId: "p1",
          gramajeNeto: 115,
          unidadesPorEmpaque: null,
          porcionDeclarada: null,
          porcionPorEnvase: null,
        }),
      ).not.toThrow();
    });
  });

  describe("FormulationVersion", () => {
    it("createDraftVersion requiere formulationId", () => {
      expect(() => createDraftVersionSchema.parse({ formulationId: "" })).toThrow();
    });
    it("addIngredientToVersion valida rango de porcentaje", () => {
      expect(() =>
        addIngredientToVersionSchema.parse({
          formulationVersionId: "v1",
          ingredientId: "i1",
          porcentajeParticipacion: 150,
        }),
      ).toThrow();
    });
    it("getOrCreateFormulation acepta producto con baseCalculo opcional", () => {
      expect(() =>
        getOrCreateFormulationSchema.parse({ productId: "p1" }),
      ).not.toThrow();
    });
    it("transitionVersion acepta motivo opcional", () => {
      expect(() =>
        transitionVersionSchema.parse({ formulationVersionId: "v1", motivo: "necesita más revisión" }),
      ).not.toThrow();
    });
  });

  describe("normalizeCodigoInterno", () => {
    it("lowercase, sin acentos, espacios -> guiones", () => {
      expect(normalizeCodigoInterno("Salchicha Desayuno Premium")).toBe("salchicha-desayuno-premium");
    });
    it("recorta caracteres no permitidos", () => {
      expect(normalizeCodigoInterno("Chorizo_Ternera!!! 480g")).toBe("chorizo-ternera-480g");
    });
    it("trunca a 60 chars", () => {
      const long = "a".repeat(80);
      expect(normalizeCodigoInterno(long).length).toBeLessThanOrEqual(60);
    });
  });
});
