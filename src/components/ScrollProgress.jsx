import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const bar = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const h =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = h > 0 ? window.scrollY / h : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${scrolled})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "3px",
        zIndex: 9998,
        background: "transparent",
      }}
    >
      <div
        ref={bar}
        style={{
          height: "100%",
          width: "100%",
          background: "var(--brand-gradient)",
          transform: "scaleX(0)",
          transformOrigin: "left",
        }}
      />
    </div>
  );
}
