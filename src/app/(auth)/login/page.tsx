"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle, Shield, Check } from "lucide-react";
import { RoleLabels } from "@/lib/auth/roles";
import { Role } from "@prisma/client";

export default function LoginPage() {
  const router = useRouter();
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const demoAccounts = [
    {
      role: Role.ADMIN,
      email: "admin@alimentossevilla.com",
      pass: "AdminSevilla2026!#",
    },
    {
      role: Role.R_AND_D,
      email: "id@alimentossevilla.com",
      pass: "IDSevilla2026!#",
    },
    {
      role: Role.QUALITY,
      email: "calidad@alimentossevilla.com",
      pass: "CalidadSevilla2026!#",
    },
    {
      role: Role.VIEWER,
      email: "consulta@alimentossevilla.com",
      pass: "ConsultaSevilla2026!#",
    },
  ];

  const fillDemo = (email: string, pass: string) => {
    setEmailValue(email);
    setPasswordValue(pass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const res = await authClient.signIn.email({
        email: emailValue.trim().toLowerCase(),
        password: passwordValue,
      });

      if (res.error) {
        setError(res.error.message || "Credenciales de acceso incorrectas");
        setIsPending(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(
        "Error inesperado al comunicarse con el servicio de autenticación"
      );
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background subtle elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-600/30">
            AS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Alimentos Sevilla S.A.S.
          </h1>
          <p className="text-xs text-slate-400">
            Plataforma Centralizada de Gestión Técnica y Nutricional
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-sm text-slate-100 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-white font-semibold">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Ingrese sus credenciales autorizadas (Better Auth Provider)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Correo Electrónico Corporativo
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@alimentossevilla.com"
                  required
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  required
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                {isPending
                  ? "Validando credenciales..."
                  : "Ingresar a la Plataforma"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Fast Fill Section (Dev / Review Mode) */}
        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Shield className="w-3.5 h-3.5" />
              Entorno de Desarrollo (Cuentas de Prueba)
            </span>
            <span>Semana 1</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Haga clic en un perfil para autocompletar credenciales de prueba:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => fillDemo(acc.email, acc.pass)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition-colors text-left"
              >
                <span className="font-medium truncate">
                  {RoleLabels[acc.role]}
                </span>
                {emailValue === acc.email && (
                  <Check className="w-3 h-3 text-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400">
          Acceso restringido a colaboradores de Alimentos Sevilla S.A.S.
        </p>
      </div>
    </div>
  );
}
