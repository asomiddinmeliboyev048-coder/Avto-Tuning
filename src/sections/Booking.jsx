// Navbat olish — "Mashinamni tamirlamoqchiman". Login talab qilinadi.
// Yuborilgan so'rov Firestore 'bookings' ga tushadi (admin ko'radi).
import { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Wrench, Check, Phone, MapPin, Clock } from "lucide-react";
import { db } from "../lib/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { UZ_CARS } from "../data/content.js";
import "./Booking.css";

const SERVICES = [
  "Tonirovka", "Body-kit montaj", "Disk & shina", "Chip-tuning",
  "Polirovka / Keramika", "Sport vyxlop", "Salon kimyoviy tozalash", "Boshqa",
];

export default function Booking() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", service: SERVICES[0], car: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        name: f.name || profile.name || profile.displayName || "",
        phone: f.phone || profile.phone || "",
        car: f.car || profile.currentCar || "",
      }));
    }
  }, [profile]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!user) { setErr("Navbat olish uchun avval tizimga kiring (yuqoridagi “Kirish” tugmasi)."); return; }
    if (!form.name || !form.phone) { setErr("Ism va telefon raqamini kiriting."); return; }
    setLoading(true); setErr("");
    try {
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        name: form.name,
        phone: form.phone,
        service: form.service,
        car: form.car,
        note: form.note,
        email: profile?.email || user.email || "",
        status: "new",
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch (e) {
      setErr(e.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="section booking">
      <div className="container booking__wrap">
        <div className="booking__left">
          <span className="eyebrow"><Wrench size={14} /> Navbat olish</span>
          <h2 className="section-title">Mashinangizni <span className="gradient-text">tamirlashga</span> yozdiring</h2>
          <p className="section-sub">
            So'rov qoldiring — admin tez orada qo'ng'iroq qilib navbatingizni
            belgilaydi. Ustaxonamiz manzili pastda ko'rsatilgan.
          </p>
          <div className="booking__contacts">
            <span><Phone size={16} /> +998 90 000 00 00</span>
            <span><MapPin size={16} /> Toshkent sh., Chilonzor t., 1-uy</span>
            <span><Clock size={16} /> Har kuni 09:00 – 20:00</span>
          </div>
        </div>

        <div className="booking__card glass">
          {done ? (
            <div className="booking__done">
              <div className="booking__done-ic"><Check size={34} /></div>
              <h3>So'rovingiz qabul qilindi!</h3>
              <p>Admin tez orada siz bilan bog'lanib, navbatingizni belgilaydi. Rahmat! 🙌</p>
              <button className="btn btn-primary" onClick={() => setDone(false)}>Yana so'rov</button>
            </div>
          ) : (
            <>
              <h3 className="booking__title">So'rov shakli</h3>
              <div className="booking__field"><label>Ism</label><input value={form.name} onChange={set("name")} placeholder="To'liq ism" /></div>
              <div className="booking__field"><label>Telefon</label><input value={form.phone} onChange={set("phone")} placeholder="+998 .. ... .. .." /></div>
              <div className="booking__field">
                <label>Xizmat turi</label>
                <select value={form.service} onChange={set("service")}>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="booking__field">
                <label>Joriy mashina</label>
                <select value={form.car} onChange={set("car")}>
                  <option value="">— tanlang —</option>
                  {UZ_CARS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="boshqa">Boshqa</option>
                </select>
              </div>
              <div className="booking__field"><label>Izoh (ixtiyoriy)</label><textarea rows={2} value={form.note} onChange={set("note")} placeholder="Qo'shimcha ma'lumot..." /></div>
              {err && <p className="booking__err">{err}</p>}
              <button className="btn btn-primary booking__submit" onClick={submit} disabled={loading}>
                {loading ? "Yuborilmoqda..." : "Navbat olish"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
