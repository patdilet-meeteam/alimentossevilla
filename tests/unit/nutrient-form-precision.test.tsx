import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {it, expect, vi} from "vitest";
vi.mock("next/navigation", () => ({useRouter: () => ({push: vi.fn(), refresh: vi.fn()})}));
import {IngredientForm} from "@/components/ingredients/ingredient-form";
it("shows the full source decimal and an explicit zero in editable nutrient fields", () => {
  const now = new Date("2026-10-19T00:00:00Z");
  const nutrients = [
    {id: "fiber", key: "FIBER", displayName: "Fibra", unit: "G" as const, isRequiredOnLabel: true, createdAt: now},
    {id: "trans", key: "FAT_TRANS", displayName: "Trans", unit: "G" as const, isRequiredOnLabel: true, createdAt: now},
  ];
  const html = renderToStaticMarkup(<IngredientForm onSubmit={async () => {}} nutrients={nutrients} initialData={{profiles: [{values: [{nutrientId: "fiber", value: "0.011013722162007404"}, {nutrientId: "trans", value: 0}]}]}} />);
  expect(html).toContain('value="0.011013722162007404"');
  expect(html).toContain('value="0"');
});
