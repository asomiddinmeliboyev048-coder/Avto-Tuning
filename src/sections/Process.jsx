import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROCESS_STEPS, BEFORE_AFTER } from "../data/content.js";
import "./Process.css";

function BeforeAfter({ item }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);

  const onMove = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };

  return (
    <div
      className="ba"
      ref={ref}
      onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
      onClick={(e) => onMove(e.clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      <img
        className="ba__img ba__after"
        src={item.after}
        alt="Tuningdan keyin"
      />
      <img
        className="ba__img ba__before"
        src={item.before}
        alt="Tuningdan oldin"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span className="ba__tag ba__tag--before">OLDIN</span>
      <span className="ba__tag ba__tag--after">KEYIN</span>
      <div className="ba__handle" style={{ left: pos + "%" }}>
        <div className="ba__handle-knob">
          <span>‹</span>
          <span>›</span>
        </div>
      </div>
      <div className="ba__title">{item.title}</div>
    </div>
  );
}

export default function Process() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading reveal
      gsap.from(".process__head .reveal", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".process__head", start: "top 80%" },
      });

      // Cinematic step cards: clip-path reveal + scale video
      gsap.utils.toArray(".pstep").forEach((card, i) => {
        const video = card.querySelector(".pstep__media");
        gsap.fromTo(
          card,
          { clipPath: "inset(20% 10% 20% 10% round 28px)", opacity: 0.4 },
          {
            clipPath: "inset(0% 0% 0% 0% round 28px)",
            opacity: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 40%",
              scrub: 1,
            },
          },
        );
        gsap.fromTo(
          video,
          { scale: 1.3 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
        gsap.from(card.querySelector(".pstep__body"), {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 70%" },
        });
      });

      // Play videos only while in view (performance)
      gsap.utils.toArray(".pstep__media").forEach((v) => {
        ScrollTrigger.create({
          trigger: v,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => v.play?.().catch(() => {}),
          onEnterBack: () => v.play?.().catch(() => {}),
          onLeave: () => v.pause?.(),
          onLeaveBack: () => v.pause?.(),
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="process" className="section process" ref={root}>
      <div className="container">
        <div className="process__head">
          <span className="eyebrow reveal">Ish jarayoni</span>
          <h2 className="section-title reveal">
            Kinematik aniqlik bilan <br />
            <span className="gradient-text">har bir bosqichda</span>
          </h2>
          <p className="section-sub reveal">
            Diagnostikadan to yakuniy detallarigacha — har bir qadam
            professional tarzda hujjatlashtiriladi va sizga real vaqtda
            ko'rsatiladi.
          </p>
        </div>

        <div className="process__steps">
          {PROCESS_STEPS.map((step, i) => (
            <article className="pstep" key={step.id}>
              <div className="pstep__media-wrap">
                <video
                  className="pstep__media"
                  poster={step.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                >
                  <source src={step.video} type="video/mp4" />
                </video>
                <div className="pstep__num">0{step.id}</div>
              </div>
              <div className="pstep__body">
                <span className="pstep__tag">{step.tag}</span>
                <h3 className="pstep__title">{step.title}</h3>
                <p className="pstep__desc">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Before / After showcase */}
        <div className="process__ba-head">
          <span className="eyebrow">Natijalar</span>
          <h2 className="section-title">
            Oldin <span className="gradient-text">&</span> Keyin
          </h2>
          <p className="section-sub">
            Slayderni suring va transformatsiyani o'z ko'zingiz bilan ko'ring.
          </p>
        </div>
        <div className="process__ba-grid">
          {BEFORE_AFTER.map((item) => (
            <BeforeAfter key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
