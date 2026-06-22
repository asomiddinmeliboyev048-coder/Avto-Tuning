// Video detali — YouTube uslubida: ko'rishlar, like, izohlar, javoblar, izohga like.
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove,
  collection, addDoc, getDocs, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { ArrowLeft, Eye, Heart, MessageCircle, Send, CornerDownRight } from "lucide-react";
import { db } from "../lib/firebase.js";
import { getYoutubeId, youtubeEmbed } from "../lib/youtube.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./VideoDetail.css";

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replies, setReplies] = useState({}); // cid -> [replies]
  const [openReplies, setOpenReplies] = useState({});
  const [replyText, setReplyText] = useState({});

  const loadComments = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, "videos", id, "comments"), orderBy("createdAt", "asc")));
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "videos", id));
      if (snap.exists()) {
        setVideo({ id: snap.id, ...snap.data() });
        const key = `viewed-${id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          updateDoc(doc(db, "videos", id), { views: increment(1) }).catch(() => {});
        }
      }
      await loadComments();
      setLoading(false);
    };
    load();
  }, [id, loadComments]);

  const liked = video?.likes?.includes(user?.uid);
  const toggleLike = async () => {
    if (!user) return alert("Like bosish uchun tizimga kiring");
    const ref = doc(db, "videos", id);
    await updateDoc(ref, { likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    setVideo((v) => ({ ...v, likes: liked ? v.likes.filter((u) => u !== user.uid) : [...(v.likes || []), user.uid] }));
  };

  const addComment = async () => {
    if (!user) return alert("Izoh yozish uchun tizimga kiring");
    if (!text.trim()) return;
    await addDoc(collection(db, "videos", id, "comments"), {
      userId: user.uid, userName: profile?.name || profile?.displayName || "Foydalanuvchi",
      userPhoto: profile?.photoURL || "", text: text.trim(), likes: [], createdAt: serverTimestamp(),
    });
    setText("");
    loadComments();
  };

  const likeComment = async (c) => {
    if (!user) return alert("Tizimga kiring");
    const has = c.likes?.includes(user.uid);
    await updateDoc(doc(db, "videos", id, "comments", c.id), { likes: has ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    setComments((arr) => arr.map((x) => x.id === c.id ? { ...x, likes: has ? x.likes.filter((u) => u !== user.uid) : [...(x.likes || []), user.uid] } : x));
  };

  const loadReplies = async (cid) => {
    const snap = await getDocs(query(collection(db, "videos", id, "comments", cid, "replies"), orderBy("createdAt", "asc")));
    setReplies((r) => ({ ...r, [cid]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
  };
  const toggleReplies = (cid) => {
    setOpenReplies((o) => ({ ...o, [cid]: !o[cid] }));
    if (!replies[cid]) loadReplies(cid);
  };
  const addReply = async (cid) => {
    if (!user) return alert("Tizimga kiring");
    const t = (replyText[cid] || "").trim();
    if (!t) return;
    await addDoc(collection(db, "videos", id, "comments", cid, "replies"), {
      userId: user.uid, userName: profile?.name || profile?.displayName || "Foydalanuvchi",
      userPhoto: profile?.photoURL || "", text: t, likes: [], createdAt: serverTimestamp(),
    });
    setReplyText((r) => ({ ...r, [cid]: "" }));
    loadReplies(cid);
  };
  const likeReply = async (cid, rep) => {
    if (!user) return alert("Tizimga kiring");
    const has = rep.likes?.includes(user.uid);
    await updateDoc(doc(db, "videos", id, "comments", cid, "replies", rep.id), { likes: has ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    setReplies((r) => ({ ...r, [cid]: r[cid].map((x) => x.id === rep.id ? { ...x, likes: has ? x.likes.filter((u) => u !== user.uid) : [...(x.likes || []), user.uid] } : x) }));
  };

  if (loading) return <div className="vd__loading">Yuklanmoqda...</div>;
  if (!video) return <div className="vd__loading">Video topilmadi.<button onClick={() => navigate("/videolar")}>Ortga</button></div>;

  const ytId = video.youtubeURL ? getYoutubeId(video.youtubeURL) : "";

  const Avatar = ({ name, photo }) => (
    <div className="vd__av" style={photo ? { backgroundImage: `url(${photo})` } : undefined}>
      {!photo && (name || "?")[0]?.toUpperCase()}
    </div>
  );

  return (
    <section className="section vd">
      <div className="container vd__wrap">
        <button className="vd__back" onClick={() => navigate("/videolar")}><ArrowLeft size={18} /> Videolar</button>

        <div className="vd__player">
          {ytId ? (
            <iframe src={youtubeEmbed(ytId)} title={video.title} allowFullScreen frameBorder="0" />
          ) : video.videoURL ? (
            <video src={video.videoURL} controls playsInline preload="metadata" />
          ) : <div className="vd__novid">Video manbasi yo'q</div>}
        </div>

        <div className="vd__info">
          <h1>{video.title}</h1>
          <div className="vd__stats">
            <span><Eye size={16} /> {video.views || 0} ko'rish</span>
            <button className={`vd__like ${liked ? "is-on" : ""}`} onClick={toggleLike}>
              <Heart size={16} fill={liked ? "#ff3d3d" : "none"} /> {video.likes?.length || 0}
            </button>
            <span className="vd__author">{video.userName || "Foydalanuvchi"}</span>
          </div>
        </div>

        {/* Izohlar */}
        <div className="vd__comments">
          <h3><MessageCircle size={18} /> Izohlar ({comments.length})</h3>

          <div className="vd__addc">
            <Avatar name={profile?.name} photo={profile?.photoURL} />
            <input placeholder={user ? "Izoh yozing..." : "Izoh uchun tizimga kiring"} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} />
            <button onClick={addComment}><Send size={18} /></button>
          </div>

          {comments.map((c) => {
            const cliked = c.likes?.includes(user?.uid);
            return (
              <div key={c.id} className="vd__c">
                <Avatar name={c.userName} photo={c.userPhoto} />
                <div className="vd__c-body">
                  <p className="vd__c-name">{c.userName}</p>
                  <p className="vd__c-text">{c.text}</p>
                  <div className="vd__c-actions">
                    <button className={cliked ? "is-on" : ""} onClick={() => likeComment(c)}>
                      <Heart size={13} fill={cliked ? "#ff3d3d" : "none"} /> {c.likes?.length || 0}
                    </button>
                    <button onClick={() => toggleReplies(c.id)}>
                      <CornerDownRight size={13} /> Javob
                    </button>
                  </div>

                  {openReplies[c.id] && (
                    <div className="vd__replies">
                      {(replies[c.id] || []).map((rep) => {
                        const rliked = rep.likes?.includes(user?.uid);
                        return (
                          <div key={rep.id} className="vd__c vd__c--reply">
                            <Avatar name={rep.userName} photo={rep.userPhoto} />
                            <div className="vd__c-body">
                              <p className="vd__c-name">{rep.userName}</p>
                              <p className="vd__c-text">{rep.text}</p>
                              <div className="vd__c-actions">
                                <button className={rliked ? "is-on" : ""} onClick={() => likeReply(c.id, rep)}>
                                  <Heart size={12} fill={rliked ? "#ff3d3d" : "none"} /> {rep.likes?.length || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="vd__addc vd__addc--reply">
                        <input placeholder="Javob yozing..." value={replyText[c.id] || ""} onChange={(e) => setReplyText((r) => ({ ...r, [c.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addReply(c.id)} />
                        <button onClick={() => addReply(c.id)}><Send size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
