// Dokon — Yandex Market uslubidagi mahsulot katalogi.
// Firestore 'products' (bo'sh bo'lsa namuna PARTS) + savatga qo'shish.
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ShoppingCart, Plus, Minus, Star, Search } from "lucide-react";
import { db } from "../lib/firebase.js";
import { useCart } from "../context/CartContext.jsx";
import { PARTS, formatSom, UZS_RATE } from "../data/content.js";
import "./Shop.css";

// Mahsulot id'sidan barqaror (o'zgarmas) reyting va sharh soni — Yandex uslubi ko'rinishi uchun.
function hashOf(id, seed = 31) {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * seed + s.charCodeAt(i)) >>> 0;
  return h;
}
const ratingOf = (id) => (4.3 + (hashOf(id, 31) % 70) / 100).toFixed(1);
const reviewsOf = (id) => 12 + (hashOf(id, 17) % 480);

export default function Shop() {
  const { addItem, items, updateQty } = useCart();
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("Hammasi");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "products"))
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list.length ? list : PARTS.map((p) => ({ ...p, price: p.price * UZS_RATE })));
      })
      .catch(() => setProducts(PARTS.map((p) => ({ ...p, price: p.price * UZS_RATE }))))
      .finally(() => setLoading(false));
  }, []);

  const cats = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Hammasi", ...set];
  }, [products]);

  const shown = useMemo(() => {
    let list = cat === "Hammasi" ? products : products.filter((p) => p.category === cat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [products, cat, search]);

  return (
    <section className="section shop">
      <div className="container">
        <div className="shop__head">
          <span className="eyebrow"><ShoppingCart size={14} /> Dokon</span>
          <h1 className="section-title">Zapchast va <span className="gradient-text">aksessuarlar</span></h1>
          <p className="section-sub">Premium tuning qismlari — savatga qo'shing va buyurtma bering.</p>
        </div>

        <div className="shop__search">
          <Search size={18} />
          <input
            placeholder="Mahsulotlarni qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="shop__cats">
          {cats.map((c) => (
            <button key={c} className={`shop__cat ${cat === c ? "is-active" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        {loading ? (
          <p className="shop__loading">Yuklanmoqda...</p>
        ) : shown.length === 0 ? (
          <p className="shop__loading">Mahsulot topilmadi.</p>
        ) : (
          <div className="shop__grid">
            {shown.map((p) => {
              const inCart = items.find((i) => i.id === p.id);
              const discount = p.oldPrice && p.oldPrice > p.price
                ? Math.round((1 - p.price / p.oldPrice) * 100)
                : 0;
              return (
                <div key={p.id} className="ycard">
                  <div className="ycard__img-wrap">
                    <div
                      className="ycard__img"
                      style={{ backgroundImage: `url(${p.image || p.imageURL || ""})` }}
                    />
                    {discount > 0 && <span className="ycard__discount">-{discount}%</span>}
                  </div>

                  <div className="ycard__body">
                    <div className="ycard__price-row">
                      <span className="ycard__price">{formatSom(p.price)}</span>
                      {discount > 0 && <span className="ycard__oldprice">{formatSom(p.oldPrice)}</span>}
                    </div>

                    <div className="ycard__rating">
                      <Star size={13} fill="#ffb400" color="#ffb400" />
                      <b>{ratingOf(p.id)}</b>
                      <span className="ycard__reviews">· {reviewsOf(p.id)} sharh</span>
                    </div>

                    <p className="ycard__name">{p.name}</p>
                    {p.category && <span className="ycard__cat">{p.category}</span>}

                    {inCart ? (
                      <div className="ycard__stepper">
                        <button onClick={() => updateQty(p.id, inCart.qty - 1)} aria-label="Kamaytirish">
                          <Minus size={17} />
                        </button>
                        <span>{inCart.qty} dona</span>
                        <button onClick={() => updateQty(p.id, inCart.qty + 1)} aria-label="Ko'paytirish">
                          <Plus size={17} />
                        </button>
                      </div>
                    ) : (
                      <button className="ycard__add" onClick={() => addItem(p, false)}>
                        <ShoppingCart size={17} /> Savatga
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
