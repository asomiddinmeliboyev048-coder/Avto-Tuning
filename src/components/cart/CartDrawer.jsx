// Savat paneli (o'ngdan chiqadi) + buyurtma berish (Firestore orders).
import { useState } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, Check } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase.js";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatSom } from "../../data/content.js";
import "./CartDrawer.css";

export default function CartDrawer() {
  const { items, removeItem, updateQty, clear, total, count, open, setOpen } = useCart();
  const { user, profile } = useAuth();
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const startCheckout = () => {
    if (!user) { setErr("Buyurtma berish uchun avval tizimga kiring"); return; }
    setErr("");
    setForm({ name: profile?.name || profile?.displayName || "", phone: profile?.phone || "" });
    setCheckout(true);
  };

  const submit = async () => {
    if (!form.name || !form.phone) { setErr("Ism va telefonni kiriting"); return; }
    setLoading(true); setErr("");
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        name: form.name,
        phone: form.phone,
        email: profile?.email || user.email || "",
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total,
        status: "new",
        createdAt: serverTimestamp(),
      });
      clear(); setDone(true); setCheckout(false);
    } catch (e) {
      setErr(e.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  const close = () => { setOpen(false); setTimeout(() => { setCheckout(false); setDone(false); setErr(""); }, 300); };

  return (
    <>
      <div className={`cart__scrim ${open ? "is-open" : ""}`} onClick={close} />
      <aside className={`cart ${open ? "is-open" : ""}`}>
        <div className="cart__head">
          <h3><ShoppingBag size={18} /> Savat {count > 0 && <span>({count})</span>}</h3>
          <button onClick={close}><X size={20} /></button>
        </div>

        {done ? (
          <div className="cart__done">
            <div className="cart__done-ic"><Check size={34} /></div>
            <h4>Buyurtma qabul qilindi!</h4>
            <p>Admin tez orada siz bilan bog'lanadi.</p>
            <button className="cart__checkout" onClick={close}>Yopish</button>
          </div>
        ) : items.length === 0 ? (
          <div className="cart__empty"><ShoppingBag size={40} /><p>Savat bo'sh</p></div>
        ) : (
          <>
            <div className="cart__items">
              {items.map((i) => (
                <div key={i.id} className="cart__item">
                  <div className="cart__thumb" style={i.image ? { backgroundImage: `url(${i.image})` } : undefined} />
                  <div className="cart__info">
                    <p className="cart__name">{i.name}</p>
                    <p className="cart__price">{formatSom(i.price)}</p>
                    <div className="cart__qty">
                      <button onClick={() => updateQty(i.id, i.qty - 1)}><Minus size={13} /></button>
                      <span>{i.qty}</span>
                      <button onClick={() => updateQty(i.id, i.qty + 1)}><Plus size={13} /></button>
                    </div>
                  </div>
                  <button className="cart__del" onClick={() => removeItem(i.id)}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>

            {checkout ? (
              <div className="cart__checkout-form">
                <input placeholder="Ism" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <input placeholder="Telefon (+998...)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                {err && <p className="cart__err">{err}</p>}
                <button className="cart__checkout" onClick={submit} disabled={loading}>
                  {loading ? "Yuborilmoqda..." : `Tasdiqlash · ${formatSom(total)}`}
                </button>
                <button className="cart__back" onClick={() => setCheckout(false)}>Ortga</button>
              </div>
            ) : (
              <div className="cart__foot">
                <div className="cart__total"><span>Jami</span><strong>{formatSom(total)}</strong></div>
                {err && <p className="cart__err">{err}</p>}
                <button className="cart__checkout" onClick={startCheckout}>Buyurtma berish</button>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
