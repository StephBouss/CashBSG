import { useEffect } from "react";

/** Ferme un panneau/modal au clavier (Échap) — complète le clic sur le fond
 * semi-transparent, qui reste volontairement un simple fond non focusable
 * (le bouton de fermeture explicite et Échap couvrent l'usage clavier). */
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onEscape();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onEscape]);
}
