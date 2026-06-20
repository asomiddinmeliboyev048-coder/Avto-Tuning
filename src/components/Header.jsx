import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import gsap from "gsap";
import { Sun, Moon, Menu, X, User } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { NAV_LINKS } from "../data/content.js";
import AuthModal from "./auth/AuthModal.jsx";
import "./Header.css";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [active, setActive] = useState("hero");
  const headerRef = useRef(null);
  const navItemsRef = useRef([]);

  // Intro reveal animation
  useEffect(() => {
    const tl = gsap.timeline({ delay: 2.9 });
    tl.from(headerRef.current, {
      yPercent: -120,
      duration: 1,
      ease: "power4.out",
    }).from(
      navItemsRef.current,
      { y: -20, opacity: 0, stagger: 0.06, duration: 0.6, ease: "power3.out" },
      "-=0.5",
    );
    return () => tl.kill();
  }, []);

  // Scroll state + active section spy
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    NAV_LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [location.pathname]);

  // Route-aware navigatsiya: boshqa sahifadan bo'limga o'tish
  const go = (id) => {
    setMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const initial = (profile?.name || profile?.email || "?")[0]?.toUpperCase();

  return (
    <>
      <header
        ref={headerRef}
        className={`header ${scrolled ? "header--scrolled" : ""}`}
      >
        <div className="header__inner container">
          <button className="header__logo interactive" onClick={() => go("hero")}>
            <span className="header__logo-mark">APEX</span>
            <span className="header__logo-dot" />
            <span className="header__logo-sub">GARAGE</span>
          </button>

          <nav className="header__nav">
            {NAV_LINKS.map((link, i) => (
              <button
                key={link.id}
                ref={(el) => (navItemsRef.current[i] = el)}
                className={`header__link interactive ${
                  active === link.id ? "header__link--active" : ""
                }`}
                onClick={() => go(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="header__actions">
            <button
              className="header__theme interactive"
              onClick={toggleTheme}
              aria-label="Mavzuni almashtirish"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <button
                className="header__profile interactive"
                onClick={() => navigate("/profile")}
                aria-label="Profil"
                style={
                  profile?.photoURL
                    ? { backgroundImage: `url(${profile.photoURL})` }
                    : undefined
                }
              >
                {!profile?.photoURL && <span>{initial}</span>}
              </button>
            ) : (
              <button
                className="btn btn-primary header__cta"
                onClick={() => setAuthOpen(true)}
              >
                Kirish
              </button>
            )}

            <button
              className="header__burger interactive"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menyu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`header__mobile ${menuOpen ? "header__mobile--open" : ""}`}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              className="header__mobile-link"
              onClick={() => go(link.id)}
            >
              {link.label}
            </button>
          ))}
          {user ? (
            <button
              className="header__mobile-link"
              onClick={() => { setMenuOpen(false); navigate("/profile"); }}
            >
              <User size={16} style={{ marginRight: 8, verticalAlign: "-3px" }} />
              Profilim
            </button>
          ) : (
            <button
              className="header__mobile-link"
              onClick={() => { setMenuOpen(false); setAuthOpen(true); }}
            >
              Kirish / Ro'yxatdan o'tish
            </button>
          )}
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
