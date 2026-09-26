"use client";

import { useCallback, useRef, useState } from "react";

interface PendingUndo {
  message: string;
  onUndo: () => void;
}

const UNDO_WINDOW_MS = 5000;

// "Corbeille" légère façon Gmail : au lieu d'une vraie corbeille parcourable (qui
// demanderait de changer la structure de plusieurs tables), on retarde simplement
// la suppression réelle de quelques secondes après l'avoir déjà retirée de l'écran,
// avec un bouton "Annuler" pour revenir en arrière pendant ce court délai. Couvre le
// vrai cas qui fait mal (clic malheureux) sans chantier de base de données.
export function useUndoAction() {
  const [pending, setPending] = useState<PendingUndo | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // message : ce qui s'affiche dans le toast (ex: `"Fusil à pompe" supprimé`)
  // commit : la VRAIE suppression (appel API), déclenchée après le délai si pas annulé
  // restore : remet l'élément dans l'UI si l'utilisateur clique "Annuler"
  const scheduleDelete = useCallback((message: string, commit: () => void | Promise<void>, restore: () => void) => {
    // Une suppression déjà en attente est confirmée immédiatement (pas de file
    // d'attente à gérer) avant d'en programmer une nouvelle.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPending({ message, onUndo: restore });
    timerRef.current = setTimeout(() => {
      commit();
      setPending(null);
      timerRef.current = null;
    }, UNDO_WINDOW_MS);
  }, []);

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPending((p) => {
      p?.onUndo();
      return null;
    });
  }, []);

  return { pending, scheduleDelete, undo };
}
