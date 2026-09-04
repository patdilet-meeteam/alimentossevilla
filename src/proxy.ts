import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/ingredientes",
  "/productos",
  "/formulaciones",
  "/costos",
  "/normativa",
  "/documentos",
  "/usuarios",
  "/auditoria",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Better Auth utiliza "better-auth.session_token" o "__Secure-better-auth.session_token"
  const sessionCookie =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // Si visita la raíz "/", redirigir según estado de sesión
  if (pathname === "/") {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Comprobar si la ruta actual es una ruta protegida
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Compatibilidad con middleware legacy
export const middleware = proxy;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
