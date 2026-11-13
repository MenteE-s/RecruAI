import { useEffect, useRef, useState } from "react";

/**
 * Measures the active link inside a nav container and returns the transform for
 * a single sliding rail. Runs on route change only; no scroll listeners.
 */
export default function useActiveRail(activeKey) {
  const containerRef = useRef(null);
  const [rail, setRail] = useState({ opacity: 0, transform: "translateY(0px)", height: 18 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const el = container.querySelector('[data-nav-active="true"]');
    if (!el) {
      setRail((r) => ({ ...r, opacity: 0 }));
      return;
    }
    const cr = container.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const height = Math.max(14, Math.min(er.height - 12, 22));
    const top = er.top - cr.top + (er.height - height) / 2;
    setRail({ opacity: 1, transform: `translateY(${top}px)`, height });
  }, [activeKey]);

  return { containerRef, rail };
}
