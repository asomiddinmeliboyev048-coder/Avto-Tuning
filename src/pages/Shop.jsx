// Dokon — Firestore 'products' (bo'sh bo'lsa namuna PARTS) + savatga qo'shish.
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ShoppingCart, Plus } from "lucide-react";
import { db } from "../lib/firebase.js";
import { useCart } from "../context/CartContext.jsx";
import { PARTS, formatPrice } from "../data/content.js";
import "./Shop.css";

export default function Shop() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("Hammasi");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "products"))
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list.length ? list : PARTS);
      })
      .catch(() => setProducts(PARTS))
      .finally(() => setLoading(false));
  }, []);

  const cats = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Hammasi", ...set];
  }, [products]);

  const shown = cat === "Hammasi" ? products : products.filter((p) => p.category === cat);

  return (
    <section className="section shop">
      <div className="container">
        <div className="shop__head">
          <span className="eyebrow"><ShoppingCart size={14} /> Dokon</span>
          <h1 className="section-title">Zapchast va <span className="gradient-text">aksessuarlar</span></h1>
          <p className="section-sub">Premium tuning qismlari — savatga qo'shing va buyurtma bering.</p>
        </div>

        <div className="shop__cats">
          {cats.map((c) => (
            <button key={c} className={`shop__cat ${cat === c ? "is-active" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        {loading ? (
          <p className="shop__loading">Yuklanmoqda...</p>
        ) : (
          <div className="shop__grid">
            {shown.map((p) => (
              <div key={p.id} className="shop__card glass">
                <div className="shop__img" style={{ backgroundImage: `url(${p.image || p.imageURL || ""})` }} />
                <div className="shop__body">
                  <span className="shop__cat-tag">{p.category}</span>
                  <p className="shop__name">{p.name}</p>
                  <div className="shop__row">
                    <span className="shop__price">{formatPrice(p.price)}</span>
                    <button className="shop__add" onClick={() => addItem(p)}><Plus size={16} /> Savatga</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
