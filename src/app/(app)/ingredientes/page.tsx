import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { listIngredients } from "@/app/actions/ingredient-actions";
import { IngredientTable } from "@/components/ingredients";
// Role imported for type hints

export default async function IngredientesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; siesaPrefix?: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const params = await searchParams;
  const isAdmin = hasRole(currentUser.role, ["ADMIN", "R_AND_D"]);

  const ingredients = await listIngredients({
    search: params.search,
    category: params.category as any,
    siesaPrefix: params.siesaPrefix,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ingredientes</h1>
        <p className="text-muted-foreground mt-1">
          Catálogo de materias primas y perfiles nutricionales
        </p>
      </div>

      <IngredientTable
        ingredients={ingredients}
        isAdmin={isAdmin}
      />
    </div>
  );
}
