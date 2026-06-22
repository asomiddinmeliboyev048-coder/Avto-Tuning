// 3D aylanuvchi karusel galereya — sof CSS 3D transform.
// Mobil'da: avtomatik gorizontal scroll (marquee), touch'da to'xtaydi.
// Rasm sonini o'zgartirish: GALLERY massivига rasm qo'shing/oling.
// Aylanish radiusi: Carousel.css dagi --radius o'zgaruvchisi.
import { useEffect, useRef, useState } from "react";
import { Images } from "lucide-react";
import "./Carousel.css";

const GALLERY = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=600&q=80",
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

  // Touch/drag paytida to'xtaydi, qo'yib yuborilгach 2s dan keyin davom etadi
  const pause = () => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 2000);
  };
  useEffect(() => () => resumeTimer.current && clearTimeout(resumeTimer.current), []);

  // Mobil marquee uchun rasmlarni 2 marta takrorlaymiz (uzluksiz aylanish)
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

      {/* perspective beruvchi sahna */}
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
              {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img src={src} alt={`Tuning ish ${(i % count) + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
