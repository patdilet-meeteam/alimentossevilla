"use client";

import Image from "next/image";
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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role, RoleLabels, RoleBadgeStyles } from "@/lib/auth/roles";
import { useState, useSyncExternalStore } from "react";

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

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";
const COLLAPSED_CHANGE_EVENT = "sidebar-collapsed-change";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSED_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSED_CHANGE_EVENT, onChange);
  };
}

function writeCollapsed(value: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage unavailable: preference is not persisted.
  }
  window.dispatchEvent(new Event(COLLAPSED_CHANGE_EVENT));
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const badgeStyle = RoleBadgeStyles[user.role] || RoleBadgeStyles[Role.VIEWER];

  const toggleCollapsed = () => writeCollapsed(!collapsed);

  const handleLogout = async () => {
    try {
      const { authClient } = await import("@/lib/auth/auth-client");
      await authClient.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    }
    document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  // Collapsed mode applies only on desktop; the mobile drawer is always expanded.
  const hideOnCollapse = collapsed ? "lg:hidden" : "";

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
          "fixed inset-y-0 left-0 z-40 w-72 shrink-0 bg-[#1C4378] text-slate-100 flex flex-col transition-[transform,width] duration-200 ease-in-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          collapsed && "lg:w-[76px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "h-20 flex items-center gap-3 border-b border-[#6FC7DA]/30 pl-16 pr-5 lg:pl-5",
            collapsed && "lg:flex-col lg:justify-center lg:gap-1 lg:px-2"
          )}
        >
          <Image
            src="/brand/alimentos-sevilla-logo.png"
            alt="Alimentos Sevilla"
            width={700}
            height={315}
            priority
            className={cn("h-9 w-auto shrink-0", collapsed && "lg:h-6")}
          />
          <div className={cn("min-w-0 flex-1", hideOnCollapse)}>
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
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 space-y-1 overflow-y-auto px-3 py-5", collapsed && "lg:px-2")}>
          <div
            className={cn(
              "px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#B9E8F1]/50",
              hideOnCollapse
            )}
          >
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
                  "flex items-center justify-between gap-3 rounded-full border px-4 py-2.5 text-sm transition-colors",
                  collapsed && "lg:justify-center lg:px-0",
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
                  <span className={cn("truncate", hideOnCollapse)}>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isActive ? "bg-[#6FC7DA]/30 text-white" : "bg-white/10 text-[#B9E8F1]/70",
                      hideOnCollapse
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
        <div className={cn("border-t border-[#6FC7DA]/30 p-3", collapsed && "lg:px-2")}>
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-[#6FC7DA]/30 bg-white/5 px-4 py-3",
              collapsed && "lg:flex-col lg:px-0 lg:py-2"
            )}
          >
            <div className={cn("min-w-0 flex-1", hideOnCollapse)}>
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
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#B9E8F1]/80 transition-colors hover:bg-red-500/15 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
