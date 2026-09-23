"use client";
import { useEffect } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission, isReadOnlyRole } from "@/lib/auth";
import CarteEnqueteurMap from '@/components/carte-enqueteur/CarteEnqueteur';

export default function PageCarteEnqueteur() {
  const { user, loading } = useCurrentUser();
  useEffect(() => {
    if (!loading && (!user || !hasPermission(user, "carte-enqueteur"))) {
      window.location.href = "/";
    }
  }, [user, loading]);

  if (loading || !user) return null;

  const readOnly = isReadOnlyRole(user);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>Carte enquêteur</h1>
        {readOnly && (
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.35)',
            color: '#94a3b8',
          }}>
            🔒 Lecture seule
          </span>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CarteEnqueteurMap readOnly={readOnly} />
      </div>
    </div>
  );
}
