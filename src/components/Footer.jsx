import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Instagram,
  Send,
  Phone,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { NAV_LINKS } from "../data/content.js";
import "./Footer.css";

export default function Footer() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Big marquee word reveal
      gsap.from(".footer__giant span", {
        yPercent: 110,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ".footer__giant", start: "top 90%" },
      });
      gsap.from(".footer__col", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".footer__main", start: "top 85%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="footer" ref={root}>
      {/* CTA banner */}
      <div className="container">
        <div className="footer__cta glass">
          <div>
            <h2 className="footer__cta-title">
              Mashinangizni keyingi <br />
              bosqichga <span className="gradient-text">olib chiqaylik</span>
            </h2>
            <p>
              Bepul konsultatsiya uchun bog'laning — 24 soat ichida javob
              beramiz.
            </p>
          </div>
          <a href="#garage" className="btn btn-primary interactive">
            Loyihani boshlash <ArrowUpRight size={18} />
          </a>
        </div>
      </div>

      {/* Giant brand word */}
      <div className="footer__giant" aria-hidden="true">
        <span>APEX</span>
        <span>GARAGE</span>
      </div>

      <div className="container">
        <div className="footer__main">
          <div className="footer__col footer__col--brand">
            <div className="footer__logo">
              <span className="footer__logo-mark">APEX</span>
              <span className="footer__logo-dot" />
              <span className="footer__logo-sub">GARAGE</span>
            </div>
            <p className="footer__about">
              Premium avto tuning studiyasi. San'at, muhandislik va
              texnologiyani birlashtirib, har bir avtomobilni noyob asarga
              aylantiramiz.
            </p>
            <div className="footer__socials">
              <a
                href="https://instagram.com/avtotuning_jizzax"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social footer__social--ig interactive"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://t.me/jizzaxavtotuning"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social footer__social--tg interactive"
                aria-label="Telegram"
              >
                <Send size={18} />
              </a>
            </div>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Navigatsiya</h4>
            <ul className="footer__links">
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="footer__link interactive">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Xizmatlar</h4>
            <ul className="footer__links">
              <li>
                <a href="#parts" className="footer__link interactive">
                  Body-kit montaj
                </a>
              </li>
              <li>
                <a href="#parts" className="footer__link interactive">
                  Tonirovka
                </a>
              </li>
              <li>
                <a href="#parts" className="footer__link interactive">
                  Disk va shina
                </a>
              </li>
              <li>
                <a href="#parts" className="footer__link interactive">
                  Chip-tuning
                </a>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Aloqa</h4>
            <ul className="footer__contacts">
              <li>
                <a
                  href="tel:+998915929361"
                  className="footer__contact footer__contact--link interactive"
                >
                  <Phone size={16} /> +998 91 592 93 61
                </a>
              </li>
              <li>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=4RVH%2BFRQ%2C+Jizzax%2C+Jizzax+viloyati%2C+%D0%A3%D0%B7%D0%B1%D0%B5%D0%BA%D0%B8%D1%81%D1%82%D0%B0%D0%BD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__contact footer__contact--link interactive"
                >
                  <MapPin size={16} /> 4RVH+FRQ, Jizzax, Jizzax viloyati, Oʻzbekiston
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/avtotuning_jizzax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__contact footer__contact--link interactive"
                >
                  <Instagram size={16} /> @avtotuning_jizzax
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/jizzaxavtotuning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__contact footer__contact--link interactive"
                >
                  <Send size={16} /> Telegram: jizzaxavtotuning
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} APEX Garage. Barcha huquqlar himoyalangan.</span>
          <div className="footer__bottom-links">
            <a href="#" className="interactive">
              Maxfiylik
            </a>
            <a href="#" className="interactive">
              Shartlar
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
