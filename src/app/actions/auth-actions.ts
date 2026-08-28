"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<void> {
  try {
    const reqHeaders = await headers();
    await auth.api.signOut({
      headers: reqHeaders,
    });
  } catch (error) {
    console.error("Error en logoutAction:", error);
  }

  redirect("/login");
}
