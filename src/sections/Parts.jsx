import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Plus, ArrowUpRight } from "lucide-react";
import { PARTS, WHEEL_OPTIONS, formatPrice } from "../data/content.js";
import PartShowcase3D from "./garage/PartShowcase3D.jsx";
import "./Parts.css";

const CATEGORIES = ["Barchasi", ...new Set(PARTS.map((p) => p.category))];

function PartCard({ part }) {
  const ref = useRef(null);

  // 3D tilt on hover
  const onMove = (e) => {
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, {
      rotateY: x * 12,
      rotateX: -y * 12,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 800,
    });
  };
  const onLeave = () => {
    gsap.to(ref.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.6,
      ease: "power3.out",
    });
  };

  return (
    <article
      className="part interactive"
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="part__media">
        <img src={part.image} alt={part.name} loading="lazy" />
        <span className="part__cat">{part.category}</span>
        <button className="part__add" aria-label="Qo'shish">
          <Plus size={18} />
        </button>
      </div>
      <div className="part__body">
        <h3 className="part__name">{part.name}</h3>
        <div className="part__foot">
          <span className="part__price">{formatPrice(part.price)}</span>
          <span className="part__more">
            Batafsil <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </article>
  );
}

export default function Parts() {
  const root = useRef(null);
  const [cat, setCat] = useState("Barchasi");
  const [rimColor, setRimColor] = useState(WHEEL_OPTIONS[1].color);

  const filtered = useMemo(
    () =>
      cat === "Barchasi" ? PARTS : PARTS.filter((p) => p.category === cat),
    [cat],
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".parts__head .reveal", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".parts__head", start: "top 82%" },
      });
      gsap.from(".parts__featured", {
        x: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".parts__featured", start: "top 80%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Animate grid items on filter change
  useEffect(() => {
    gsap.fromTo(
      ".part",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" },
    );
  }, [cat]);

  return (
    <section id="parts" className="section parts" ref={root}>
      <div className="container">
        <div className="parts__head">
          <span className="eyebrow reveal">Zapchastlar katalogi</span>
          <h2 className="section-title reveal">
            Original detallar, <span className="gradient-text">aniq</span>{" "}
            tafsilotlar
          </h2>
          <p className="section-sub reveal">
            Yuqori aniqlikdagi fotosuratlar va interaktiv 3D modellar bilan har
            bir detalni har tomondan ko'ring.
          </p>
        </div>

        {/* Featured 3D + info */}
        <div className="parts__featured glass">
          <div className="parts__featured-3d">
            <PartShowcase3D color={rimColor} />
            <div className="parts__featured-badge">3D · 360° aylantiriladi</div>
          </div>
          <div className="parts__featured-info">
            <span className="pstep__tag">Tavsiya etiladi</span>
            <h3>Forged Performance disklar</h3>
            <p>
              Yengil qotishmali, aerodinamik dizayn. Og'irligi 30% kam,
              mustahkamligi esa yuqori. Rang variantini tanlab, jonli 3D
              ko'rinishda ko'ring.
            </p>
            <div className="parts__featured-colors">
              {WHEEL_OPTIONS.filter((w) => w.id !== "stock").map((w) => (
                <button
                  key={w.id}
                  className={`swatch interactive ${
                    rimColor === w.color ? "swatch--active" : ""
                  }`}
                  style={{ background: w.color }}
                  onClick={() => setRimColor(w.color)}
                  title={w.name}
                />
              ))}
            </div>
            <a href="#garage" className="btn btn-primary interactive">
              Garajda sinab ko'rish
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="parts__filters">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip interactive ${cat === c ? "chip--active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="parts__grid">
          {filtered.map((p) => (
            <PartCard key={p.id} part={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
