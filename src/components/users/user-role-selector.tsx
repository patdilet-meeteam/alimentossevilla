"use client";

import { useState, useTransition } from "react";
import { Role, RoleLabels } from "@/lib/auth/roles";
import { updateUserRoleAction, toggleUserStatusAction } from "@/app/actions/user-actions";
import { Button } from "@/components/ui/button";

interface UserRoleSelectorProps {
  userId: string;
  currentRole: Role;
  isActive: boolean;
  isCurrentUser: boolean;
  isAdmin: boolean;
}

export function UserRoleSelector({
  userId,
  currentRole,
  isActive,
  isCurrentUser,
  isAdmin,
}: UserRoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const [activeState, setActiveState] = useState<boolean>(isActive);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as Role;
    setSelectedRole(newRole);

    startTransition(async () => {
      setMessage(null);
      const res = await updateUserRoleAction({ userId, role: newRole });
      if (res.success) {
        setMessage({ text: "Rol actualizado", type: "success" });
      } else {
        setMessage({ text: res.error || "Error al actualizar", type: "error" });
        setSelectedRole(currentRole);
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleToggleStatus = () => {
    const nextStatus = !activeState;
    startTransition(async () => {
      setMessage(null);
      const res = await toggleUserStatusAction({ userId, isActive: nextStatus });
      if (res.success) {
        setActiveState(nextStatus);
        setMessage({
          text: nextStatus ? "Usuario activado" : "Usuario desactivado",
          type: "success",
        });
      } else {
        setMessage({ text: res.error || "Error al cambiar estado", type: "error" });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  if (!isAdmin) {
    return (
      <span className="text-xs text-slate-500">
        Solo lectura (Administrador requerido)
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <select
          value={selectedRole}
          onChange={handleRoleChange}
          disabled={isPending || isCurrentUser}
          className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 focus:ring-1 focus:ring-blue-500"
        >
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>
              {RoleLabels[r]}
            </option>
          ))}
        </select>

        {!isCurrentUser && (
          <Button
            type="button"
            size="sm"
            variant={activeState ? "outline" : "secondary"}
            onClick={handleToggleStatus}
            disabled={isPending}
            className="h-7 text-[11px] px-2"
          >
            {activeState ? "Desactivar" : "Activar"}
          </Button>
        )}
      </div>

      {message && (
        <span
          className={`text-[10px] font-medium ${
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
