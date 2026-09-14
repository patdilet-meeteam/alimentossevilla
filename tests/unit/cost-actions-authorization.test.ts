import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  transaction: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  recordAuditEvent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({
  db: {
    costImport: { findUnique: mocks.findUnique },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/audit/audit-service", () => ({ recordAuditEvent: mocks.recordAuditEvent }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { applyCostImport, createCostImport } from "@/app/actions/cost-actions";

describe("Unit: autorización y aplicación de costos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({
      costImport: { updateMany: mocks.updateMany, update: mocks.update },
    }));
  });

  it.each(["QUALITY", "R_AND_D", "VIEWER"])("impide cargar costos al rol %s", async (role) => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "user@test.local", role });

    await expect(createCostImport(new FormData())).rejects.toThrow("Acceso denegado");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("impide aplicar costos a QUALITY", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "quality-1", email: "quality@test.local", role: "QUALITY" });

    await expect(applyCostImport("import-1")).rejects.toThrow("Acceso denegado");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("mantiene en borrador una importación con filas bloqueantes", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "admin-1", email: "admin@test.local", role: "ADMIN" });
    mocks.findUnique.mockResolvedValue({
      id: "import-1",
      status: "DRAFT",
      periodStart: new Date("2026-06-01T00:00:00.000Z"),
      _count: { items: 2 },
    });

    await expect(applyCostImport("import-1")).resolves.toMatchObject({ ok: false, importId: "import-1" });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.recordAuditEvent).not.toHaveBeenCalled();
  });

  it("permite a ADMIN aplicar, reemplaza el anterior y audita", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "admin-1", email: "admin@test.local", role: "ADMIN" });
    mocks.findUnique.mockResolvedValue({
      id: "import-1",
      status: "DRAFT",
      periodStart: new Date("2026-06-01T00:00:00.000Z"),
      _count: { items: 0 },
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.update.mockResolvedValue({ id: "import-1", status: "APPLIED" });
    mocks.recordAuditEvent.mockResolvedValue({ id: "audit-1" });

    await expect(applyCostImport("import-1")).resolves.toMatchObject({ ok: true, importId: "import-1" });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { status: "APPLIED", id: { not: "import-1" } },
      data: { status: "SUPERSEDED" },
    });
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      actorId: "admin-1",
      action: "cost_import.apply",
      entity: "CostImport",
      entityId: "import-1",
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/costos");
  });
});
