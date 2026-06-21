// Video yuklash modali — YouTube link YOKI galereyadan fayl + nom (majburiy).
// Yuborilgach status="pending" -> admin tasdiqlagach videolar bo'limida ko'rinadi.
import { useRef, useState } from "react";
import { X, Youtube, UploadCloud, Check } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase.js";
import { uploadFile } from "../../lib/supabase.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getYoutubeId } from "../../lib/youtube.js";
import "./VideoUpload.css";

export default function VideoUpload({ open, onClose }) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("youtube");
  const [title, setTitle] = useState("");
  const [yt, setYt] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  if (!open) return null;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true); setErr("");
    try {
      const { url } = await uploadFile("videos", f);
      setFileUrl(url);
    } catch (e2) {
      setErr("Yuklashda xato: " + (e2.message || "Supabase policy tekshiring"));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!user) { setErr("Avval tizimga kiring"); return; }
    if (!title.trim()) { setErr("Video nomini yozing (majburiy)"); return; }
    if (tab === "youtube" && !getYoutubeId(yt)) { setErr("To'g'ri YouTube havolasini kiriting"); return; }
    if (tab === "file" && !fileUrl) { setErr("Avval video faylni yuklang"); return; }
    setSaving(true); setErr("");
    try {
      await addDoc(collection(db, "videos"), {
        userId: user.uid,
        userName: profile?.name || profile?.displayName || "Foydalanuvchi",
        userPhoto: profile?.photoURL || "",
        title: title.trim(),
        youtubeURL: tab === "youtube" ? yt.trim() : "",
        videoURL: tab === "file" ? fileUrl : "",
        thumbnailURL: "",
        views: 0,
        likes: [],
        status: "pending",
        isAdminPost: profile?.role === "admin",
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch (e3) {
      setErr(e3.message || "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const close = () => { onClose(); setTimeout(() => { setDone(false); setTitle(""); setYt(""); setFileUrl(""); setErr(""); }, 250); };

  return (
    <div className="vu" onClick={close}>
      <div className="vu__card" onClick={(e) => e.stopPropagation()}>
        <button className="vu__close" onClick={close}><X size={20} /></button>
        {done ? (
          <div className="vu__done">
            <div className="vu__done-ic"><Check size={32} /></div>
            <h3>Video yuborildi!</h3>
            <p>Videoingiz <b>admin tekshiruvidan o'tgandan so'nggina</b> videolar bo'limida ko'rinadi. Rahmat!</p>
            <button className="btn btn-primary" onClick={close}>OK</button>
          </div>
        ) : (
          <>
            <h3 className="vu__title">Video yuklash</h3>
            <div className="vu__tabs">
              <button className={tab === "youtube" ? "is-active" : ""} onClick={() => setTab("youtube")}><Youtube size={16} /> YouTube</button>
              <button className={tab === "file" ? "is-active" : ""} onClick={() => setTab("file")}><UploadCloud size={16} /> Fayl</button>
            </div>

            <label className="vu__label">Video nomi *</label>
            <input className="vu__input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: BMW M5 tonirovka jarayoni" />

            {tab === "youtube" ? (
              <>
                <label className="vu__label">YouTube havolasi</label>
                <input className="vu__input" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </>
            ) : (
              <>
                <label className="vu__label">Video fayl</label>
                {fileUrl && <video src={fileUrl} controls className="vu__preview" />}
                <button className="vu__drop" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <UploadCloud size={18} /> {uploading ? "Yuklanmoqda..." : fileUrl ? "Boshqa fayl tanlash" : "Galereyadan tanlash"}
                </button>
                <input ref={fileRef} type="file" accept="video/*" hidden onChange={onFile} />
              </>
            )}

            {err && <p className="vu__err">{err}</p>}
            <button className="btn btn-primary vu__submit" onClick={submit} disabled={saving || uploading}>
              {saving ? "Yuborilmoqda..." : "Yuklash"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
