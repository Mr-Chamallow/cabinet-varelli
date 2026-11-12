"use client";
import { ReactNode, useEffect } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { roleDeUser } from "@/lib/cabinetRoles";
import { CabinetStyles } from "@/components/cabinet/CabinetStyles";

interface Props {
  title: string;
  icon: ReactNode;
  desc: string;
  perms: string[]; // accès si l'utilisateur possède AU MOINS une de ces permissions
  roles?: string[]; // si fourni : accès réservé à ces rôles (remplace perms)
  children: (user: any) => ReactNode;
}

export default function CabinetShell({ title, icon, desc, perms, roles, children }: Props) {
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) window.location.href = "/login";
  }, [loading, user]);

  if (loading || !user) return null;
  const acces = roles ? roles.includes(roleDeUser(user)) : perms.some(p => hasPermission(user, p));

  return (
    <div className="page-container cab-enter">
      <CabinetStyles />
      <a className="back-link" href="/avocat">Retour à l&apos;espace avocat</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">{icon} {title}</h1>
          <p className="page-subtitle">{desc}</p>
          <div className="gold-line" />
        </div>
      </div>
      {acces ? children(user) : (
        <div className="empty-state"><div className="empty-title">Accès refusé</div></div>
      )}
    </div>
  );
}
