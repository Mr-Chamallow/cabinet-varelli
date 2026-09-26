"use client";

interface UndoToastProps {
  pending: { message: string; onUndo: () => void } | null;
  onUndo: () => void;
}

// Rendu du toast "Annuler" — classe CSS dédiée (.toast-undo) car sa fenêtre de 5s
// est plus longue que celle des toasts normaux (3s) : réutiliser .toast tel quel
// aurait fait disparaître visuellement le toast avant l'expiration réelle du délai.
export function UndoToast({ pending, onUndo }: UndoToastProps) {
  if (!pending) return null;
  return (
    <div className="toast-container">
      <div className="toast toast-undo">
        <span>🗑️ {pending.message}</span>
        <button className="toast-undo-btn" onClick={onUndo}>Annuler</button>
      </div>
    </div>
  );
}
