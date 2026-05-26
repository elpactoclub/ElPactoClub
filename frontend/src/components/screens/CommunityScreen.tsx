"use client";

import { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { useShare } from "@/hooks/useShare";
import StoryViewer from "@/components/community/StoryViewer";

// ==========================================
// FEED TAB
// ==========================================
const CREATOR_PHOTOS: Record<string, string> = {
  "Herson":         "/imagenes/herson.jpg",
  "Violeta Verano": "/imagenes/violeta.jpg",
  "Elvis Ude":      "/imagenes/elvis.jpg",
};

const CREATOR_COLOR: Record<string, string> = {
  "Herson":         "#22C55E",
  "Violeta Verano": "#F472B6",
  "Elvis Ude":      "#A78BFA",
};

interface ApiPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  type: string;
  content: string;
  pollOptions?: string[];
  pollVotes?: Record<string, number>;
  likesCount: number;
  createdAt: string;
  isOnline?: boolean;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Ahora";
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

function PostAvatar({ name, role, size = 44 }: { name: string; role: string; size?: number }) {
  const photo = CREATOR_PHOTOS[name];
  const color = CREATOR_COLOR[name] ?? (role === "creator" ? "#A78BFA" : "#888");
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, flexShrink: 0 }}>
      {name[0]}
    </div>
  );
}

