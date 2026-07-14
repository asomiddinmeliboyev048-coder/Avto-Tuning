// Foydalanuvchi profili — yumaloq avatar (rasm yuklash), ma'lumotlarni tahrirlash.
// Rasm brauzerда siqib (256px) lokal saqlanadi — internetsiz ham ishlaydi.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Save, Loader2, Clapperboard } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { UZ_CARS } from "../data/content.js";
import VideoUpload from "../components/video/VideoUpload.jsx";
import "./Profile.css";

// Rasmni 256x256 ga kesib/siqib dataURL qaytaradi (localStorage'ga sig'ishi uchun).
function compressImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, profile, loading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: "", phone: "", bio: "", currentCar: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || profile.displayName || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        currentCar: profile.currentCar || "",
      });
    }
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="profile__loading">
        <Loader2 className="spin" size={32} />
      </div>
    );
  }

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const dataUrl = await compressImage(file);
      updateProfile({ photoURL: dataUrl });
      setMsg("Rasm yangilandi ✅");
    } catch {
      setMsg("Rasmni o'qib bo'lmadi. Boshqa rasm tanlang.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => {
    setSaving(true);
    setMsg("");
    updateProfile({
      name: form.name,
      displayName: form.name,
      phone: form.phone,
      bio: form.bio,
      currentCar: form.currentCar,
    });
    setTimeout(() => {
      setSaving(false);
      setMsg("Saqlandi ✅");
    }, 250);
  };

  const carName = UZ_CARS.find((c) => c.id === profile.currentCar)?.name;
  const initial = (form.name || "?")[0]?.toUpperCase();

  return (
    <section className="profile section">
      <div className="container profile__wrap">
        <div className="profile__head glass">
          <button
            className="profile__avatar"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Profil rasmini yuklash"
            style={
              profile.photoURL
                ? { backgroundImage: `url(${profile.photoURL})` }
                : undefined
            }
          >
            {!profile.photoURL && <span>{initial}</span>}
            <span className="profile__avatar-cam">
              {uploading ? <Loader2 className="spin" size={16} /> : <Camera size={16} />}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onAvatar}
          />
          <div className="profile__id">
            <h2>{form.name || "Foydalanuvchi"}</h2>
            <p>{profile.phone || "Telefon kiritilmagan"}</p>
            {carName && <span className="profile__car">🚗 {carName}</span>}
            {profile.role === "admin" && <span className="profile__badge">ADMIN</span>}
          </div>
          <button className="profile__logout" onClick={() => { logout(); navigate("/"); }}>
            <LogOut size={16} /> Chiqish
          </button>
        </div>

        <div className="profile__form glass">
          <h3>Ma'lumotlarni tahrirlash</h3>

          <label>Ism</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

          <label>Telefon</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+998 .. ... .. .." />

          <label>Joriy mashina</label>
          <select value={form.currentCar} onChange={(e) => setForm((f) => ({ ...f, currentCar: e.target.value }))}>
            <option value="">— tanlanmagan —</option>
            {UZ_CARS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label>Bio</label>
          <textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="O'zingiz haqingizda qisqacha..." />

          {msg && <p className="profile__msg">{msg}</p>}

          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>

        <div className="profile__form glass">
          <h3>Reels yuklash</h3>
          <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: 16 }}>
            YouTube havolasi yoki galereyadan video qo'shing. Eng yaxshi ko'rinish uchun
            vertikal (9:16) video tavsiya etiladi. Video admin tasdig'idan o'tgach
            “Reels” bo'limida ko'rinadi.
          </p>
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setShowUpload(true)}>
            <Clapperboard size={18} /> Reels yuklash
          </button>
        </div>
      </div>

      <VideoUpload open={showUpload} onClose={() => setShowUpload(false)} />
    </section>
  );
}
