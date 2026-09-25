"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role, RoleLabels, RoleBadgeStyles } from "@/lib/auth/roles";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth-actions";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/components/layout/sidebar-preferences";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  initialCollapsed: boolean;
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

// Collapsed mode is desktop-only: every collapsed style is scoped with
// `lg:group-data-[collapsed]:` so the mobile drawer always renders expanded.
export function Sidebar({ user, initialCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const badgeStyle = RoleBadgeStyles[user.role] || RoleBadgeStyles[Role.VIEWER];

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

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
        data-collapsed={collapsed || undefined}
        className={cn(
          "group fixed inset-y-0 left-0 z-40 w-72 shrink-0 bg-[#1C4378] text-slate-100 flex flex-col transition-transform duration-200 ease-in-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:data-[collapsed]:w-[76px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center gap-3 border-b border-[#6FC7DA]/30 pl-16 pr-5 lg:pl-5 lg:group-data-[collapsed]:flex-col lg:group-data-[collapsed]:justify-center lg:group-data-[collapsed]:gap-1 lg:group-data-[collapsed]:px-2">
          <BrandLogo
            displayWidth={80}
            className="h-9 w-auto shrink-0 lg:group-data-[collapsed]:h-6"
          />
          <div className="min-w-0 flex-1 lg:group-data-[collapsed]:hidden">
            <p className="truncate text-sm font-semibold leading-tight text-white">
              Gestión Técnica
            </p>
            <p className="truncate text-[11px] leading-tight text-[#B9E8F1]/70">
              y Nutricional
            </p>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#B9E8F1]/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-data-[collapsed]:rotate-180" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 lg:group-data-[collapsed]:px-2">
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#B9E8F1]/50 lg:group-data-[collapsed]:hidden">
            Navegación
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.title : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-full border px-4 py-2.5 text-sm transition-colors lg:group-data-[collapsed]:justify-center lg:group-data-[collapsed]:px-0",
                  isActive
                    ? "border-[#6FC7DA] bg-[#6FC7DA]/15 font-medium text-white"
                    : "border-transparent text-[#B9E8F1]/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-white" : "text-[#B9E8F1]/70"
                    )}
                  />
                  <span className="truncate lg:group-data-[collapsed]:hidden">{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium lg:group-data-[collapsed]:hidden",
                      isActive ? "bg-[#6FC7DA]/30 text-white" : "bg-white/10 text-[#B9E8F1]/70"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-[#6FC7DA]/30 p-3 lg:group-data-[collapsed]:px-2">
          <div className="flex items-center gap-2 rounded-2xl border border-[#6FC7DA]/30 bg-white/5 px-4 py-3 lg:group-data-[collapsed]:flex-col lg:group-data-[collapsed]:px-0 lg:group-data-[collapsed]:py-2">
            <div className="min-w-0 flex-1 lg:group-data-[collapsed]:hidden">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-[#B9E8F1]/60">{user.email}</p>
              <span
                className={cn(
                  "mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  badgeStyle.bg,
                  badgeStyle.text,
                  badgeStyle.border
                )}
              >
                {RoleLabels[user.role] || user.role}
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#B9E8F1]/80 transition-colors hover:bg-red-500/15 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
