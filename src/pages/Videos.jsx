// Videolar ro'yxati — faqat admin tasdiqlagan (status=approved) videolar.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Video as VideoIcon, Eye, Heart, Upload, PlayCircle } from "lucide-react";
import { db } from "../lib/firebase.js";
import { getYoutubeId, youtubeThumb } from "../lib/youtube.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Videos.css";

export default function Videos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "videos"), where("status", "==", "approved")));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // admin postlari birinchi, keyin yangilari
        list.sort((a, b) => (b.isAdminPost ? 1 : 0) - (a.isAdminPost ? 1 : 0) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setVideos(list);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const thumbOf = (v) => v.thumbnailURL || (v.youtubeURL ? youtubeThumb(getYoutubeId(v.youtubeURL)) : "");

  return (
    <section className="section videos">
      <div className="container">
        <div className="videos__head">
          <div>
            <span className="eyebrow"><VideoIcon size={14} /> Videolar</span>
            <h1 className="section-title">Hamjamiyat <span className="gradient-text">videolari</span></h1>
            <p className="section-sub">Foydalanuvchilar va ustaxonadan tuning videolari.</p>
          </div>
          <button className="btn btn-primary videos__upload" onClick={() => navigate(user ? "/profile" : "/profile")}>
            <Upload size={16} /> Video yuklash
          </button>
        </div>

        {loading ? (
          <p className="videos__empty">Yuklanmoqda...</p>
        ) : videos.length === 0 ? (
          <p className="videos__empty">Hozircha video yo'q. Birinchi bo'lib yuklang! (Profil → Video yuklash)</p>
        ) : (
          <div className="videos__grid">
            {videos.map((v) => (
              <button key={v.id} className="vcard" onClick={() => navigate(`/videolar/${v.id}`)}>
                <div className="vcard__thumb" style={{ backgroundImage: `url(${thumbOf(v)})` }}>
                  <PlayCircle size={40} className="vcard__play" />
                  {v.isAdminPost && <span className="vcard__badge">ADMIN</span>}
                </div>
                <div className="vcard__body">
                  <p className="vcard__title">{v.title}</p>
                  <div className="vcard__meta">
                    <span><Eye size={13} /> {v.views || 0}</span>
                    <span><Heart size={13} /> {v.likes?.length || 0}</span>
                    <span className="vcard__author">{v.userName || "Foydalanuvchi"}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
