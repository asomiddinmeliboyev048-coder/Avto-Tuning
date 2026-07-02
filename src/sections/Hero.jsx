import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowDown, Play } from "lucide-react";
import { STATS } from "../data/content.js";
import "./Hero.css";

export default function Hero() {
  const root = useRef(null);
  const titleRef = useRef(null);
  const carRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 3.0 });

      // Split-line title reveal
      const lines = titleRef.current.querySelectorAll(".hero__line span");
      tl.from(lines, {
        yPercent: 120,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.12,
      })
        .from(".hero__eyebrow", { opacity: 0, y: 20, duration: 0.8 }, "-=0.8")
        .from(
          ".hero__desc, .hero__cta-row, .hero__stats",
          { opacity: 0, y: 30, duration: 0.8, stagger: 0.12 },
          "-=0.6",
        )
        .from(
          carRef.current,
          { opacity: 0, scale: 1.15, duration: 1.6, ease: "power3.out" },
          "-=1.4",
        );

      // Parallax on scroll
      gsap.to(carRef.current, {
        yPercent: 18,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".hero__content", {
        yPercent: -30,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Animated stat counters
      gsap.utils.toArray(".hero__stat-num").forEach((el) => {
        const target = +el.dataset.value;
        const suffix = el.dataset.suffix || "";
        const o = { v: 0 };
        gsap.to(o, {
          v: target,
          duration: 2,
          ease: "power2.out",
          delay: 3.6,
          onUpdate: () => {
            el.textContent = Math.round(o.v) + suffix;
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" className="hero" ref={root}>
      {/* Background car image with overlay (YANGILANDI) */}
      <div className="hero__bg" ref={carRef}>
        <img
          src="https://lh3.googleusercontent.com/gps-cs-s/APNQkAEtY5xjWe_T9UL32yC__HPMA9XFNfFBZBrKdgGibJClc7ASkO_RfCbYNjifpHguH777eH9E080GMrc-rwfy2zR-A-eaH12Qg9hXh-ptDUtoffsf7FXtM98DEIVLaxWL4MCzawMgKT9aw7y6=w408-h544-k-no"
          alt="Premium tuning avtomobili"
          loading="eager"
        />
        <div className="hero__bg-overlay" />
        <div className="hero__grid" />
      </div>

      <div className="hero__content container">
        <span className="hero__eyebrow eyebrow">
          Premium Avto Tuning Studiya
        </span>

        <h1 className="hero__title" ref={titleRef}>
          <span className="hero__line">
            <span>Mashinangizni</span>
          </span>
          <span className="hero__line">
            <span>
              san'at <em className="gradient-text">asariga</em>
            </span>
          </span>
          <span className="hero__line">
            <span>aylantiramiz</span>
          </span>
        </h1>

        <p className="hero__desc">
          Yuqori darajadagi tuning, aerodinamik body-kitlar va virtual garaj
          konfiguratori. Har bir detal — mukammallikka intilish.
        </p>

        <div className="hero__cta-row">
          <a href="#garage" className="btn btn-primary interactive">
            Virtual garajni sinab ko'rish
          </a>
          <a href="#process" className="btn btn-ghost interactive">
            <Play size={16} /> Jarayonni ko'rish
          </a>
        </div>

        <div className="hero__stats">
          {STATS.map((s) => (
            <div className="hero__stat" key={s.label}>
              <div
                className="hero__stat-num gradient-text"
                data-value={s.value}
                data-suffix={s.suffix}
              >
                0{s.suffix}
              </div>
              <div className="hero__stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <a
        href="#process"
        className="hero__scroll interactive"
        aria-label="Pastga"
      >
        <ArrowDown size={18} />
        <span>Aylantiring</span>
      </a>
    </section>
  );
}
