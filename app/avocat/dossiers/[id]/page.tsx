"use client";
import { useParams } from "next/navigation";
import DossierChat from "@/components/cabinet/DossierChat";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { estStaffUser } from "@/lib/cabinetRoles";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  if (!user) return null;
  return (
    <DossierChat
      id={id}
      moiId={(user as any).discord_id}
      staff={estStaffUser(user)}
      direction={hasPermission(user, "cabinet_attribution")}
      compta={hasPermission(user, "cabinet_compta")}
    />
  );
}
