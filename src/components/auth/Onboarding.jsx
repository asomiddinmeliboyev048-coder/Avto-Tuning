// Onboarding — sayt birinchi ochilganda chiqadigan ro'yxatdan o'tish oynasi.
// Ism (majburiy) + Telefon (majburiy) + Joriy mashina (ixtiyoriy).
// "Kirish" bosilганда darhol lokal profil yaratiladi.
import { useState } from "react";
import { User, Phone, Car, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { UZ_CARS } from "../../data/content.js";
import "./Onboarding.css";

export default function Onboarding() {
  const { needsOnboarding, completeOnboarding } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", currentCar: "" });
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);

  if (!needsOnboarding) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    setError("");
    if (!form.name.trim()) return setError("Ismingizni kiriting");
    if (form.name.trim().length < 2) return setError("Ism juda qisqa");
    if (!form.phone.trim()) return setError("Telefon raqamingizni kiriting");
    if (form.phone.replace(/\D/g, "").length < 7)
      return setError("Telefon raqamini to'liq kiriting");
    setClosing(true);
    // kichik animatsiya bilan yopamiz
    setTimeout(() => completeOnboarding(form), 260);
  };

  const onKey = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className={`onb ${closing ? "onb--closing" : ""}`}>
      <div className="onb__bg" aria-hidden="true">
        <span className="onb__glow onb__glow--1" />
        <span className="onb__glow onb__glow--2" />
        <span className="onb__grid" />
      </div>

      <div className="onb__card">
        <div className="onb__brand">
          <span className="onb__logo-mark">APEX</span>
          <span className="onb__logo-dot" />
          <span className="onb__logo-sub">GARAGE</span>
        </div>

        <h1 className="onb__title">
          Xush kelibsiz! <span className="gradient-text">Tanishamizmi?</span>
        </h1>
        <p className="onb__sub">
          Sayt imkoniyatlaridan to'liq foydalanish uchun bir necha ma'lumot
          kiriting — hisobingiz avtomatik yaratiladi.
        </p>

        <div className="onb__form">
          <label className="onb__label">Ism *</label>
          <div className="onb__field">
            <User size={18} />
            <input
              autoFocus
              placeholder="Ismingiz"
              value={form.name}
              onChange={set("name")}
              onKeyDown={onKey}
            />
          </div>

          <label className="onb__label">Telefon raqam *</label>
          <div className="onb__field">
            <Phone size={18} />
            <input
              type="tel"
              placeholder="+998 90 123 45 67"
              value={form.phone}
              onChange={set("phone")}
              onKeyDown={onKey}
            />
          </div>

          <label className="onb__label">
            Joriy mashinangiz <span className="onb__optional">(ixtiyoriy)</span>
          </label>
          <div className="onb__field">
            <Car size={18} />
            <select value={form.currentCar} onChange={set("currentCar")}>
              <option value="">— tanlanmagan —</option>
              {UZ_CARS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="onb__error">{error}</p>}

          <button className="onb__submit" onClick={submit}>
            Kirish <ArrowRight size={18} />
          </button>

          <p className="onb__note">
            <ShieldCheck size={14} /> Ma'lumotlaringiz faqat shu qurilmada
            saqlanadi.
          </p>
        </div>
      </div>
    </div>
  );
}
