import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { getIngredientById } from "@/app/actions/ingredient-actions";
import { IngredientDetail } from "@/components/ingredients";
import { Role } from "@prisma/client";

const WRITE_ROLES: Role[] = ["ADMIN", "R_AND_D"];

export default async function IngredienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { id } = await params;
  const ingredient = await getIngredientById(id);
  const isAdmin = hasRole(currentUser.role, WRITE_ROLES);

  const handleDeactivate = async () => {
    "use server";
    const { deactivateIngredient } = await import("@/app/actions/ingredient-actions");
    await deactivateIngredient(id);
    redirect("/ingredientes");
  };

  return (
    <IngredientDetail
      ingredient={ingredient}
      isAdmin={isAdmin}
      onDeactivate={handleDeactivate}
    />
  );
}
