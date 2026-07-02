import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Process.css";

// 1. Jarayon bosqichlari (videolar bilan)
const PROCESS_STEPS = [
  {
    id: 1,
    tag: "1-Bosqich",
    title: "Chuqur tahlil",
    desc: "Avtomobilning holatini to'liq o'rganib chiqamiz va xohishlaringizni tahlil qilamiz.",
    video: "https://avtotuning.vercel.app/videolar/A4dDeKoNifUoVWr0VPVI.mp4"
  },
  {
    id: 2,
    tag: "2-Bosqich",
    title: "Konsept va vizualizatsiya",
    desc: "Dizayn tayyorlanadi va virtual 3D formatda ko'rsatiladi.",
    video: "https://avtotuning.vercel.app/videolar/re69H2bjk5xRanA0V99C.mp4"
  },
  {
    id: 3,
    tag: "3-Bosqich",
    title: "Premium tuning",
    desc: "Eng sifatli materiallar va professional texnologiyalar bilan ishni boshlaymiz.",
    video: "https://avtotuning.vercel.app/videolar/5XdVEjWXkZU0RMbVLb8Q.mp4"
  }
];

// 2. Oldin / Keyin rasmlari (Rasmlar 'public' papkasida bo'lishi shart)
const BEFORE_AFTER = [
  {
    id: 1,
    title: "Oq SUV Transformatsiyasi",
    before: "/image_5f8d1d.jpg",
    after: "/image_5f8d3a.jpg"
  },
  {
    id: 2,
    title: "Qora G-Wagon Transformatsiyasi",
    before: "/image_5f8d3f.jpg",
    after: "/image_5f8d5b.jpg"
  }
];

function BeforeAfter({ item }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);

  const onMove = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };

  return (
    <div className="ba" ref={ref} onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)} onClick={(e) => onMove(e.clientX)} onTouchMove={(e) => onMove(e.touches[0].clientX)}>
      <img className="ba__img ba__after" src={item.after} alt="Tuningdan keyin" />
      <img className="ba__img ba__before" src={item.before} alt="Tuningdan oldin" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <span className="ba__tag ba__tag--before">OLDIN</span>
      <span className="ba__tag ba__tag--after">KEYIN</span>
      <div className="ba__handle" style={{ left: pos + "%" }}>
        <div className="ba__handle-knob"><span>‹</span><span>›</span></div>
      </div>
      <div className="ba__title">{item.title}</div>
    </div>
  );
}

export default function Process() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.from(".process__head .reveal", { y: 50, opacity: 0, duration: 1, stagger: 0.12, scrollTrigger: { trigger: ".process__head", start: "top 80%" } });

      // Step cards animation
      gsap.utils.toArray(".pstep").forEach((card) => {
        const video = card.querySelector(".pstep__media");
        gsap.fromTo(card, { clipPath: "inset(20% 10% 20% 10% round 28px)", opacity: 0.4 }, { clipPath: "inset(0% 0% 0% 0% round 28px)", opacity: 1, scrollTrigger: { trigger: card, start: "top 85%", end: "top 40%", scrub: 1 } });
        gsap.fromTo(video, { scale: 1.3 }, { scale: 1, scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="process" className="section process" ref={root}>
      <div className="container">
        <div className="process__head">
          <span className="eyebrow reveal">Ish jarayoni</span>
          <h2 className="section-title reveal">Kinematik aniqlik bilan <br /><span className="gradient-text">har bir bosqichda</span></h2>
          <p className="section-sub reveal">Diagnostikadan to yakuniy detallarigacha — har bir qadam professional tarzda bajariladi.</p>
        </div>

        <div className="process__steps">
          {PROCESS_STEPS.map((step) => (
            <article className="pstep" key={step.id}>
              <div className="pstep__media-wrap">
                <video className="pstep__media" autoPlay muted loop playsInline>
                  <source src={step.video} type="video/mp4" />
                </video>
                <div className="pstep__num">0{step.id}</div>
              </div>
              <div className="pstep__body">
                <span className="pstep__tag">{step.tag}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="process__ba-head">
          <h2 className="section-title">Oldin <span className="gradient-text">&</span> Keyin</h2>
        </div>
        <div className="process__ba-grid">
          {BEFORE_AFTER.map((item) => <BeforeAfter key={item.id} item={item} />)}
        </div>
      </div>
    </section>
  );
}
