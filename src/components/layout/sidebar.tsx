"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wheat,
  Package,
  FlaskConical,
  ShieldCheck,
  CircleDollarSign,
  FileText,
  Users,
  History,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role, RoleLabels, RoleBadgeStyles } from "@/lib/auth/roles";
import { useState } from "react";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles?: Role[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Ingredientes",
    href: "/ingredientes",
    icon: Wheat,
  },
  {
    title: "Productos",
    href: "/productos",
    icon: Package,
  },
  {
    title: "Formulaciones",
    href: "/formulaciones",
    icon: FlaskConical,
  },
  {
    title: "Cálculo Nutricional",
    href: "/normativa",
    icon: ShieldCheck,
    badge: "Sem. 4",
  },
  {
    title: "Costos",
    href: "/costos",
    icon: CircleDollarSign,
  },
  {
    title: "Documentos Técnicos",
    href: "/documentos",
    icon: FileText,
    badge: "Sem. 6",
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    icon: Users,
  },
  {
    title: "Auditoría",
    href: "/auditoria",
    icon: History,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const badgeStyle = RoleBadgeStyles[user.role] || RoleBadgeStyles[Role.VIEWER];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md bg-white dark:bg-slate-900 border shadow-sm text-slate-700 dark:text-slate-200"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#1C4378] text-slate-100 flex flex-col border-r border-[#1C4378] transition-transform duration-200 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#6FC7DA]/30 gap-3">
          <div className="w-8 h-8 rounded-md bg-[#6FC7DA] flex items-center justify-center font-bold text-[#1C4378] tracking-wider text-sm shadow-sm">
            AS
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight text-white">
              Alimentos Sevilla
            </span>
            <span className="text-[11px] text-[#B9E8F1] leading-tight">
              Gestión Nutricional
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Plataforma Centralizada
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
            ? "bg-[#1C4378] text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>{item.title}</span>
                </div>
                {item.badge ? (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-mono font-normal",
                      isActive
                    ? "bg-[#6FC7DA]/30 text-white"
                        : "bg-slate-800 text-slate-400 border border-slate-700/50"
                    )}
                  >
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex flex-col space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white truncate">
                {user.name}
              </span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                  badgeStyle.bg,
                  badgeStyle.text,
                  badgeStyle.border
                )}
              >
                {RoleLabels[user.role] || user.role}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {user.email}
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                const { authClient } = await import("@/lib/auth/auth-client");
                await authClient.signOut();
              } catch (e) {
                console.error("Logout error:", e);
              }
              document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 bg-slate-800/80 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/50 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
