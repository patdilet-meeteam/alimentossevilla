"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, AlertCircle, type LucideIcon } from "lucide-react";

const brandHighlights = [
  { title: "Fórmulas", caption: "Versionado" },
  { title: "Nutrición", caption: "Perfiles" },
  { title: "Fichas", caption: "Técnicas" },
];

interface IconFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function IconField({ id, label, icon: Icon, onChange, ...inputProps }: IconFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-700">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          name={id}
          required
          onChange={(e) => onChange(e.target.value)}
      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1C4378]"
          {...inputProps}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
    <div className="min-h-screen grid bg-slate-50 lg:grid-cols-[1.1fr_1fr] dark:bg-slate-950">
      {/* Brand panel */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#16365F] via-[#1C4378] to-[#245B88] px-6 py-12 text-white lg:py-0">
        <div className="pointer-events-none absolute -bottom-44 -left-24 h-[28rem] w-[140%] rounded-[50%] bg-[#102B4D]/45" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#6FC7DA]/15 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-[#6FC7DA]" />

        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <BrandLogo
            displayWidth={208}
            preload
            className="h-auto w-44 sm:w-52"
          />
          <h1 className="mt-10 text-2xl sm:text-3xl font-bold tracking-tight">
            Gestión Técnica y Nutricional
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#DCEEF4] sm:text-base">
            Plataforma centralizada de formulaciones, perfiles nutricionales y
            documentación técnica.
          </p>

          <dl className="mt-10 hidden sm:grid grid-cols-3 divide-x divide-white/15">
            {brandHighlights.map((item) => (
            <div key={item.title} className="px-6">
              <dt className="text-xl font-bold">{item.title}</dt>
              <dd className="mt-1 text-xs text-[#B9E8F1]">
                  {item.caption}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-9 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 space-y-1.5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#1C4378] dark:text-[#6FC7DA]">Acceso seguro</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bienvenido
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
            <IconField
              id="email"
              label="Correo electrónico"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="usuario@alimentossevilla.com"
              value={emailValue}
              onChange={setEmailValue}
            />
            <IconField
              id="password"
              label="Contraseña"
              icon={Lock}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              value={passwordValue}
              onChange={setPasswordValue}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-xl bg-[#1C4378] font-medium text-white shadow-sm shadow-[#1C4378]/20 hover:bg-[#16365F]"
            >
              {isPending ? "Validando credenciales..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            Acceso restringido a colaboradores de Alimentos Sevilla S.A.S.
          </p>
        </div>
      </section>
    </div>
  );
}
