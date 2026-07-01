import { useEffect, useRef } from "react";

/**
 * Hook that wires up anti-cheating detection: tab switching, window blur/minimize,
 * copy/paste, right-click, and basic devtools-open heuristics.
 * Calls onViolation(type, details) whenever a violation is detected.
 */
export default function useAntiCheat({ active, onViolation }) {
  const devToolsCheckRef = useRef(null);

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

    // Crude devtools-open heuristic via window size delta
    const threshold = 160;
    devToolsCheckRef.current = setInterval(() => {
      const widthDelta = window.outerWidth - window.innerWidth;
      const heightDelta = window.outerHeight - window.innerHeight;
      if (widthDelta > threshold || heightDelta > threshold) {
        onViolation("DEV_TOOLS", "Developer tools may be open");
      }
    }, 3000);

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
      clearInterval(devToolsCheckRef.current);
    };
  }, [active, onViolation]);
}
