"use server";

import { auth } from "@/lib/auth/auth";
import { cookies, headers } from "next/headers";
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

  const cookieStore = await cookies();
  cookieStore.delete("better-auth.session_token");
  cookieStore.delete("__Secure-better-auth.session_token");
  cookieStore.delete("better-auth.session_data");

  redirect("/login");
}
