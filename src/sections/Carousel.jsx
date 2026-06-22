// 3D aylanuvchi karusel galereya — sof CSS 3D transform.
// Rasm sonini o'zgartirish: GALLERY massivига rasm qo'shing/oling.
// Aylanish radiusi: Carousel.css dagi --radius o'zgaruvchisi.
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
  return (
    <section id="gallery" className="section gallery">
      <div className="container gallery__head">
        <span className="eyebrow"><Images size={14} /> Bizning ishlarimiz</span>
        <h2 className="section-title">3D <span className="gradient-text">galereya</span></h2>
        <p className="section-sub">Aylantiring yoki suring — ishlarimiz galereyasi.</p>
      </div>

      {/* perspective beruvchi sahna */}
      <div className="gallery__scene" style={{ "--count": count }}>
        <div className="gallery__ring">
          {GALLERY.map((src, i) => (
            <div
              className="gallery__item"
              key={i}
              style={{ transform: `rotateY(${(360 / count) * i}deg) translateZ(var(--radius))` }}
            >
              {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img src={src} alt={`Tuning ish ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
