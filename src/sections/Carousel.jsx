// 3D aylanuvchi karusel galereya
import { useEffect, useRef, useState } from "react";
import { Images } from "lucide-react";
import "./Carousel.css";

// 1. Har bir rasmga alohida nom bering (car4, car5, car6)
import car1 from "../assets/bmw1.jpg";
import car2 from "../assets/gentra2.jpg";
import car3 from "../assets/kia3.jpg";
import car4 from "../assets/malibu4.jpg";
import car5 from "../assets/mashina5.jpg";
import car6 from "../assets/zeekr6.jpg";

// 2. Ularni massivda ham tartib bilan ko'rsating
const GALLERY = [
  car1,
  car2,
  car3,
  car4,
  car5,
  car6,
];

export default function Carousel() {
  const count = GALLERY.length;
  const [isMobile, setIsMobile] = useState(false);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const pause = () => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 2000);
  };
  useEffect(() => () => resumeTimer.current && clearTimeout(resumeTimer.current), []);

  const mobileItems = isMobile ? [...GALLERY, ...GALLERY] : GALLERY;

  return (
    <section id="gallery" className="section gallery">
      <div className="container gallery__head">
        <span className="eyebrow"><Images size={14} /> Bizning ishlarimiz</span>
        <h2 className="section-title">3D <span className="gradient-text">galereya</span></h2>
        <p className="section-sub">
          {isMobile ? "Avtomatik aylanadi — barmoq bilan ushlab to'xtating." : "Aylantiring yoki suring — ishlarimiz galereyasi."}
        </p>
      </div>

      <div className="gallery__scene" style={{ "--count": count }}>
        <div
          className={`gallery__ring ${isMobile ? "gallery__ring--marquee" : ""} ${paused ? "is-paused" : ""}`}
          onTouchStart={pause}
          onTouchEnd={scheduleResume}
          onTouchCancel={scheduleResume}
          onPointerDown={isMobile ? pause : undefined}
          onPointerUp={isMobile ? scheduleResume : undefined}
        >
          {(isMobile ? mobileItems : GALLERY).map((src, i) => (
            <div
              className="gallery__item"
              key={i}
              style={
                isMobile
                  ? undefined
                  : { transform: `rotateY(${(360 / count) * i}deg) translateZ(var(--radius))` }
              }
              aria-hidden={isMobile && i >= count ? "true" : undefined}
            >
              <img src={src} alt={`Tuning ish ${(i % count) + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
