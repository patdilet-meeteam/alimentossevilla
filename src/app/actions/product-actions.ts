"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  createPresentationSchema,
  updatePresentationSchema,
  normalizeCodigoInterno,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilter,
  type CreatePresentationInput,
  type UpdatePresentationInput,
} from "@/lib/validations/products";
import { Role, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const WRITE_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D];
const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];

function buildProductWhere(filter?: ProductFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (filter?.search) {
    where.OR = [
      { nombreComercial: { contains: filter.search, mode: "insensitive" } },
      { codigoInterno: { contains: filter.search, mode: "insensitive" } },
      { descripcion: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter?.categoriaProducto) {
    where.categoriaProducto = filter.categoriaProducto;
  }
  if (filter?.isActive !== undefined) {
    where.isActive = filter.isActive;
  }
  return where;
}

export async function listProducts(filter?: ProductFilter) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

  // Validate optional filter (drops invalid inputs early).
  const parsedFilter = filter ? productFilterSchema.parse(filter) : undefined;

  return db.product.findMany({
    where: buildProductWhere(parsedFilter),
    include: {
      presentations: { where: { isActive: true } },
      formulations: {
        include: {
          versions: { orderBy: { numeroSecuencial: "desc" } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { nombreComercial: "asc" },
  });
}

export async function getProductById(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

  return db.product.findUnique({
    where: { id },
    include: {
      presentations: { orderBy: { gramajeNeto: "asc" } },
      formulations: {
        include: {
          versions: {
            orderBy: { numeroSecuencial: "desc" },
            include: {
              ingredients: {
                include: { ingredient: true },
              },
              aprobadaPor: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createProduct(rawInput: CreateProductInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = createProductSchema.parse(rawInput);
  const codigoInterno = normalizeCodigoInterno(input.codigoInterno);

  const existing = await db.product.findUnique({ where: { codigoInterno } });
  if (existing) {
    throw new Error(`Ya existe un producto con el código interno "${codigoInterno}".`);
  }

  const created = await db.product.create({
    data: {
      codigoInterno,
      nombreComercial: input.nombreComercial,
      categoriaProducto: input.categoriaProducto,
      descripcion: input.descripcion ?? null,
      createdById: user.id,
    },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "product.create",
    entity: "Product",
    entityId: created.id,
    metadata: {
      codigoInterno: created.codigoInterno,
      nombreComercial: created.nombreComercial,
      categoriaProducto: created.categoriaProducto,
    },
  });

  revalidatePath("/productos");
  return created;
}

export async function updateProduct(rawInput: UpdateProductInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = updateProductSchema.parse(rawInput);
  const { id, ...rest } = input;
  const data: Prisma.ProductUpdateInput = {};
  if (rest.codigoInterno !== undefined) {
    data.codigoInterno = normalizeCodigoInterno(rest.codigoInterno);
  }
  if (rest.nombreComercial !== undefined) data.nombreComercial = rest.nombreComercial;
  if (rest.categoriaProducto !== undefined) data.categoriaProducto = rest.categoriaProducto;
  if (rest.descripcion !== undefined) data.descripcion = rest.descripcion ?? null;
  if (rest.isActive !== undefined) data.isActive = rest.isActive;

  const updated = await db.product.update({ where: { id }, data });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "product.update",
    entity: "Product",
    entityId: id,
    metadata: { changes: Object.keys(data) },
  });

  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  return updated;
}

export async function deactivateProduct(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const updated = await db.product.update({
    where: { id },
    data: { isActive: false },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "product.deactivate",
    entity: "Product",
    entityId: id,
  });

  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  return updated;
}

// Presentations

export async function createPresentation(rawInput: CreatePresentationInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = createPresentationSchema.parse(rawInput);

  // Ensure the parent product exists and is active.
  const product = await db.product.findUnique({
    where: { id: input.productId },
    select: { id: true, isActive: true },
  });
  if (!product) throw new Error("Producto no encontrado.");
  if (!product.isActive) throw new Error("No se pueden agregar presentaciones a un producto inactivo.");

  const created = await db.presentation.create({
    data: {
      productId: input.productId,
      gramajeNeto: input.gramajeNeto,
      unidadesPorEmpaque: input.unidadesPorEmpaque ?? null,
      porcionDeclarada: input.porcionDeclarada ?? null,
      porcionPorEnvase: input.porcionPorEnvase ?? null,
    },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "presentation.create",
    entity: "Presentation",
    entityId: created.id,
    metadata: {
      productId: created.productId,
      gramajeNeto: created.gramajeNeto.toString(),
      unidadesPorEmpaque: created.unidadesPorEmpaque,
    },
  });

  revalidatePath(`/productos/${input.productId}`);
  return created;
}

export async function updatePresentation(rawInput: UpdatePresentationInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = updatePresentationSchema.parse(rawInput);
  const { id, productId: _ignored, ...rest } = input;

  const data: Prisma.PresentationUpdateInput = {};
  if (rest.gramajeNeto !== undefined) data.gramajeNeto = rest.gramajeNeto;
  if (rest.unidadesPorEmpaque !== undefined)
    data.unidadesPorEmpaque = rest.unidadesPorEmpaque ?? null;
  if (rest.porcionDeclarada !== undefined) data.porcionDeclarada = rest.porcionDeclarada ?? null;
  if (rest.porcionPorEnvase !== undefined) data.porcionPorEnvase = rest.porcionPorEnvase ?? null;
  if (rest.isActive !== undefined) data.isActive = rest.isActive;

  const updated = await db.presentation.update({ where: { id }, data });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "presentation.update",
    entity: "Presentation",
    entityId: id,
    metadata: { changes: Object.keys(data) },
  });

  revalidatePath(`/productos/${updated.productId}`);
  return updated;
}

export async function deactivatePresentation(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const updated = await db.presentation.update({
    where: { id },
    data: { isActive: false },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "presentation.deactivate",
    entity: "Presentation",
    entityId: id,
  });

  revalidatePath(`/productos/${updated.productId}`);
  return updated;
}
