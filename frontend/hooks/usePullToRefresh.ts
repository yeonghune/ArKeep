import { useRef, useState, useEffect, type RefObject } from "react";

const PTR_THRESHOLD = 80;
const MAX_PULL = 120;
const DAMPING = 0.4;

export function usePullToRefresh(ref: RefObject<HTMLElement | null>) {
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const distRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0 && el.scrollTop <= 0) {
        e.preventDefault();
        const d = Math.min(diff * DAMPING, MAX_PULL);
        distRef.current = d;
        setPullDistance(d);
      } else {
        pullingRef.current = false;
        distRef.current = 0;
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (distRef.current >= PTR_THRESHOLD) {
        setPullDistance(PTR_THRESHOLD);
        window.location.reload();
      } else {
        setPullDistance(0);
      }
      distRef.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref]);

  return { pullDistance, threshold: PTR_THRESHOLD };
}
