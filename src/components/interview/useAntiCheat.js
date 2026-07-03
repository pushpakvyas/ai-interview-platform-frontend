import { useEffect } from "react";

/**
 * Hook that wires up anti-cheating detection: tab switching, window
 * blur/minimize, copy/paste, and right-click.
 * Calls onViolation(type, details) whenever a violation is detected.
 *
 * Note: the old "devtools open" heuristic (comparing window.outerWidth vs
 * innerWidth) was removed — it produced false positives any time the
 * browser window was resized, maximized/restored, or on certain OS/zoom
 * combinations, none of which mean the candidate is actually cheating.
 * Dual-face detection (see useFaceDetection.js) covers a more reliable and
 * directly meaningful signal instead.
 */
export default function useAntiCheat({ active, onViolation }) {
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.hidden) onViolation("TAB_SWITCH", "Tab switched or window minimized");
    };

    const handleBlur = () => {
      onViolation("WINDOW_MINIMIZE", "Window lost focus");
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      onViolation("COPY_PASTE", `${e.type} attempted`);
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [active, onViolation]);
}
