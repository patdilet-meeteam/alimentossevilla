import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(), transaction: vi.fn(), createProfile: vi.fn(), updateProfiles: vi.fn(),
  upsertNutrient: vi.fn(), audit: vi.fn(), parse: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => ({ id: "reviewer", email: "test@example.test", role: "ADMIN" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  ingredient: { findMany: mocks.findMany }, $transaction: mocks.transaction,
  auditEvent: { create: mocks.audit },
} }));
vi.mock("@/lib/nutrition/nutritional-bank-import", () => ({ parseNutritionalBankWorkbook: mocks.parse }));
import { importNutritionalBankProfiles } from "@/app/actions/nutrition-actions";

describe("bank import preserves source values and absence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([
      { id: "orange", name: "Naranja", genericName: null, profiles: [] },
      { id: "paprika", name: "Paprika", genericName: null, profiles: [] },
    ]);
    mocks.parse.mockResolvedValue([
      { sourceRow: 130, ingredientName: "Naranja", sourceDetail: null, valuesPer100g: { FAT_TRANS: new Prisma.Decimal("0.15"), SODIUM: new Prisma.Decimal(1) } },
      { sourceRow: 65, ingredientName: "Paprika", sourceDetail: null, valuesPer100g: { SODIUM: new Prisma.Decimal(0) } },
    ]);
    mocks.upsertNutrient.mockImplementation(async ({ where }) => ({ id: where.key }));
    mocks.transaction.mockImplementation(async (callback) => callback({ nutrient: { upsert: mocks.upsertNutrient }, nutritionalProfile: { updateMany: mocks.updateProfiles, create: mocks.createProfile } }));
  });
  it("persists explicit trans fat, keeps explicit zero, and never fills an absent nutrient", async () => {
    const form = new FormData();
    form.set("file", new File(["fixture"], "Banco.xlsx"));
    const result = await importNutritionalBankProfiles(form);
    expect(result.ok).toBe(true);
    const first = mocks.createProfile.mock.calls[0][0].data.values.create;
    const second = mocks.createProfile.mock.calls[1][0].data.values.create;
    expect(first.find((value: { nutrientId: string }) => value.nutrientId === "FAT_TRANS").value.toString()).toBe("0.15");
    expect(second).toHaveLength(1);
    expect(second[0].nutrientId).toBe("SODIUM");
    expect(second[0].value.toString()).toBe("0");
  });
  it("refuses excess source precision before creating or deactivating profiles", async () => {
    mocks.parse.mockResolvedValue([{sourceRow: 65, ingredientName: "Paprika", sourceDetail: null, valuesPer100g: {FIBER: new Prisma.Decimal("0.1234567890123456789012345")}}]);
    const form = new FormData(); form.set("file", new File(["fixture"], "Banco.xlsx"));
    expect((await importNutritionalBankProfiles(form)).ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.updateProfiles).not.toHaveBeenCalled();
  });

  it("does not activate a global profile for a code with row-specific identities", async () => {
    mocks.findMany.mockResolvedValue([{id:"ambiguous",siesaCode:"MPPA144",name:"Almidón de Papa",genericName:null,profiles:[]}]);
    mocks.parse.mockResolvedValue([{sourceRow:46,ingredientName:"Almidón de Papa",sourceDetail:null,valuesPer100g:{SODIUM:new Prisma.Decimal(0)}}]);
    const form=new FormData();form.set("file",new File(["fixture"],"Banco.xlsx"));
    expect((await importNutritionalBankProfiles(form)).ok).toBe(false);expect(mocks.transaction).not.toHaveBeenCalled();expect(mocks.updateProfiles).not.toHaveBeenCalled();
  });

});
