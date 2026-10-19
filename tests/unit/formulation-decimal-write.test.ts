import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ upsert: vi.fn(), update: vi.fn(), version: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => ({id: "a", email: "fixture@example.test", role: "ADMIN"}) }));
vi.mock("@/lib/db", () => ({ db: { formulationVersion: {findUnique: mocks.version}, formulationIngredient: {upsert: mocks.upsert, update: mocks.update} } }));
vi.mock("@/lib/audit/audit-service", () => ({ recordAuditEvent: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { addIngredientToVersion, updateIngredientPercentage } from "@/app/actions/formulation-actions";
const input = { formulationVersionId: "v", ingredientId: "i", porcentajeParticipacion: 9.4272, cantidadCanonica: 0.9884 };
describe("formulation writes preserve submitted decimals", () => {
  beforeEach(() => {vi.clearAllMocks(); mocks.version.mockResolvedValue({id: "v", estado: "DRAFT", formulation: {productId: "p"}}); mocks.upsert.mockResolvedValue({id: "row"}); mocks.update.mockResolvedValue({id: "row"});});
  it("passes decimal strings to Prisma in both upsert paths", async () => {
    await addIngredientToVersion(input);
    const write = mocks.upsert.mock.calls[0][0];
    expect(write.create.porcentajeParticipacion).toBe("9.4272"); expect(write.update.porcentajeParticipacion).toBe("9.4272");
    expect(write.create.cantidadCanonica).toBe("0.9884"); expect(write.update.cantidadCanonica).toBe("0.9884");
  });
  it("preserves decimal text on edits and keeps an absent quantity null", async () => {
    await updateIngredientPercentage(input);
    expect(mocks.update.mock.calls[0][0].data).toEqual({porcentajeParticipacion: "9.4272", cantidadCanonica: "0.9884"});
    await updateIngredientPercentage({...input, cantidadCanonica: null});
    expect(mocks.update.mock.calls[1][0].data).toEqual({porcentajeParticipacion: "9.4272", cantidadCanonica: null});
  });
  it("preserves a 24-digit string and does not erase an omitted canonical quantity", async () => {
    const exact = "9.427200000000000000000001";
    await updateIngredientPercentage({formulationVersionId: "v", ingredientId: "i", porcentajeParticipacion: exact});
    expect(mocks.update.mock.calls[0][0].data).toEqual({porcentajeParticipacion: exact});
    await addIngredientToVersion({formulationVersionId: "v", ingredientId: "i", porcentajeParticipacion: exact});
    expect(mocks.upsert.mock.calls[0][0].update).toEqual({porcentajeParticipacion: exact});
    expect(mocks.upsert.mock.calls[0][0].create.cantidadCanonica).toBeNull();
  });

});
