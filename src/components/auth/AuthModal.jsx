// Kirish / Ro'yxatdan o'tish modal oynasi.
import { useState } from "react";
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import "./AuthModal.css";

export default function AuthModal({ open, onClose }) {
  const { register, login } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    if (!form.email || !form.password)
      return setError("Email va parolni kiriting");
    if (mode === "register" && !form.name)
      return setError("Ismingizni kiriting");
    if (form.password.length < 6)
      return setError("Parol kamida 6 ta belgidan iborat bo'lsin");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      onClose();
    } catch (e) {
      const map = {
        "auth/invalid-credential": "Email yoki parol noto'g'ri",
        "auth/email-already-in-use": "Bu email allaqachon ro'yxatdan o'tgan",
        "auth/invalid-email": "Email noto'g'ri formatda",
      };
      setError(map[e.code] || e.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authm" onClick={onClose}>
      <div className="authm__card" onClick={(e) => e.stopPropagation()}>
        <button className="authm__close" onClick={onClose} aria-label="Yopish">
          <X size={20} />
        </button>

        <div className="authm__head">
          <span className="authm__logo">
            APEX<span>GARAGE</span>
          </span>
          <p className="authm__sub">
            {mode === "login" ? "Hisobingizga kiring" : "Yangi hisob yarating"}
          </p>
        </div>

        <div className="authm__tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Kirish
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        <div className="authm__form">
          {mode === "register" && (
            <>
              <div className="authm__field">
                <User size={17} />
                <input
                  placeholder="Ismingiz"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
              <div className="authm__field">
                <Phone size={17} />
                <input
                  placeholder="Telefon (ixtiyoriy)"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
            </>
          )}

          <div className="authm__field">
            <Mail size={17} />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={set("email")}
            />
          </div>

          <div className="authm__field">
            <Lock size={17} />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Parol"
              value={form.password}
              onChange={set("password")}
            />
            <button
              className="authm__eye"
              onClick={() => setShowPass((v) => !v)}
              type="button"
            >
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && <p className="authm__error">{error}</p>}

          <button
            className="btn btn-primary authm__submit"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? "Iltimos kuting..."
              : mode === "login"
                ? "Kirish"
                : "Ro'yxatdan o'tish"}
          </button>

          <p className="authm__switch">
            {mode === "login" ? "Hisobingiz yo'qmi? " : "Hisobingiz bormi? "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Ro'yxatdan o'ting" : "Kirish"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
