"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintPreviewButton() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="mr-2 size-4" />
      Imprimir previsualización
    </Button>
  );
}
