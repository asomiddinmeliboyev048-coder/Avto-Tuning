import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Process.css";

// Instagram postlari uchun oddiy funksiya
const InstagramVideo = ({ url }) => {
  // Instagram URL'ni embed formatiga o'tkazish
  const embedUrl = `${url.split('?')[0]}embed/`;
  
  return (
    <iframe
      src={embedUrl}
      width="100%"
      height="450px"
      frameBorder="0"
      scrolling="no"
      allowtransparency="true"
      title="Instagram Video"
    ></iframe>
  );
};

export default function Process() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Sarlavha animatsiyasi
      gsap.from(".process__head .reveal", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: { trigger: ".process__head", start: "top 80%" }
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
        </div>

        <div className="process__steps">
          {/* 1-Bosqich */}
          <article className="pstep">
            <div className="pstep__media-wrap">
              <InstagramVideo url="https://www.instagram.com/reel/DWWUGi8CJjh/" />
            </div>
            <div className="pstep__body">
              <span className="pstep__tag">1-Bosqich</span>
              <h3 className="pstep__title">Chuqur tahlil</h3>
              <p className="pstep__desc">Avtomobilning holatini professional darajada diagnostika qilamiz.</p>
            </div>
          </article>

          {/* 2-Bosqich */}
          <article className="pstep">
            <div className="pstep__media-wrap">
              <InstagramVideo url="https://www.instagram.com/reel/DV1dzf4CNN0/" />
            </div>
            <div className="pstep__body">
              <span className="pstep__tag">2-Bosqich</span>
              <h3 className="pstep__title">Konsept va vizualizatsiya</h3>
              <p className="pstep__desc">Dizayn va 3D modellashtirish orqali natijani oldindan ko'ramiz.</p>
            </div>
          </article>

          {/* 3-Bosqich */}
          <article className="pstep">
            <div className="pstep__media-wrap">
              <InstagramVideo url="https://www.instagram.com/reel/DVtywlKiF_w/" />
            </div>
            <div className="pstep__body">
              <span className="pstep__tag">3-Bosqich</span>
              <h3 className="pstep__title">Premium tuning</h3>
              <p className="pstep__desc">Eng sifatli materiallar bilan avtomobilga yangi ruh bag'ishlaymiz.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
