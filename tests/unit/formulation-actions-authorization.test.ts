import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  aggregate: vi.fn(),
  recordAuditEvent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    formulationIngredient: { aggregate: mocks.aggregate },
    formulationVersion: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/audit/audit-service", () => ({
  recordAuditEvent: mocks.recordAuditEvent,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { approveVersion, rejectToDraft } from "@/app/actions/formulation-actions";

describe("Unit: SPEC-003 rejection authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies QUALITY while OQ-021 remains unresolved", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "quality-1",
      email: "quality@alimentossevilla.com",
      role: "QUALITY",
    });

    await expect(
      rejectToDraft({ formulationVersionId: "version-1", motivo: "Revisar" }),
    ).rejects.toThrow("Acceso denegado");

    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("denies QUALITY approval because only the Director Técnico may approve", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "quality-1",
      email: "quality@alimentossevilla.com",
      role: "QUALITY",
    });

    await expect(
      approveVersion({ formulationVersionId: "version-1", motivo: "Aprobar" }),
    ).rejects.toThrow("Acceso denegado");

    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("allows ADMIN to return an in-review version to draft and audits it", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin-1",
      email: "admin@alimentossevilla.com",
      role: "ADMIN",
    });
    mocks.findUnique.mockResolvedValue({
      id: "version-1",
      estado: "IN_REVIEW",
      formulation: { id: "formulation-1", productId: "product-1" },
    });
    mocks.update.mockResolvedValue({ id: "version-1", estado: "DRAFT" });
    mocks.recordAuditEvent.mockResolvedValue({ id: "audit-1" });

    await expect(
      rejectToDraft({ formulationVersionId: "version-1", motivo: "Ajustar receta" }),
    ).resolves.toMatchObject({ estado: "DRAFT" });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "version-1" },
      data: { estado: "DRAFT" },
    });
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "formulation_version.reject",
        entity: "FormulationVersion",
        entityId: "version-1",
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/productos/product-1");
  });
});


describe("approval rechecks existing validation rules", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getCurrentUser.mockResolvedValue({id:"admin-1",email:"admin@example.test",role:"ADMIN"}); });
  it("blocks unresolved source even when the version is already IN_REVIEW", async () => {
    mocks.findUnique.mockResolvedValue({id:"version-1",estado:"IN_REVIEW",sourceRecipeSnapshot:{source:"JUNE_RECIPE",sourceSheet:"x",issues:["CURRENT_VERSION_NOT_ESTABLISHED"]}});
    await expect(approveVersion({formulationVersionId:"version-1"})).rejects.toThrow("receta fuente requiere revisión");
    expect(mocks.update).not.toHaveBeenCalled();expect(mocks.recordAuditEvent).not.toHaveBeenCalled();
  });
  it("blocks a non100 sum before approval and audit", async () => {
    const {Prisma}=await import("@prisma/client");
    mocks.findUnique.mockResolvedValue({id:"version-1",estado:"IN_REVIEW",sourceRecipeSnapshot:null});
    mocks.aggregate.mockResolvedValue({_sum:{porcentajeParticipacion:new Prisma.Decimal("99.999999999999999999")}});
    await expect(approveVersion({formulationVersionId:"version-1"})).rejects.toThrow("exactamente 100");
    expect(mocks.update).not.toHaveBeenCalled();expect(mocks.recordAuditEvent).not.toHaveBeenCalled();
  });
  it("allows ADMIN through the existing workflow when source and exact sum are valid", async () => {
    const {Prisma}=await import("@prisma/client");
    mocks.findUnique.mockResolvedValue({id:"version-1",estado:"IN_REVIEW",sourceRecipeSnapshot:null,numeroSecuencial:1,formulation:{productId:"p"}});
    mocks.aggregate.mockResolvedValue({_sum:{porcentajeParticipacion:new Prisma.Decimal(100)}});
    mocks.recordAuditEvent.mockResolvedValue({id:"audit-1"});mocks.update.mockResolvedValue({id:"version-1",estado:"APPROVED"});
    expect((await approveVersion({formulationVersionId:"version-1"})).estado).toBe("APPROVED");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({aprobadaPorId:"admin-1",auditTrailId:"audit-1"})}));
  });
});
