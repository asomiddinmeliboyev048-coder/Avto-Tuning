import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InstagramEmbed } from "react-social-media-embed";
import "./Process.css";

// 1. Instagram videolari ro'yxati
const PROCESS_STEPS = [
  { 
    id: 1, 
    tag: "1-Bosqich", 
    title: "Chuqur tahlil", 
    desc: "Avtomobilning holatini professional darajada diagnostika qilamiz.",
    url: "https://www.instagram.com/reel/DWWUGi8CJjh/" 
  },
  { 
    id: 2, 
    tag: "2-Bosqich", 
    title: "Konsept va vizualizatsiya", 
    desc: "Dizayn va 3D modellashtirish orqali natijani oldindan ko'ramiz.",
    url: "https://www.instagram.com/reel/DSm6-jMCP7n/" 
  },
  { 
    id: 3, 
    tag: "3-Bosqich", 
    title: "Premium tuning", 
    desc: "Eng sifatli materiallar bilan avtomobilga yangi ruh bag'ishlaymiz.",
    url: "https://www.instagram.com/reel/DQwKRP8iNlZ/" 
  }
];

export default function Process() {
  const root = useRef(null);

  useEffect(() => {
    // GSAP animatsiyalarini ishga tushirish
    const ctx = gsap.context(() => {
      gsap.from(".process__head .reveal", { 
        y: 50, 
        opacity: 0, 
        duration: 1, 
        stagger: 0.12, 
        scrollTrigger: { trigger: ".process__head", start: "top 80%" } 
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="process" className="section process" ref={root}>
      <div className="container">
        {/* Sarlavha qismi */}
        <div className="process__head">
          <span className="eyebrow reveal">Ish jarayoni</span>
          <h2 className="section-title reveal">
            Kinematik aniqlik bilan <br />
            <span className="gradient-text">har bir bosqichda</span>
          </h2>
        </div>

        {/* Videolar qismi */}
        <div className="process__steps">
          {PROCESS_STEPS.map((step) => (
            <article className="pstep" key={step.id}>
              <div className="pstep__media-wrap">
                {/* Instagram Videoni o'rnatish */}
                <InstagramEmbed 
                  url={step.url} 
                  width="100%" 
                  height={500}
                />
              </div>
              <div className="pstep__body">
                <span className="pstep__tag">{step.tag}</span>
                <h3 className="pstep__title">{step.title}</h3>
                <p className="pstep__desc">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
