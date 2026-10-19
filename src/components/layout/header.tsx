import { Role, RoleLabels, RoleBadgeStyles } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { UserGuide } from "@/components/layout/user-guide";

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
    <header className="h-16 border-b bg-white dark:bg-slate-900 px-3 sm:px-6 flex shrink-0 items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
      <div className="min-w-0 flex-1 pl-10 lg:pl-0">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            <span className="sm:hidden">Gestión Técnica</span>
            <span className="hidden sm:inline">Plataforma Centralizada de Gestión Técnica y Nutricional</span>
          </h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            <span className="sm:hidden">Alimentos Sevilla</span>
            <span className="hidden sm:inline">Alimentos Sevilla S.A.S. — Sistema de Control & Cumplimiento</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <UserGuide />
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "whitespace-nowrap text-xs px-2.5 py-1 rounded-full font-medium border",
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
