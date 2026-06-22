// Pastki navigatsiya paneli — faqat mobil (< 768px).
import { useLocation, useNavigate } from "react-router-dom";
import { Car, Wrench, Video, Store } from "lucide-react";
import "./BottomNav.css";

const ITEMS = [
  { label: "Garaj", icon: Car, type: "scroll", target: "garage" },
  { label: "Xizmat", icon: Wrench, type: "scroll", target: "booking" },
  { label: "Video", icon: Video, type: "route", target: "/videolar" },
  { label: "Do'kon", icon: Store, type: "route", target: "/dokon" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const go = (it) => {
    if (it.type === "route") {
      navigate(it.target);
    } else if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(it.target)?.scrollIntoView({ behavior: "smooth" }), 140);
    } else {
      document.getElementById(it.target)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isActive = (it) => it.type === "route" && location.pathname.startsWith(it.target);

  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => (
        <button
          key={it.label}
          className={`bottom-nav-item ${isActive(it) ? "active" : ""}`}
          onClick={() => go(it)}
        >
          <it.icon />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
