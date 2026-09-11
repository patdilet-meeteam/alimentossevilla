import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { getNutrients, createIngredientWithProfile } from "@/app/actions/ingredient-actions";
import { IngredientForm } from "@/components/ingredients";
import { Role } from "@prisma/client";

const WRITE_ROLES: Role[] = ["ADMIN", "R_AND_D"];

export default async function NuevoIngredientePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!hasRole(currentUser.role, WRITE_ROLES)) {
    redirect("/ingredientes");
  }

  const nutrients = await getNutrients();

  const handleSubmit = async (data: any) => {
    "use server";
    try {
      await createIngredientWithProfile({
        ingredient: {
          name: data.name,
          genericName: data.genericName || null,
          siesaCode: data.siesaCode,
          category: data.category,
          isAllergen: data.isAllergen,
          allergenTags: data.allergenTags,
          isActive: true,
        },
        profile: {
          ingredientId: "",
          source: data.source,
          sourceDetail: data.sourceDetail || null,
          validFrom: new Date(),
          referenceBase: "100g",
          isActive: true,
          nutrientValues: data.nutrientValues
            .filter((nv: any) => nv.value > 0)
            .map((nv: any) => ({
              nutrientId: nv.nutrientId,
              value: nv.value,
              method: nv.method || null,
            })),
        },
      });
      redirect("/ingredientes");
    } catch (error) {
      console.error("Error creating ingredient:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Ingrediente</h1>
        <p className="text-muted-foreground mt-1">
          Crear un nuevo ingrediente con su perfil nutricional
        </p>
      </div>

      <IngredientForm
        onSubmit={handleSubmit}
        nutrients={nutrients}
      />
    </div>
  );
}
