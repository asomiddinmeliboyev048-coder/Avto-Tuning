import { useEffect, useRef } from "react";
import "./CustomCursor.css";

export default function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    // Disable on touch devices.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dotEl = dot.current;
    const ringEl = ring.current;
    let mouseX = 0,
      mouseY = 0,
      ringX = 0,
      ringY = 0;
    let raf;

    const move = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dotEl.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    };

    const loop = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ringEl.style.transform = `translate(${ringX}px, ${ringY}px)`;
      raf = requestAnimationFrame(loop);
    };

    const over = (e) => {
      if (e.target.closest("a, button, .interactive")) {
        ringEl.classList.add("cursor-ring--active");
      }
    };
    const out = (e) => {
      if (e.target.closest("a, button, .interactive")) {
        ringEl.classList.remove("cursor-ring--active");
      }
    };

    document.body.classList.add("has-custom-cursor");
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", out);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring} />
    </>
  );
}
