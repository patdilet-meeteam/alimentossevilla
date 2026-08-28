import { Role, RoleLabels, RoleBadgeStyles } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export function Header({ user }: HeaderProps) {
  const badgeStyle = RoleBadgeStyles[user.role] || RoleBadgeStyles[Role.VIEWER];

  return (
    <header className="h-16 border-b bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4 pl-10 lg:pl-0">
        <div>
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Plataforma Centralizada de Gestión Técnica y Nutricional
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Alimentos Sevilla S.A.S. — Sistema de Control & Cumplimiento
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border text-[11px] text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">SPEC-001: Platform Foundation</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium border",
              badgeStyle.bg,
              badgeStyle.text,
              badgeStyle.border
            )}
          >
            {RoleLabels[user.role]}
          </span>
        </div>
      </div>
    </header>
  );
}
