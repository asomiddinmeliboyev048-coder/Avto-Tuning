import { useEffect, useRef, useState } from "react";

/**
 * Element ekranda ko'rinmasa `false` qaytaradi.
 * Maqsad: 3D canvas ekrandan chiqqanda (masalan footer ko'ringanda)
 * R3F `frameloop`ni "never"ga o'tkazib render loop'ni to'xtatish —
 * mobil GPU artifacts/glitch va batareya isrofini oldini oladi.
 *
 * @param {{ rootMargin?: string, threshold?: number }} opts
 * @returns {[React.MutableRefObject, boolean]} [ref, inView]
 */
export function useInView({ rootMargin = "150px", threshold = 0.01 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold]);

  return [ref, inView];
}
