"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle, Shield, Check } from "lucide-react";
import { RoleLabels } from "@/lib/auth/roles";
import { Role } from "@prisma/client";

const brandHighlights = [
  { title: "Fórmulas", caption: "Versionado" },
  { title: "Nutrición", caption: "Perfiles" },
  { title: "Fichas", caption: "Técnicas" },
];

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
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-slate-50">
      {/* Brand panel */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#16112f] via-[#1c1640] to-[#2a2270] text-white flex flex-col items-center justify-center px-6 py-12 lg:py-0">
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[140%] rounded-[50%] bg-[#140f2b]/70" />
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <Image
            src="/brand/alimentos-sevilla-logo.png"
            alt="Alimentos Sevilla"
            width={700}
            height={315}
            priority
            className="h-auto w-44 sm:w-52"
          />
          <h1 className="mt-10 text-2xl sm:text-3xl font-bold tracking-tight">
            Gestión Técnica y Nutricional
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-indigo-100/75">
            Plataforma centralizada de formulaciones, perfiles nutricionales y
            documentación técnica.
          </p>

          <dl className="mt-10 hidden sm:grid grid-cols-3 divide-x divide-white/15">
            {brandHighlights.map((item) => (
              <div key={item.title} className="px-6">
                <dt className="text-xl font-bold">{item.title}</dt>
                <dd className="mt-1 text-xs text-indigo-100/60">
                  {item.caption}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Bienvenido
            </h2>
            <p className="text-sm text-slate-500">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@alimentossevilla.com"
                  required
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="h-12 rounded-full border-slate-200 bg-slate-100/70 pl-11 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#2e2a6b]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  required
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="h-12 rounded-full border-slate-200 bg-slate-100/70 pl-11 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#2e2a6b]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-full bg-[#2e2a6b] text-white font-medium hover:bg-[#3a3585]"
            >
              {isPending ? "Validando credenciales..." : "Iniciar sesión"}
            </Button>
          </form>

          {/* Demo Fast Fill Section (Dev / Review Mode) */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-[#2e2a6b]">
                <Shield className="h-3.5 w-3.5" />
                Cuentas de prueba
              </span>
              <span>Demo local</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.pass)}
                  className="flex items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-[11px] text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
                >
                  <span className="truncate font-medium">
                    {RoleLabels[acc.role]}
                  </span>
                  {emailValue === acc.email && (
                    <Check className="h-3 w-3 shrink-0 text-[#2e2a6b]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Acceso restringido a colaboradores de Alimentos Sevilla S.A.S.
          </p>
        </div>
      </section>
    </div>
  );
}
