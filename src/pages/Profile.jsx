// Foydalanuvchi profili — avatar yuklash, ma'lumotlarni tahrirlash.
// (Keyingi bosqichlarda: video yuklash, navbatlar, buyurtmalar shu yerga qo'shiladi.)
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { Camera, LogOut, Save, Loader2 } from "lucide-react";
import { db } from "../lib/firebase.js";
import { uploadFile } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { UZ_CARS } from "../data/content.js";
import "./Profile.css";

export default function Profile() {
  const { user, profile, loading, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: "", phone: "", bio: "", currentCar: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

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
      const { url } = await uploadFile("avatars", file);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      await refreshProfile();
      setMsg("Rasm yangilandi ✅");
    } catch (err) {
      setMsg("Yuklashda xato: " + (err.message || "policy tekshiring"));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: form.name,
        displayName: form.name,
        phone: form.phone,
        bio: form.bio,
        currentCar: form.currentCar,
      });
      await refreshProfile();
      setMsg("Saqlandi ✅");
    } catch (err) {
      setMsg("Xato: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const initial = (form.name || profile.email || "?")[0]?.toUpperCase();

  return (
    <section className="profile section">
      <div className="container profile__wrap">
        <div className="profile__head glass">
          <button
            className="profile__avatar"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
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
            <p>{profile.email}</p>
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
      </div>
    </section>
  );
}
