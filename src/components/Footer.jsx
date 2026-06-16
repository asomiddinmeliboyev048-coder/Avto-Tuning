import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Instagram,
  Youtube,
  Send,
  Phone,
  MapPin,
  Mail,
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
                href="#"
                className="footer__social interactive"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="footer__social interactive"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
              <a
                href="#"
                className="footer__social interactive"
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
              <li className="footer__contact">
                <Phone size={16} /> +998 90 123 45 67
              </li>
              <li className="footer__contact">
                <Mail size={16} /> info@apexgarage.uz
              </li>
              <li className="footer__contact">
                <MapPin size={16} /> Toshkent, Yunusobod 4-kvartal
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
