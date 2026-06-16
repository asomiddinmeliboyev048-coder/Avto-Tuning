import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./Loader.css";

export default function Loader({ onComplete }) {
  const root = useRef(null);
  const counter = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const obj = { val: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(root.current, {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
          delay: 0.2,
          onComplete,
        });
      },
    });

    tl.to(obj, {
      val: 100,
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counter.current)
          counter.current.textContent = Math.round(obj.val)
            .toString()
            .padStart(2, "0");
        if (barRef.current) barRef.current.style.width = obj.val + "%";
      },
    });

    return () => tl.kill();
  }, [onComplete]);

  return (
    <div className="loader" ref={root}>
      <div className="loader__brand">
        <span className="loader__mark">APEX</span>
        <span className="loader__sub">GARAGE</span>
      </div>
      <div className="loader__bottom">
        <div className="loader__count">
          <span ref={counter}>00</span>
          <span className="loader__pct">%</span>
        </div>
        <div className="loader__track">
          <div className="loader__bar" ref={barRef} />
        </div>
        <div className="loader__label">Dvigatel ishga tushmoqda…</div>
      </div>
    </div>
  );
}
