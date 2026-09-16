"use client";
import { useEffect } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import CarteEnqueteur from '@/components/carte-enqueteur/CarteEnqueteur';

export default function PageCarteEnqueteur() {
  const { user, loading } = useCurrentUser();
  useEffect(() => {
    if (!loading && (!user || !hasPermission(user, "carte-enqueteur"))) {
      window.location.href = "/";
    }
  }, [user, loading]);

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>Carte enquêteur</h1>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CarteEnqueteur />
      </div>
    </div>
  );
}