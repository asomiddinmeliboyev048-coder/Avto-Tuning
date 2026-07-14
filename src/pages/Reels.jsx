// Reels — Instagram uslubidagi to'liq ekranli, bittalab (snap-scroll) vertikal feed.
// Faqat admin tasdiqlagan (status=approved) reels ko'rsatiladi.
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  collection, getDocs, query, where,
  doc, updateDoc, increment, arrayUnion, arrayRemove,
  addDoc, orderBy, serverTimestamp,
} from "firebase/firestore";
import {
  Clapperboard, Heart, MessageCircle, Volume2, VolumeX,
  Play, Plus, Send, CornerDownRight, X, Eye,
} from "lucide-react";
import { db } from "../lib/firebase.js";
import { getYoutubeId, youtubeThumb } from "../lib/youtube.js";
import { useAuth } from "../context/AuthContext.jsx";
import VideoUpload from "../components/video/VideoUpload.jsx";
import "./Reels.css";

export default function Reels() {
  const { id: paramId } = useParams();
  const { user } = useAuth();

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [commentsFor, setCommentsFor] = useState(null); // reel id
  const [showUpload, setShowUpload] = useState(false);
  const [burstId, setBurstId] = useState(null); // double-tap yurak animatsiyasi

  const videoRefs = useRef({}); // id -> <video>
  const reelRefs = useRef({});  // id -> section el
  const containerRef = useRef(null);
  const lastTap = useRef(0);
  const tapTimer = useRef(null);

  // Feed ochilganda body scroll'ni bloklaymiz (immersiv ko'rinish uchun)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reels yuklash
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "videos"), where("status", "==", "approved")));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.isAdminPost ? 1 : 0) - (a.isAdminPost ? 1 : 0) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setReels(list);
        setActiveId(paramId && list.some((r) => r.id === paramId) ? paramId : list[0]?.id || null);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [paramId]);

  // Deep-link: /reels/:id bo'lsa o'sha reelga scroll qilamiz
  useEffect(() => {
    if (!loading && paramId && reelRefs.current[paramId]) {
      reelRefs.current[paramId].scrollIntoView();
    }
  }, [loading, paramId]);

  // Qaysi reel ko'rinayotganini kuzatish
  useEffect(() => {
    if (loading || !containerRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            setActiveId(e.target.dataset.reelId);
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] },
    );
    Object.values(reelRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [loading, reels]);

  // Faol reelni ijro etish, qolganini to'xtatish + ko'rish sanash
  useEffect(() => {
    if (!activeId) return;
    setPaused(false);
    Object.entries(videoRefs.current).forEach(([rid, el]) => {
      if (!el) return;
      if (rid === activeId) {
        el.muted = muted;
        el.play?.().catch(() => {});
      } else {
        el.pause?.();
        el.currentTime = 0;
      }
    });
    const key = `viewed-${activeId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      updateDoc(doc(db, "videos", activeId), { views: increment(1) }).catch(() => {});
      setReels((arr) => arr.map((r) => r.id === activeId ? { ...r, views: (r.views || 0) + 1 } : r));
    }
  }, [activeId, muted]);

  const toggleLike = async (reel) => {
    if (!user) return alert("Like bosish uchun tizimga kiring");
    const liked = reel.likes?.includes(user.uid);
    updateDoc(doc(db, "videos", reel.id), { likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) }).catch(() => {});
    setReels((arr) => arr.map((r) => r.id === reel.id
      ? { ...r, likes: liked ? (r.likes || []).filter((u) => u !== user.uid) : [...(r.likes || []), user.uid] }
      : r));
  };

  const togglePlay = (reel) => {
    const el = videoRefs.current[reel.id];
    if (!el) return;
    if (el.paused) { el.play?.().catch(() => {}); setPaused(false); }
    else { el.pause?.(); setPaused(true); }
  };

  // Faqat like qo'shadi (double-tap uchun) — Instagram uslubi
  const addLike = (reel) => {
    if (!user || reel.likes?.includes(user.uid)) return;
    toggleLike(reel);
  };

  // Bosish: 1x -> play/pause (fayl video), 2x -> like + yurak animatsiyasi
  const handleMediaTap = (reel, hasVideo) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double-tap
      clearTimeout(tapTimer.current);
      addLike(reel);
      setBurstId(reel.id);
      setTimeout(() => setBurstId((b) => (b === reel.id ? null : b)), 850);
    } else if (hasVideo) {
      // Single-tap (double bo'lmasligini kutamiz)
      tapTimer.current = setTimeout(() => togglePlay(reel), 280);
    }
    lastTap.current = now;
  };

  if (loading) {
    return (
      <div className="reels reels--center">
        <div className="reels__spinner" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="reels reels--center">
        <div className="reels__empty">
          <Clapperboard size={48} />
          <h2>Hozircha Reels yo'q</h2>
          <p>Birinchi bo'lib o'z videongizni yuklang!</p>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={16} /> Reels yuklash
          </button>
        </div>
        <VideoUpload open={showUpload} onClose={() => setShowUpload(false)} />
      </div>
    );
  }

  return (
    <>
    <div className="reels">
      <div className="reels__feed" ref={containerRef}>
        {reels.map((reel) => {
          const ytId = reel.youtubeURL ? getYoutubeId(reel.youtubeURL) : "";
          const isActive = reel.id === activeId;
          const liked = reel.likes?.includes(user?.uid);
          const poster = reel.thumbnailURL || (ytId ? youtubeThumb(ytId) : "");
          return (
            <section
              key={reel.id}
              className="reel"
              data-reel-id={reel.id}
              ref={(el) => (reelRefs.current[reel.id] = el)}
            >
              {/* Blur fon */}
              {poster && <div className="reel__bg" style={{ backgroundImage: `url(${poster})` }} />}

              {/* Media */}
              <div className="reel__media" onClick={() => handleMediaTap(reel, !ytId && !!reel.videoURL)}>
                {ytId ? (
                  isActive ? (
                    <iframe
                      key={muted ? "m" : "u"}
                      className="reel__yt"
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
                      title={reel.title}
                      allow="autoplay; encrypted-media"
                      frameBorder="0"
                    />
                  ) : (
                    <div className="reel__yt-poster" style={{ backgroundImage: `url(${poster})` }} />
                  )
                ) : reel.videoURL ? (
                  <video
                    ref={(el) => (videoRefs.current[reel.id] = el)}
                    className="reel__vid"
                    src={reel.videoURL}
                    poster={poster || undefined}
                    loop
                    playsInline
                    muted={muted}
                    preload="metadata"
                  />
                ) : (
                  <div className="reel__novid">Video manbasi yo'q</div>
                )}

                {/* Pauza ikonkasi (faqat fayl videolar uchun) */}
                {!ytId && paused && isActive && (
                  <div className="reel__playbtn"><Play size={44} fill="#fff" /></div>
                )}

                {/* Double-tap yurak animatsiyasi */}
                {burstId === reel.id && (
                  <div className="reel__burst"><Heart size={110} fill="#ff3d3d" color="#ff3d3d" /></div>
                )}
              </div>

              {/* Ovoz tugmasi */}
              <button className="reel__mute" onClick={() => setMuted((m) => !m)} aria-label="Ovoz">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              {/* O'ng tomon amallari */}
              <div className="reel__rail">
                <div className="reel__author-av" style={reel.userPhoto ? { backgroundImage: `url(${reel.userPhoto})` } : undefined}>
                  {!reel.userPhoto && (reel.userName || "?")[0]?.toUpperCase()}
                </div>
                <button className={`reel__act ${liked ? "is-on" : ""}`} onClick={() => toggleLike(reel)}>
                  <Heart size={30} fill={liked ? "#ff3d3d" : "none"} />
                  <span>{reel.likes?.length || 0}</span>
                </button>
                <button className="reel__act" onClick={() => setCommentsFor(reel.id)}>
                  <MessageCircle size={30} />
                  <span>Izoh</span>
                </button>
                <div className="reel__act reel__act--views">
                  <Eye size={26} />
                  <span>{reel.views || 0}</span>
                </div>
              </div>

              {/* Pastki matn */}
              <div className="reel__info">
                <p className="reel__name">
                  @{reel.userName || "Foydalanuvchi"}
                  {reel.isAdminPost && <span className="reel__badge">ADMIN</span>}
                </p>
                <p className="reel__title">{reel.title}</p>
              </div>
            </section>
          );
        })}
      </div>

      {/* Yuklash tugmasi (FAB) */}
      <button className="reels__fab" onClick={() => setShowUpload(true)} aria-label="Reels yuklash">
        <Plus size={24} />
      </button>
    </div>

    {commentsFor && (
      <ReelComments videoId={commentsFor} onClose={() => setCommentsFor(null)} />
    )}
    <VideoUpload open={showUpload} onClose={() => setShowUpload(false)} />
    </>
  );
}

/* ---------- Izohlar bottom-sheet ---------- */
function ReelComments({ videoId, onClose }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replies, setReplies] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [replyText, setReplyText] = useState({});

  const loadComments = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, "videos", videoId, "comments"), orderBy("createdAt", "asc")));
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { /* ignore */ }
  }, [videoId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const addComment = async () => {
    if (!user) return alert("Izoh yozish uchun tizimga kiring");
    if (!text.trim()) return;
    await addDoc(collection(db, "videos", videoId, "comments"), {
      userId: user.uid, userName: profile?.name || profile?.displayName || "Foydalanuvchi",
      userPhoto: profile?.photoURL || "", text: text.trim(), likes: [], createdAt: serverTimestamp(),
    });
    setText("");
    loadComments();
  };

  const likeComment = async (c) => {
    if (!user) return alert("Tizimga kiring");
    const has = c.likes?.includes(user.uid);
    updateDoc(doc(db, "videos", videoId, "comments", c.id), { likes: has ? arrayRemove(user.uid) : arrayUnion(user.uid) }).catch(() => {});
    setComments((arr) => arr.map((x) => x.id === c.id ? { ...x, likes: has ? x.likes.filter((u) => u !== user.uid) : [...(x.likes || []), user.uid] } : x));
  };

  const loadReplies = async (cid) => {
    const snap = await getDocs(query(collection(db, "videos", videoId, "comments", cid, "replies"), orderBy("createdAt", "asc")));
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
    await addDoc(collection(db, "videos", videoId, "comments", cid, "replies"), {
      userId: user.uid, userName: profile?.name || profile?.displayName || "Foydalanuvchi",
      userPhoto: profile?.photoURL || "", text: t, likes: [], createdAt: serverTimestamp(),
    });
    setReplyText((r) => ({ ...r, [cid]: "" }));
    loadReplies(cid);
  };
  const likeReply = async (cid, rep) => {
    if (!user) return alert("Tizimga kiring");
    const has = rep.likes?.includes(user.uid);
    updateDoc(doc(db, "videos", videoId, "comments", cid, "replies", rep.id), { likes: has ? arrayRemove(user.uid) : arrayUnion(user.uid) }).catch(() => {});
    setReplies((r) => ({ ...r, [cid]: r[cid].map((x) => x.id === rep.id ? { ...x, likes: has ? x.likes.filter((u) => u !== user.uid) : [...(x.likes || []), user.uid] } : x) }));
  };

  const Avatar = ({ name, photo, small }) => (
    <div className={`rc__av ${small ? "rc__av--sm" : ""}`} style={photo ? { backgroundImage: `url(${photo})` } : undefined}>
      {!photo && (name || "?")[0]?.toUpperCase()}
    </div>
  );

  return (
    <div className="rc" onClick={onClose}>
      <div className="rc__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="rc__grab" />
        <div className="rc__head">
          <h3><MessageCircle size={18} /> Izohlar ({comments.length})</h3>
          <button className="rc__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="rc__list">
          {comments.length === 0 && <p className="rc__empty">Hali izoh yo'q. Birinchi bo'ling!</p>}
          {comments.map((c) => {
            const cliked = c.likes?.includes(user?.uid);
            return (
              <div key={c.id} className="rc__c">
                <Avatar name={c.userName} photo={c.userPhoto} />
                <div className="rc__c-body">
                  <p className="rc__c-name">{c.userName}</p>
                  <p className="rc__c-text">{c.text}</p>
                  <div className="rc__c-actions">
                    <button className={cliked ? "is-on" : ""} onClick={() => likeComment(c)}>
                      <Heart size={13} fill={cliked ? "#ff3d3d" : "none"} /> {c.likes?.length || 0}
                    </button>
                    <button onClick={() => toggleReplies(c.id)}>
                      <CornerDownRight size={13} /> Javob
                    </button>
                  </div>

                  {openReplies[c.id] && (
                    <div className="rc__replies">
                      {(replies[c.id] || []).map((rep) => {
                        const rliked = rep.likes?.includes(user?.uid);
                        return (
                          <div key={rep.id} className="rc__c rc__c--reply">
                            <Avatar name={rep.userName} photo={rep.userPhoto} small />
                            <div className="rc__c-body">
                              <p className="rc__c-name">{rep.userName}</p>
                              <p className="rc__c-text">{rep.text}</p>
                              <div className="rc__c-actions">
                                <button className={rliked ? "is-on" : ""} onClick={() => likeReply(c.id, rep)}>
                                  <Heart size={12} fill={rliked ? "#ff3d3d" : "none"} /> {rep.likes?.length || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="rc__add rc__add--reply">
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

        <div className="rc__add">
          <input
            placeholder={user ? "Izoh yozing..." : "Izoh uchun tizimga kiring"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addComment()}
          />
          <button onClick={addComment}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
