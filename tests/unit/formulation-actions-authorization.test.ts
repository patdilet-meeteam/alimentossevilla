import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  recordAuditEvent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
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

import { rejectToDraft } from "@/app/actions/formulation-actions";

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
