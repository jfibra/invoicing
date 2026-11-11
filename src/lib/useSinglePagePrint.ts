import { useEffect, RefObject } from "react";

/**
 * Automatically fits printable invoice sheets onto exactly 1 page if
 * unusually long deductibles/remarks would otherwise exceed single-page height.
 */
export function useSinglePagePrint(sheetRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforePrint = () => {
      const el = sheetRef.current;
      if (!el) return;

      el.style.removeProperty("--print-zoom");
      const contentHeight = el.scrollHeight;
      // Print utility classes make print layout ~15-20% shorter than screen layout;
      // scale proportionally only when content is unusually tall (> 1240px on screen).
      if (contentHeight > 1240) {
        const zoom = Math.max(0.6, Math.min(1, 1200 / contentHeight));
        el.style.setProperty("--print-zoom", zoom.toFixed(3));
      } else {
        el.style.setProperty("--print-zoom", "1");
      }
    };

    const handleAfterPrint = () => {
      const el = sheetRef.current;
      if (!el) return;
      el.style.removeProperty("--print-zoom");
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [sheetRef]);
}
