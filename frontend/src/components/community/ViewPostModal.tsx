"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";
import Skel from "@/components/ui/Skel";

const REACTION_EMOJIS = ["🔥", "🏀", "💪", "🎉", "👏"];

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  type: string;
  content: string;
  imageUrl?: string;
  pollOptions?: string[];
  pollVotes?: Record<string, number>;
  likesCount: number;
  reactions?: Record<string, number>;
  myReactions?: string[];
  createdAt: string;
}

interface ApiComment {
  id: string;
  content: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  likesCount: number;
  liked: boolean;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Ahora";
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

export default function ViewPostModal() {
  const { viewPostId, closeViewPost, showToast, openAuth } = useUIStore();
  const { liked, toggleLike, isAuthenticated, name: myName, role } = useUserStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollVoted, setPollVoted] = useState<string>("");
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!viewPostId) return;
    setLoading(true);
    api.get(`/community/posts/${viewPostId}`)
      .then((r) => setPost(r.data || null))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
    setCommentsLoading(true);
    setCommentInput("");
    api.get(`/community/posts/${viewPostId}/comments`)
      .then((r) => setComments(r.data ?? []))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [viewPostId]);

  if (!viewPostId || !post) return null;

  const handleLike = async () => {
    if (!isAuthenticated) { showToast("Inicia sesión para reaccionar ⚡"); return; }
    toggleLike(post.id);
    try { await api.post(`/community/posts/${post.id}/like`); } catch {}
  };

  const handleReact = async (emoji: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    setPost((prev) => {
      if (!prev) return prev;
      const mine = new Set(prev.myReactions ?? []);
      const counts = { ...(prev.reactions ?? {}) };
      const had = mine.has(emoji);
      if (had) { mine.delete(emoji); counts[emoji] = Math.max(0, (counts[emoji] ?? 1) - 1); if (counts[emoji] === 0) delete counts[emoji]; }
      else { mine.add(emoji); counts[emoji] = (counts[emoji] ?? 0) + 1; }
      return { ...prev, reactions: counts, myReactions: [...mine] };
    });
    try {
      const r = await api.post(`/community/posts/${post.id}/react`, { emoji });
      const { counts, mine } = r.data ?? {};
      if (counts) setPost((prev) => prev ? { ...prev, reactions: counts, myReactions: mine ?? [] } : prev);
    } catch {}
  };

  const handlePollVote = async (option: string) => {
    if (pollVoted) { showToast("Ya votaste en esta encuesta"); return; }
    if (!isAuthenticated) { showToast("Inicia sesión para votar ⚡"); return; }
    setPollVoted(option);
    try {
      await api.post(`/community/posts/${post.id}/vote`, { option });
      showToast(`Votaste: ${option} ✓`);
    } catch { showToast("Error al votar"); }
  };

  const submitComment = async () => {
    if (!isAuthenticated) { openAuth(); return; }
    const content = commentInput.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const r = await api.post(`/community/posts/${post.id}/comments`, { content });
      setComments((prev) => [...prev, r.data]);
      setCommentInput("");
    } catch { showToast("No se pudo enviar el comentario ❌"); }
    finally { setSending(false); }
  };

  const likeComment = async (commentId: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    setComments((prev) => prev.map((c) => c.id !== commentId ? c : { ...c, liked: !c.liked, likesCount: Math.max(0, c.likesCount + (c.liked ? -1 : 1)) }));
    try {
      const r = await api.post(`/community/comments/${commentId}/like`);
      const { liked: sl, likesCount: sc } = r.data ?? {};
      if (typeof sc === "number") setComments((prev) => prev.map((c) => c.id !== commentId ? c : { ...c, liked: !!sl, likesCount: sc }));
    } catch {}
  };

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/community/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch { showToast("No se pudo eliminar ❌"); }
  };

  const isCreator = post.authorRole === "creator";
  const pollTotal = post.pollVotes ? Object.values(post.pollVotes).reduce((a, b) => a + b, 0) : 0;
  const isLiked = liked[post.id];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && closeViewPost()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", paddingTop: "40px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#141414", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", maxWidth: 560, width: "92%", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Cargando...</div>
        ) : (
          <>
            {/* Author */}
            <div style={{ padding: "16px 20px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: isCreator ? "linear-gradient(135deg, #F0E040, #FF6B1A)" : "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: isCreator ? "#000" : "#888", flexShrink: 0, overflow: "hidden" }}>
                {post.authorAvatar?.startsWith("http") || post.authorAvatar?.startsWith("data:")
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={post.authorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : post.authorAvatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{post.authorName}</span>
                  {isCreator && <span style={{ fontSize: 8, fontWeight: 900, background: "#F0E040", color: "#000", padding: "2px 6px", borderRadius: 4 }}>CREADOR</span>}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>{timeAgo(post.createdAt)}</div>
              </div>
              <button onClick={closeViewPost} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1 }}>✕</button>
            </div>

            {/* Content */}
            {post.content?.trim() && <div style={{ padding: "16px 20px 12px", fontSize: 15, lineHeight: 1.55 }}>{post.content}</div>}
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageUrl} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} />
            )}

            {/* Poll */}
            {post.type === "poll" && post.pollOptions && (
              <div style={{ margin: "12px 20px 4px", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                {post.pollOptions.map((opt) => {
                  const votes = post.pollVotes?.[opt] ?? 0;
                  const pct = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                  const isVoted = pollVoted === opt;
                  const showPct = !!pollVoted;
                  return (
                    <button key={opt} onClick={() => handlePollVote(opt)} disabled={!!pollVoted} style={{ width: "100%", padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: pollVoted ? "default" : "pointer", position: "relative", overflow: "hidden", textAlign: "left" }}>
                      {showPct && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: isVoted ? "rgba(240,224,64,0.12)" : "rgba(255,255,255,0.04)", width: `${pct}%`, transition: "width 0.4s ease" }} />}
                      <span style={{ fontSize: 13, fontWeight: isVoted ? 700 : 400, color: isVoted ? "#F0E040" : "#ddd", position: "relative", zIndex: 1 }}>{isVoted ? "✓ " : ""}{opt}</span>
                      {showPct && <span style={{ fontSize: 13, fontWeight: 700, color: "#888", position: "relative", zIndex: 1 }}>{pct}%</span>}
                    </button>
                  );
                })}
                <div style={{ padding: "10px 16px", fontSize: 11, color: "#888", borderTop: "1px solid rgba(255,255,255,0.05)" }}>📊 {pollTotal.toLocaleString("es")} votos</div>
              </div>
            )}

            {/* Quick reactions */}
            <div style={{ display: "flex", gap: 6, padding: "12px 20px 4px", flexWrap: "wrap" }}>
              {REACTION_EMOJIS.map((emoji) => {
                const count = post.reactions?.[emoji] ?? 0;
                const mine = post.myReactions?.includes(emoji);
                return (
                  <button key={emoji} onClick={() => handleReact(emoji)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 16, fontSize: 13, cursor: "pointer", fontFamily: "inherit", background: mine ? "rgba(240,224,64,0.14)" : "rgba(255,255,255,0.05)", border: `1px solid ${mine ? "rgba(240,224,64,0.4)" : "rgba(255,255,255,0.08)"}`, color: mine ? "#F0E040" : "#888" }}>
                    <span>{emoji}</span>
                    {count > 0 && <span style={{ fontSize: 11, fontWeight: 700 }}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Like + count */}
            <div style={{ display: "flex", gap: 18, padding: "6px 20px 14px", alignItems: "center" }}>
              <button onClick={handleLike} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#888", fontFamily: "inherit" }}>
                {isLiked ? "❤️" : "🤍"} <span>{post.likesCount + (isLiked ? 1 : 0)}</span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#888" }}>💬 <span>{comments.length}</span></div>
            </div>

            {/* Comments */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", textTransform: "uppercase", marginBottom: 12 }}>Comentarios</div>
              {commentsLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <Skel w={32} h={32} r={16} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ background: "#2a2a2a", borderRadius: 12, padding: "8px 12px" }}>
                          <Skel w={90} h={11} r={4} style={{ marginBottom: 6 }} />
                          <Skel w="85%" h={13} r={4} style={{ marginBottom: 3 }} />
                          <Skel w="60%" h={13} r={4} />
                        </div>
                        <div style={{ display: "flex", gap: 14, marginTop: 4, paddingLeft: 4 }}>
                          <Skel w={40} h={9} r={4} />
                          <Skel w={24} h={9} r={4} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "12px 0" }}>Sé el primero en comentar 💬</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {comments.map((c) => {
                    const cCreator = c.authorRole === "creator";
                    const canDelete = isAuthenticated && (role === "admin" || c.authorName === myName);
                    return (
                      <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, overflow: "hidden" }}>
                          {c.authorAvatar?.startsWith("http") || c.authorAvatar?.startsWith("data:")
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={c.authorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span>{c.authorAvatar}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ background: "#2a2a2a", borderRadius: 12, padding: "8px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{c.authorName}</span>
                              {cCreator && <span style={{ fontSize: 7, fontWeight: 900, background: "#F0E040", color: "#000", padding: "1px 5px", borderRadius: 3 }}>CREADOR</span>}
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.45, color: "#eee", wordBreak: "break-word" }}>{c.content}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, paddingLeft: 4 }}>
                            <span style={{ fontSize: 10, color: "#666" }}>{timeAgo(c.createdAt)}</span>
                            <button onClick={() => likeComment(c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: c.liked ? "#F0E040" : "#888", fontFamily: "inherit" }}>
                              {c.liked ? "❤️" : "🤍"} {c.likesCount > 0 && <span>{c.likesCount}</span>}
                            </button>
                            {canDelete && <button onClick={() => deleteComment(c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", fontFamily: "inherit" }}>Eliminar</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comment input */}
            <div style={{ display: "flex", gap: 8, padding: "10px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "sticky", bottom: 0, background: "#141414" }}>
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
                placeholder={isAuthenticated ? "Escribe un comentario..." : "Inicia sesión para comentar"}
                disabled={!isAuthenticated}
                style={{ flex: 1, background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "10px 16px", fontSize: 13, color: "#fff", fontFamily: "inherit", outline: "none" }}
              />
              <button onClick={submitComment} disabled={sending || !commentInput.trim()} style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "10px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: commentInput.trim() ? "pointer" : "default", opacity: commentInput.trim() ? 1 : 0.5, fontFamily: "inherit" }}>
                {sending ? "…" : "Enviar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