function FeedTab() {
  const { showToast, openPostModal } = useUIStore();
  const { avatar, liked, toggleLike, isAuthenticated, role, name: myName } = useUserStore();
  const { sharePost } = useShare();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollVoted, setPollVoted] = useState<Record<string, string>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [storyName, setStoryName] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<ApiPost | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("ep_viewed_stories");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const openStory = (name: string) => {
    setStoryName(name);
    const updated = new Set(viewedStories).add(name);
    setViewedStories(updated);
    localStorage.setItem("ep_viewed_stories", JSON.stringify([...updated]));
  };

  useEffect(() => {
    api.get("/community/posts")
      .then((r) => setPosts(r.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) { showToast("Inicia sesión para reaccionar ⚡"); return; }
    const wasLiked = !!liked[postId];
    const delta = wasLiked ? -1 : 1;
    toggleLike(postId);
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : {
      ...p, likesCount: Math.max(0, p.likesCount + delta),
    }));
    setDetailPost((prev) => prev?.id === postId ? { ...prev, likesCount: Math.max(0, prev.likesCount + delta) } : prev);
    try { await api.post(`/community/posts/${postId}/like`); } catch {}
  };

  const handlePollVote = async (postId: string, option: string) => {
    if (pollVoted[postId]) { showToast("Ya votaste en esta encuesta"); return; }
    if (!isAuthenticated) { showToast("Inicia sesión para votar ⚡"); return; }
    setPollVoted((p) => ({ ...p, [postId]: option }));
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : {
      ...p, pollVotes: { ...p.pollVotes, [option]: (p.pollVotes?.[option] ?? 0) + 1 },
    }));
    try { await api.post(`/community/posts/${postId}/vote`, { option }); } catch {}
    showToast(`Votaste: ${option} ✓`);
  };

  const handleDelete = async (postId: string) => {
    setMenuOpenId(null);
    try {
      await api.delete(`/community/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast("Post eliminado ✓");
    } catch {
      showToast("No se pudo eliminar ❌");
    }
  };

  const canDelete = (post: ApiPost) => {
    if (!isAuthenticated) return false;
    if (role === "admin") return true;
    if (role === "creator" && post.authorRole !== "admin") return true;
    if (post.authorName === myName) return true;
    return false;
  };

  return (
    <div className="community-feed" style={{ display: "flex", flexDirection: "column" }}>
      {storyName && <StoryViewer initialName={storyName} onClose={() => setStoryName(null)} />}

      {/* Post detail modal */}
      {detailPost && (() => {
        const p = detailPost;
        const pollTotal = p.pollVotes ? Object.values(p.pollVotes).reduce((a, b) => a + b, 0) : 0;
        const isLiked = liked[p.id];
        const isCreator = p.authorRole === "creator";
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
            onClick={(e) => e.target === e.currentTarget && setDetailPost(null)}
          >
            <div style={{ background: "#1c1c1c", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "#1c1c1c", zIndex: 1 }}>
                <PostAvatar name={p.authorName} role={p.authorRole} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{p.authorName}</span>
                    {isCreator && <span style={{ fontSize: 8, fontWeight: 900, background: "#F0E040", color: "#000", padding: "2px 6px", borderRadius: 4 }}>CREADOR</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{timeAgo(p.createdAt)}</div>
                </div>
                <button onClick={() => setDetailPost(null)} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              {/* Content */}
              <div style={{ padding: "16px", fontSize: 16, lineHeight: 1.6, color: "#fff" }}>{p.content}</div>
              {/* Poll */}
              {p.type === "poll" && p.pollOptions && (
                <div style={{ margin: "0 16px 12px", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {p.pollOptions.map((opt) => {
                    const votes = p.pollVotes?.[opt] ?? 0;
                    const pct = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                    const isVoted = pollVoted[p.id] === opt;
                    const showPct = !!pollVoted[p.id];
                    return (
                      <button key={opt} onClick={() => handlePollVote(p.id, opt)} style={{ width: "100%", padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", position: "relative", overflow: "hidden", textAlign: "left" }}>
                        {showPct && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: isVoted ? "rgba(240,224,64,0.12)" : "rgba(255,255,255,0.04)", width: `${pct}%`, transition: "width 0.4s ease" }} />}
                        <span style={{ fontSize: 13, fontWeight: isVoted ? 700 : 400, color: isVoted ? "var(--color-accent)" : "#ddd", position: "relative", zIndex: 1 }}>{isVoted ? "✓ " : ""}{opt}</span>
                        {showPct && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-muted)", position: "relative", zIndex: 1 }}>{pct}%</span>}
                      </button>
                    );
                  })}
                  <div style={{ padding: "10px 16px", fontSize: 11, color: "var(--color-muted)" }}>📊 {pollTotal.toLocaleString("es")} votos</div>
                </div>
              )}
              {/* Actions */}
              <div style={{ display: "flex", gap: 18, padding: "8px 16px 20px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => handleLike(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
                  {isLiked ? "❤️" : "🤍"} <span>{p.likesCount}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stories — solo creadores reales */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="hide-scrollbar">
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer" }}
          onClick={openPostModal}
        >
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#1e1e1e", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#aaa" }}>+</div>
          <span style={{ fontSize: 10, color: "var(--color-muted)", fontWeight: 500 }}>Tu story</span>
        </div>
        {[
          { name: "Herson",  photo: "/imagenes/herson.jpg",  hasNew: true  },
          { name: "Violeta", photo: "/imagenes/violeta.jpg", hasNew: true  },
          { name: "Elvis",   photo: "/imagenes/elvis.jpg",   hasNew: false },
        ].map((s) => {
          const viewed = viewedStories.has(s.name);
          const showRing = s.hasNew && !viewed;
          return (
            <div
              key={s.name}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer", position: "relative" }}
              onClick={() => openStory(s.name)}
            >
              <div style={{ padding: 3, borderRadius: "50%", background: showRing ? "linear-gradient(135deg,#F0E040,#FF6B1A)" : "rgba(255,255,255,0.1)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.photo} alt={s.name} style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid #111" }} />
              </div>
              {showRing && <div style={{ position: "absolute", top: 0, right: -2, background: "#F0E040", color: "#000", fontSize: 7, fontWeight: 900, padding: "2px 4px", borderRadius: 4, border: "2px solid #111" }}>NEW</div>}
              <span style={{ fontSize: 10, color: viewed ? "#555" : "var(--color-muted)", fontWeight: 500 }}>{s.name}</span>
            </div>
          );
        })}
      </div>

      {/* Post input */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
        onClick={openPostModal}
      >
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{avatar}</div>
        <div style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "9px 16px", fontSize: 13, color: "var(--color-muted)" }}>
          ¿Qué está pasando en El Pacto?
        </div>
        <span style={{ fontSize: 18 }}>📸</span>
        <span style={{ fontSize: 18 }}>📊</span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: "32px", textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>
          Cargando feed... ⚡
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div style={{ padding: "48px 24px", textAlign: "center", color: "#444" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏀</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#666", marginBottom: 6 }}>El feed está vacío</div>
          <div style={{ fontSize: 12, color: "#444" }}>Los creadores publicarán contenido pronto</div>
        </div>
      )}

      {/* Posts */}
      {posts.map((post) => {
        const isCreator = post.authorRole === "creator";
        const isSocio   = post.authorRole === "socio";
        const pollTotal = post.pollVotes ? Object.values(post.pollVotes).reduce((a, b) => a + b, 0) : 0;
        const isLiked   = liked[post.id];

        return (
          <div key={post.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", borderLeft: `3px solid ${isCreator ? "var(--color-accent)" : "transparent"}` }}>
            {/* Author row */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 16px 10px" }}>
              <PostAvatar name={post.authorName} role={post.authorRole} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{post.authorName}</span>
                  {isCreator && <span style={{ fontSize: 8, fontWeight: 900, background: "#F0E040", color: "#000", padding: "2px 6px", borderRadius: 4 }}>CREADOR</span>}
                  {isSocio   && <span style={{ fontSize: 8, fontWeight: 900, background: "rgba(255,255,255,0.1)", color: "#aaa", padding: "2px 6px", borderRadius: 4 }}>SOCIO</span>}
                  {post.isOnline && <span style={{ fontSize: 10, color: "var(--color-green)", fontWeight: 600 }}>● online</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  {timeAgo(post.createdAt)}
                  {post.type === "poll"      && <span> · 📊 Encuesta</span>}
                  {post.type === "challenge" && <span> · 🏆 Reto</span>}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)}
                  style={{ background: "transparent", border: "none", color: "var(--color-muted)", cursor: "pointer", fontSize: 18, padding: "0 8px", lineHeight: 1 }}
                >···</button>
                {menuOpenId === post.id && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setMenuOpenId(null)} />
                    <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, background: "#252525", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, minWidth: 160, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                      <button
                        onClick={async () => {
                          setMenuOpenId(null);
                          const result = await sharePost(post.id, post.content.substring(0, 100));
                          showToast(result.copied ? "Link copiado ✓" : "Error al copiar");
                        }}
                        style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", color: "#fff", fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                      >↗ Compartir</button>
                      {canDelete(post) && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", color: "#ef4444", fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                        >🗑 Eliminar post</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content — clickable to open detail */}
            <div
              onClick={() => setDetailPost(post)}
              style={{ padding: "0 16px 12px", fontSize: 14, lineHeight: 1.55, cursor: "pointer" }}
            >{post.content}</div>

            {/* Poll */}
            {post.type === "poll" && post.pollOptions && (
              <div style={{ margin: "0 16px 12px", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                {post.pollOptions.map((opt) => {
                  const votes   = post.pollVotes?.[opt] ?? 0;
                  const pct     = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                  const isVoted = pollVoted[post.id] === opt;
                  const showPct = !!pollVoted[post.id];
                  return (
                    <button
                      key={opt}
                      onClick={() => handlePollVote(post.id, opt)}
                      style={{ width: "100%", padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", position: "relative", overflow: "hidden", textAlign: "left" }}
                    >
                      {showPct && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: isVoted ? "rgba(240,224,64,0.12)" : "rgba(255,255,255,0.04)", width: `${pct}%`, transition: "width 0.4s ease" }} />}
                      <span style={{ fontSize: 13, fontWeight: isVoted ? 700 : 400, color: isVoted ? "var(--color-accent)" : "#ddd", position: "relative", zIndex: 1 }}>{isVoted ? "✓ " : ""}{opt}</span>
                      {showPct && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-muted)", position: "relative", zIndex: 1 }}>{pct}%</span>}
                    </button>
                  );
                })}
                <div style={{ padding: "10px 16px", fontSize: 11, color: "var(--color-muted)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  📊 {pollTotal.toLocaleString("es")} votos
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 18, padding: "6px 16px 16px", alignItems: "center" }}>
              <button
                onClick={() => handleLike(post.id)}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
              >
                {isLiked ? "❤️" : "🤍"} <span>{post.likesCount}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// CHAT TAB
// ==========================================
const CHANNELS = [
  { id: "general"      as const, label: "#General"           },
  { id: "noticias"     as const, label: "#MVP'S TOUR 3x3-BCN"},
  { id: "predicciones" as const, label: "#Predicciones"      },
  { id: "retos"        as const, label: "#Retos"             },
];
type Channel = typeof CHANNELS[number]["id"];

interface ChatMsg {
  id: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  createdAt: string;
}

const AUTHOR_COLORS: Record<string, string> = {
  "Herson":         "#22C55E",
  "Violeta Verano": "#F472B6",
  "Elvis Ude":      "#A78BFA",
};

function getAuthorColor(name: string | undefined, role: string) {
  if (name && AUTHOR_COLORS[name]) return AUTHOR_COLORS[name];
  if (role === "creator") return "#A78BFA";
  const palette = ["#60A5FA", "#F59E0B", "#EC4899", "#34D399", "#F97316"];
  const seed = name ? name.charCodeAt(0) : 0;
  return palette[seed % palette.length];
}

function ChatTab() {
  const { addXP, name: myName, isAuthenticated } = useUserStore();
  const { showToast } = useUIStore();
  const [activeChannel, setActiveChannel] = useState<Channel>("general");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = (channel: Channel) => {
    setLoading(true);
    api.get(`/community/messages?channel=${channel}`)
      .then((r) => setMessages(r.data))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(activeChannel); }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!isAuthenticated) { showToast("Inicia sesión para chatear ⚡"); return; }
    setInput("");
    const optimistic: ChatMsg = {
      id: Date.now().toString(),
      content: trimmed,
      authorName: myName,
      authorAvatar: myName[0] ?? "?",
      authorRole: "fan",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await api.post("/community/messages", { content: trimmed, channel: activeChannel });
      addXP(1);
      const r = await api.get(`/community/messages?channel=${activeChannel}`);
      setMessages(r.data);
    } catch { addXP(1); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Channel tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }} className="hide-scrollbar">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id)}
            style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-body)", background: activeChannel === ch.id ? "#fff" : "transparent", color: activeChannel === ch.id ? "#000" : "var(--color-muted)", border: activeChannel === ch.id ? "none" : "1px solid rgba(255,255,255,0.15)" }}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* Quick reactions */}
      <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto", flexShrink: 0 }} className="hide-scrollbar">
        {["🔥", "🏀", "⚡", "🍊", "💪", "🎉", "❤️"].map((e) => (
          <button key={e} onClick={() => sendChat(e)} style={{ flexShrink: 0, fontSize: 18, width: 42, height: 42, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "#1a1a1a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{e}</button>
        ))}
      </div>

      {/* Messages — scrollable area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {loading && (
          <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>Cargando... ⚡</div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>Nadie ha escrito todavía</div>
            <div style={{ fontSize: 11, color: "#3a3a3a" }}>¡Sé el primero en escribir en {activeChannel}!</div>
          </div>
        )}

        {messages.map((m, i) => {
          const isCreator = m.authorRole === "creator";
          const color = getAuthorColor(m.authorName, m.authorRole);
          const photo = CREATOR_PHOTOS[m.authorName];
          return (
            <div key={m.id || i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0" }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={m.authorName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: color + "22", color, border: `1.5px solid ${color}33` }}>
                  {m.authorAvatar || m.authorName?.[0] || "?"}
                </div>
              )}
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "10px 14px", ...(isCreator ? { borderLeft: `2px solid ${color}` } : {}) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{m.authorName || "Anónimo"}</span>
                  {isCreator && <span style={{ fontSize: 7, fontWeight: 900, background: color + "22", color, padding: "2px 5px", borderRadius: 4 }}>CREADOR</span>}
                  {m.authorRole === "socio" && <span style={{ fontSize: 7, fontWeight: 900, background: "rgba(255,255,255,0.08)", color: "#888", padding: "2px 5px", borderRadius: 4 }}>SOCIO</span>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: "#ddd" }}>{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "var(--color-black)", flexShrink: 0 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendChat(input)}
          placeholder={isAuthenticated ? "Escribe algo..." : "Inicia sesión para chatear"}
          style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px", fontSize: 13, color: "#fff", fontFamily: "var(--font-body)", outline: "none" }}
        />
        <button
          onClick={() => sendChat(input)}
          style={{ background: "#fff", color: "#000", border: "none", padding: "13px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

// ==========================================
// VOTE TAB
// ==========================================
type VoteType = "encuesta" | "pregunta" | "votacion" | "apuesta";

interface VoteDecision {
  id: string;
  category: string;
  title: string;
  options: string[];
  results: Record<string, number>;
  creditsCost: number;
  xpReward: number;
  votationType?: VoteType;
  correctOption?: string;
  settledAt?: string;
  doubledPayout?: boolean;
  betPool?: number;
  participants?: number;
  closingDate?: string;
  betInfo?: string;
}

function getCategoryStyle(type?: VoteType): { labelColor: string; costDisplay: React.ReactNode } {
  if (type === "pregunta") return {
    labelColor: "#22C55E",
    costDisplay: <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 700 }}>GRATIS · +4 ⚡</span>,
  };
  if (type === "encuesta") return {
    labelColor: "#aaa",
    costDisplay: <span style={{ fontSize: 10, fontWeight: 800, background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44", borderRadius: 20, padding: "3px 10px" }}>GRATIS · +2 ⚡</span>,
  };
  if (type === "apuesta") return {
    labelColor: "#F0E040",
    costDisplay: <span style={{ fontSize: 12, fontWeight: 700, color: "#F0E040" }}>⚡ 20</span>,
  };
  return {
    labelColor: "#888",
    costDisplay: <span style={{ fontSize: 12, fontWeight: 700, color: "#F0E040" }}>⚡ 5</span>,
  };
}

function VoteTab() {
  const { showToast } = useUIStore();
  const { spendCredits, addXP, voted, setVoted, isAuthenticated } = useUserStore();
  const { sharePost } = useShare();
  const [votes, setVotes] = useState<VoteDecision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/gamification/votes")
      .then((r) => setVotes(r.data))
      .catch(() => setVotes([]))
      .finally(() => setLoading(false));
  }, []);

  const handleVote = async (v: VoteDecision, option: string) => {
    if (voted[v.id]) { showToast("Ya has votado en esta decisión"); return; }
    if (isAuthenticated) {
      try {
        await api.post(`/gamification/votes/${v.id}/cast`, { selectedOption: option });
        setVoted(v.id, option);
        addXP(v.xpReward);
        const cashback = v.votationType === "encuesta" ? 2 : v.votationType === "pregunta" ? 4 : 0;
        showToast(cashback > 0 ? `+${cashback} ⚡ · +${v.xpReward} XP` : `¡Voto registrado! +${v.xpReward} XP`);
      } catch { showToast("Error al votar ❌"); }
    } else {
      if (v.creditsCost > 0 && !spendCredits(v.creditsCost)) { showToast(`Necesitas ${v.creditsCost} créditos`); return; }
      setVoted(v.id, option);
      addXP(v.xpReward);
      showToast(`+${v.xpReward} XP · Voto registrado ✓`);
    }
  };

  const getPct = (results: Record<string, number>, opt: string) => {
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    return total === 0 ? 0 : Math.round(((results[opt] || 0) / total) * 100);
  };

  if (loading) return <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>Cargando decisiones... ⚡</div>;

  if (votes.length === 0) return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗳️</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#666", marginBottom: 6 }}>Sin decisiones activas</div>
      <div style={{ fontSize: 12, color: "#444" }}>Pronto habrá nuevas votaciones del club</div>
    </div>
  );

  return (
    <div className="community-vote" style={{ padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 2, marginBottom: 4 }}>DECIDE CON LA COMUNIDAD</div>
        <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Vota las decisiones del club · Gana XP y créditos</div>
      </div>

      {votes.map((v) => {
        const hasVoted = !!voted[v.id];
        const settled  = !!(v.settledAt && v.correctOption);
        const isApuesta = v.votationType === "apuesta";
        const { labelColor, costDisplay } = getCategoryStyle(v.votationType);

        return (
          <div key={v.id} style={{ borderRadius: 10, overflow: "hidden", border: isApuesta ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(255,255,255,0.06)", background: isApuesta ? "#0e0a18" : "#1a1a1a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 0" }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: labelColor }}>{v.category}</span>
              {costDisplay}
            </div>

            {isApuesta && v.betInfo && (
              <div style={{ padding: "6px 16px 0", fontSize: 11, color: "#aaa" }}>
                {v.betInfo} · Bote: <strong style={{ color: "#F0E040" }}>{(v.betPool ?? 0).toLocaleString()} ⚡</strong>
              </div>
            )}

            <div style={{ padding: "12px 16px", fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{v.title}</div>

            {settled && (
              <div style={{ margin: "0 16px 10px", fontSize: 12, fontWeight: 700, color: v.doubledPayout ? "#A78BFA" : "#F0E040" }}>
                {v.doubledPayout ? "🎉 Bote doblado — " : "Resultado: "}{v.correctOption}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px 16px" }}>
              {v.options.map((opt) => {
                const isMyVote  = voted[v.id] === opt;
                const pct       = hasVoted ? getPct(v.results, opt) : 0;
                const isCorrect = settled && v.correctOption === opt;
                const dimmed    = (hasVoted || settled) && !isMyVote && !isCorrect;
                return (
                  <button
                    key={opt}
                    onClick={() => handleVote(v, opt)}
                    disabled={hasVoted || settled}
                    style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: isMyVote ? "1px solid rgba(240,224,64,0.4)" : isCorrect ? "1px solid rgba(34,197,94,0.4)" : "1px solid transparent", background: isMyVote ? "rgba(240,224,64,0.07)" : isCorrect ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.05)", cursor: hasVoted || settled ? "default" : "pointer", textAlign: "left", position: "relative", overflow: "hidden", opacity: dimmed ? 0.45 : 1, transition: "opacity 0.15s" }}
                  >
                    {hasVoted && pct > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: isMyVote ? "rgba(240,224,64,0.08)" : "rgba(255,255,255,0.03)", width: `${pct}%`, transition: "width 0.5s ease" }} />}
                    <span style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: isMyVote ? "#F0E040" : isCorrect ? "#22C55E" : "#ddd", fontWeight: isMyVote || isCorrect ? 700 : 400 }}>
                        {(isMyVote || isCorrect) && "✓ "}{opt}
                      </span>
                      {hasVoted && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-muted)" }}>{pct}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: "10px 16px 14px", fontSize: 11, color: "var(--color-muted)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{isApuesta ? `${v.participants ?? 0} fans · ${v.closingDate ? `Cierra ${v.closingDate}` : "Activa"}` : ""}</span>
              <button
                onClick={async () => {
                  const result = await sharePost(v.id, v.title);
                  if (result.copied) {
                    showToast("Link copiado al portapapeles ✓");
                  } else {
                    showToast("Error al copiar");
                  }
                }}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: "var(--color-muted)", fontFamily: "var(--font-body)", padding: "4px 8px" }}
              >↗ Compartir</button>
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: "center", fontSize: 11, color: "var(--color-muted)", paddingTop: 4 }}>Nuevas decisiones cada 2-3 días</div>
    </div>
  );
}

// ==========================================
// COMMUNITY SCREEN
// ==========================================
export default function CommunityScreen() {
  const { communityTab, setCommunityTab } = useUIStore();
  const onlineCount = useOnlineCount();
  const isChat = communityTab === "chat";

  const tabs = [
    { id: "feed"  as const, label: "Feed",  icon: null  },
    { id: "chat"  as const, label: "Chat",  icon: "💬"  },
    { id: "votar" as const, label: "Votar", icon: "🗳"  },
  ];

  return (
    <div className="community-screen" style={{ display: "flex", flexDirection: "column", height: isChat ? "100%" : "auto" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        {tabs.map((t) => {
          const active = communityTab === t.id;
          return (
            <button key={t.id} onClick={() => setCommunityTab(t.id)} style={{ flex: 1, padding: "14px 8px", textAlign: "center", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", border: "none", borderBottom: `2px solid ${active ? "var(--color-accent)" : "transparent"}`, background: "transparent", color: active ? "#fff" : "var(--color-muted)", transition: "all 0.15s", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {t.icon && <span>{t.icon}</span>}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Online count */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-green)", flexShrink: 0 }} />
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted)" }}>{onlineCount} fans conectados ahora</div>
      </div>

      {isChat ? (
        <ChatTab />
      ) : (
        <div className="community-tab-scroll">
          {communityTab === "feed"  && <FeedTab />}
          {communityTab === "votar" && <VoteTab />}
        </div>
      )}
    </div>
  );
}
