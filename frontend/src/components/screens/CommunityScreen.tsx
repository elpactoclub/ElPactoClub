"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";
import { getSocket } from "@/services/socket";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { useShare } from "@/hooks/useShare";
import StoryViewer, { StoryAuthor } from "@/components/community/StoryViewer";
import Skel from "@/components/ui/Skel";

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
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  type: string;
  content: string;
  pollOptions?: string[];
  pollVotes?: Record<string, number>;
  likesCount: number;
  liked?: boolean;
  myVote?: string | null;
  imageUrl?: string | null;
  pollClosed?: boolean;
  createdAt: string;
  isOnline?: boolean;
  commentsCount?: number;
  reactions?: Record<string, number>;
  myReactions?: string[];
}

const REACTION_EMOJIS = ["🔥", "🏀", "💪", "🎉", "👏"];

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
  if (m < 1)  return "Ahora";
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

function PostAvatar({ name, role, avatar, size = 44 }: { name: string; role: string; avatar?: string; size?: number }) {
  const isImg = avatar?.startsWith("http") || avatar?.startsWith("data:");
  const color = CREATOR_COLOR[name] ?? (role === "creator" ? "#A78BFA" : "#888");
  // Prioridad: foto subida por el usuario > foto seed del creador > emoji > inicial
  const src = isImg ? avatar : CREATOR_PHOTOS[name];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, flexShrink: 0, overflow: "hidden" }}>
      {avatar && !isImg ? avatar : name[0]}
    </div>
  );
}

function FeedTab() {
  const { showToast, openPostModal, openAuth, postsRefreshKey, openUserProfile } = useUIStore();
  const { avatar, liked, toggleLike, isAuthenticated, role, name: myName } = useUserStore();
  const { sharePost } = useShare();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollVoted, setPollVoted] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("ep_poll_voted");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [storyAuthors, setStoryAuthors] = useState<StoryAuthor[]>([]);
  const [storyRefreshKey, setStoryRefreshKey] = useState(0);
  const [storyOpenIdx, setStoryOpenIdx] = useState<number | null>(null);
  const [detailPost, setDetailPost] = useState<ApiPost | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [storyPreview, setStoryPreview] = useState<{ file: File; url: string; isVideo: boolean } | null>(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("ep_viewed_stories");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const handleStoryFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const url = URL.createObjectURL(file);
    setStoryPreview({ file, url, isVideo: file.type.startsWith("video/") });
    setStoryCaption("");
  }, []);

  const handleStoryUpload = async () => {
    if (!storyPreview) return;
    if (!isAuthenticated) { openAuth(); return; }
    setUploadingStory(true);
    try {
      const fd = new FormData();
      fd.append("file", storyPreview.file);
      if (storyCaption.trim()) fd.append("caption", storyCaption.trim());
      await api.post("/community/stories", fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("¡Historia publicada! 🎉");
      setStoryRefreshKey((k) => k + 1);
    } catch {
      showToast("Error al publicar la historia. Inténtalo de nuevo.");
    } finally {
      setUploadingStory(false);
      URL.revokeObjectURL(storyPreview.url);
      setStoryPreview(null);
    }
  };

  const markStoryViewed = useCallback((key: string) => {
    setViewedStories((prev) => {
      if (prev.has(key)) return prev;
      const updated = new Set(prev).add(key);
      localStorage.setItem("ep_viewed_stories", JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  const openStory = (idx: number, key: string) => {
    setStoryOpenIdx(idx);
    markStoryViewed(key);
  };

  useEffect(() => {
    setLoading(true);
    api.get("/community/posts")
      .then((r) => {
        const fetched: ApiPost[] = r.data;
        setPosts(fetched);
        // Sync liked map from backend (source of truth)
        const fromApi: Record<string, boolean> = {};
        fetched.forEach((p) => { if (p.liked) fromApi[p.id] = true; });
        useUserStore.setState({ liked: fromApi });
        if (typeof window !== "undefined") localStorage.setItem("ep_liked", JSON.stringify(fromApi));
        // Sync poll votes from backend (overrides localStorage for authenticated users)
        const serverVotes: Record<string, string> = {};
        fetched.forEach((p) => { if (p.myVote) serverVotes[p.id] = p.myVote; });
        if (Object.keys(serverVotes).length > 0) {
          setPollVoted((prev) => {
            const merged = { ...prev, ...serverVotes };
            localStorage.setItem("ep_poll_voted", JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [postsRefreshKey]);

  // Story bar: own story first (if exists), then creators, then followed
  useEffect(() => {
    api.get("/community/story-authors")
      .then((r) => {
        const list: { id: string; name: string; avatar: string; role: string; storyId?: string; storyImageUrl?: string; caption?: string; isOwn?: boolean }[] = Array.isArray(r.data) ? r.data : [];
        setStoryAuthors(list.map((u) => {
          const localPhoto = CREATOR_PHOTOS[u.name];
          const avatarIsImg = u.avatar?.startsWith("http") || u.avatar?.startsWith("data:");
          return {
            id: u.id,
            name: u.name,
            photo: localPhoto ?? (avatarIsImg ? u.avatar : undefined),
            avatar: avatarIsImg ? undefined : u.avatar,
            storyId: u.storyId ?? undefined,
            storyImageUrl: u.storyImageUrl ?? undefined,
            caption: u.caption ?? undefined,
            isOwn: u.isOwn,
          };
        }));
      })
      .catch(() => setStoryAuthors([]));
  }, [postsRefreshKey, isAuthenticated, storyRefreshKey]);

  // Real-time: new posts from other users
  useEffect(() => {
    let sock: ReturnType<typeof getSocket> | null = null;
    try {
      sock = getSocket();
      sock.emit("join_feed");
      sock.on("new_post", (post: ApiPost) => {
        setPosts((prev) => {
          if (prev.some((p) => p.id === post.id)) return prev;
          return [{ ...post, liked: false, myVote: null }, ...prev];
        });
      });
    } catch {}
    return () => { sock?.off("new_post"); };
  }, []);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    const wasLiked = !!liked[postId];
    const delta = wasLiked ? -1 : 1;
    // Optimistic update
    toggleLike(postId);
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : {
      ...p, likesCount: Math.max(0, p.likesCount + delta),
    }));
    setDetailPost((prev) => prev?.id === postId ? { ...prev, likesCount: Math.max(0, prev.likesCount + delta) } : prev);
    // Sync with backend response
    try {
      const r = await api.post(`/community/posts/${postId}/like`);
      const { liked: serverLiked, likesCount: serverCount } = r.data ?? {};
      if (typeof serverCount === "number") {
        setPosts((prev) => prev.map((p) => p.id !== postId ? p : { ...p, likesCount: serverCount }));
        setDetailPost((prev) => prev?.id === postId ? { ...prev, likesCount: serverCount } : prev);
      }
      if (typeof serverLiked === "boolean") {
        useUserStore.setState((s) => {
          const next = { ...s.liked, [postId]: serverLiked };
          if (!serverLiked) delete next[postId];
          if (typeof window !== "undefined") localStorage.setItem("ep_liked", JSON.stringify(next));
          return { liked: next };
        });
      }
    } catch {}
  };

  const handleReact = async (postId: string, emoji: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    // Optimistic toggle
    const apply = (p: ApiPost): ApiPost => {
      const mine = new Set(p.myReactions ?? []);
      const counts = { ...(p.reactions ?? {}) };
      const had = mine.has(emoji);
      if (had) { mine.delete(emoji); counts[emoji] = Math.max(0, (counts[emoji] ?? 1) - 1); if (counts[emoji] === 0) delete counts[emoji]; }
      else { mine.add(emoji); counts[emoji] = (counts[emoji] ?? 0) + 1; }
      return { ...p, reactions: counts, myReactions: [...mine] };
    };
    setPosts((prev) => prev.map((p) => p.id === postId ? apply(p) : p));
    setDetailPost((prev) => prev?.id === postId ? apply(prev) : prev);
    try {
      const r = await api.post(`/community/posts/${postId}/react`, { emoji });
      const { counts, mine } = r.data ?? {};
      if (counts) {
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reactions: counts, myReactions: mine ?? [] } : p));
        setDetailPost((prev) => prev?.id === postId ? { ...prev, reactions: counts, myReactions: mine ?? [] } : prev);
      }
    } catch {}
  };

  // Load comments whenever the detail view opens for a post
  useEffect(() => {
    if (!detailPost) { setComments([]); return; }
    setCommentsLoading(true);
    setCommentInput("");
    api.get(`/community/posts/${detailPost.id}/comments`)
      .then((r) => setComments(r.data ?? []))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [detailPost?.id]);

  const bumpCommentsCount = (postId: string, delta: number) => {
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : { ...p, commentsCount: Math.max(0, (p.commentsCount ?? 0) + delta) }));
    setDetailPost((prev) => prev?.id === postId ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount ?? 0) + delta) } : prev);
  };

  const submitComment = async () => {
    if (!isAuthenticated) { openAuth(); return; }
    const content = commentInput.trim();
    if (!content || !detailPost || sendingComment) return;
    setSendingComment(true);
    try {
      const r = await api.post(`/community/posts/${detailPost.id}/comments`, { content });
      setComments((prev) => [...prev, r.data]);
      setCommentInput("");
      bumpCommentsCount(detailPost.id, 1);
    } catch {
      showToast("No se pudo enviar el comentario ❌");
    } finally {
      setSendingComment(false);
    }
  };

  const likeComment = async (commentId: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    // Optimistic toggle
    setComments((prev) => prev.map((c) => c.id !== commentId ? c : {
      ...c, liked: !c.liked, likesCount: Math.max(0, c.likesCount + (c.liked ? -1 : 1)),
    }));
    try {
      const r = await api.post(`/community/comments/${commentId}/like`);
      const { liked: sl, likesCount: sc } = r.data ?? {};
      if (typeof sc === "number") {
        setComments((prev) => prev.map((c) => c.id !== commentId ? c : { ...c, liked: !!sl, likesCount: sc }));
      }
    } catch {}
  };

  const deleteComment = async (commentId: string, postId: string) => {
    try {
      await api.delete(`/community/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      bumpCommentsCount(postId, -1);
    } catch {
      showToast("No se pudo eliminar ❌");
    }
  };

  const handlePollVote = async (postId: string, option: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    if (pollVoted[postId]) { showToast("Ya votaste en esta encuesta"); return; }
    setPollVoted((prev) => {
      const next = { ...prev, [postId]: option };
      localStorage.setItem("ep_poll_voted", JSON.stringify(next));
      return next;
    });
    setPosts((prev) => prev.map((p) => p.id !== postId ? p : {
      ...p, pollVotes: { ...p.pollVotes, [option]: (p.pollVotes?.[option] ?? 0) + 1 },
    }));
    try { await api.post(`/community/posts/${postId}/vote`, { option }); } catch {}
    showToast(`Votaste: ${option} ✓`);
  };

  const handleDelete = async (postId: string) => {
    setMenuOpenId(null);
    setConfirmDeleteId(null);
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
      {storyOpenIdx !== null && storyAuthors.length > 0 && (
        <StoryViewer
          authors={storyAuthors}
          startIndex={storyOpenIdx}
          onClose={() => setStoryOpenIdx(null)}
          onViewed={(a) => markStoryViewed(a.id ?? a.name)}
          onDeleteStory={async (storyId) => {
            try {
              await api.delete(`/community/stories/${storyId}`);
              setStoryRefreshKey((k) => k + 1);
            } catch {
              showToast("Error al eliminar la historia");
            }
          }}
        />
      )}

      {/* Hidden file input for story upload */}
      <input
        ref={storyInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleStoryFile}
      />

      {/* Story preview / upload modal */}
      {storyPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#000", display: "flex", flexDirection: "column" }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
            <button
              onClick={() => { URL.revokeObjectURL(storyPreview.url); setStoryPreview(null); }}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >✕</button>
            <button
              onClick={handleStoryUpload}
              disabled={uploadingStory}
              style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "10px 24px", borderRadius: 24, fontSize: 13, fontWeight: 800, cursor: uploadingStory ? "default" : "pointer", fontFamily: "var(--font-heading)", letterSpacing: 1, opacity: uploadingStory ? 0.6 : 1 }}
            >{uploadingStory ? "Publicando..." : "PUBLICAR →"}</button>
          </div>

          {/* Media preview */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {storyPreview.isVideo ? (
              <video src={storyPreview.url} autoPlay loop muted playsInline style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storyPreview.url} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            )}
          </div>

          {/* Caption input at bottom */}
          <div style={{ padding: "16px 20px 40px", background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)", display: "flex", alignItems: "center", gap: 12 }}>
            <input
              value={storyCaption}
              onChange={(e) => setStoryCaption(e.target.value)}
              placeholder="Añade un texto a tu historia..."
              maxLength={100}
              style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, padding: "12px 18px", fontSize: 14, color: "#fff", fontFamily: "var(--font-body)", outline: "none" }}
            />
          </div>
        </div>
      )}

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
                <PostAvatar name={p.authorName} role={p.authorRole} avatar={p.authorAvatar} size={44} />
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
                    const isVoted = isAuthenticated && pollVoted[p.id] === opt;
                    const showPct = (isAuthenticated && !!pollVoted[p.id]) || !!p.pollClosed;
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
              <div style={{ display: "flex", gap: 22, padding: "8px 16px 16px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => handleLike(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
                  {isLiked ? "❤️" : "🤍"} <span>{p.likesCount}</span>
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "var(--color-muted)" }}>
                  💬 <span>{p.commentsCount ?? comments.length}</span>
                </div>
                <button
                  onClick={async () => {
                    const result = await sharePost(p.id, p.content.substring(0, 100));
                    if (result.copied) showToast("Link copiado ✓");
                  }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
                >
                  ↗ <span>Compartir</span>
                </button>
              </div>

              {/* Comments */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px 8px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 12 }}>Comentarios</div>
                {commentsLoading ? (
                  <div style={{ fontSize: 13, color: "var(--color-muted)", textAlign: "center", padding: "12px 0" }}>Cargando comentarios...</div>
                ) : comments.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--color-muted)", textAlign: "center", padding: "12px 0" }}>Sé el primero en comentar 💬</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {comments.map((c) => {
                      const cCreator = c.authorRole === "creator";
                      const canDeleteComment = isAuthenticated && (role === "admin" || c.authorName === myName);
                      return (
                        <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <button onClick={() => openUserProfile(c.userId)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
                            <PostAvatar name={c.authorName} role={c.authorRole} avatar={c.authorAvatar} size={32} />
                          </button>
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
                              <button onClick={() => likeComment(c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: c.liked ? "var(--color-accent)" : "var(--color-muted)", fontFamily: "var(--font-body)" }}>
                                {c.liked ? "❤️" : "🤍"} {c.likesCount > 0 && <span>{c.likesCount}</span>}
                              </button>
                              {canDeleteComment && (
                                <button onClick={() => deleteComment(c.id, p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", fontFamily: "var(--font-body)" }}>Eliminar</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comment input */}
              <div style={{ display: "flex", gap: 8, padding: "10px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "sticky", bottom: 0, background: "#1c1c1c" }}>
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
                  placeholder={isAuthenticated ? "Escribe un comentario..." : "Inicia sesión para comentar"}
                  disabled={!isAuthenticated}
                  style={{ flex: 1, background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "10px 16px", fontSize: 13, color: "#fff", fontFamily: "var(--font-body)", outline: "none" }}
                />
                <button
                  onClick={submitComment}
                  disabled={sendingComment || !commentInput.trim()}
                  style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "10px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: commentInput.trim() ? "pointer" : "default", opacity: commentInput.trim() ? 1 : 0.5, fontFamily: "var(--font-body)" }}
                >
                  {sendingComment ? "…" : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stories — creadores siempre + personas que sigo */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="hide-scrollbar">
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer" }}
          onClick={() => isAuthenticated ? storyInputRef.current?.click() : openAuth()}
        >
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#1e1e1e", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#aaa" }}>+</div>
          <span style={{ fontSize: 10, color: "var(--color-muted)", fontWeight: 500 }}>Tu story</span>
        </div>
        {storyAuthors.map((s, idx) => {
          const key = s.id ?? s.name;
          const viewed = viewedStories.has(key);
          const showRing = !viewed;
          const hasStoryImg = !!s.storyImageUrl;
          const isImg = !!s.photo || hasStoryImg;
          const displayPhoto = hasStoryImg ? s.storyImageUrl! : s.photo;
          const firstName = s.isOwn ? "Tu historia" : s.name.split(" ")[0];
          return (
            <div
              key={key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer", position: "relative" }}
              onClick={() => openStory(idx, key)}
            >
              <div style={{ padding: 3, borderRadius: "50%", background: showRing ? "linear-gradient(135deg,#F0E040,#FF6B1A)" : "rgba(255,255,255,0.1)" }}>
                {isImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayPhoto} alt={s.name} style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid #111" }} />
                ) : (
                  <div style={{ width: 54, height: 54, borderRadius: "50%", border: "2px solid #111", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.avatar ?? s.name[0]}</div>
                )}
              </div>
              {showRing && !s.isOwn && <div style={{ position: "absolute", top: 0, right: -2, background: "#F0E040", color: "#000", fontSize: 7, fontWeight: 900, padding: "2px 4px", borderRadius: 4, border: "2px solid #111" }}>NEW</div>}
              <span style={{ fontSize: 10, color: s.isOwn ? "var(--color-accent)" : viewed ? "#555" : "var(--color-muted)", fontWeight: s.isOwn ? 700 : 500, maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</span>
            </div>
          );
        })}
      </div>

      {/* Post input */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
        onClick={openPostModal}
      >
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, overflow: "hidden" }}>
          {avatar?.startsWith("http") || avatar?.startsWith("data:")
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            : avatar}
        </div>
        <div style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "9px 16px", fontSize: 13, color: "var(--color-muted)" }}>
          ¿Qué está pasando en El Pacto?
        </div>
        <span style={{ fontSize: 18 }}>📸</span>
        <span style={{ fontSize: 18 }}>📊</span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: "var(--color-gray2)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Skel w={40} h={40} r={20} />
                <div style={{ flex: 1 }}>
                  <Skel w="45%" h={12} style={{ marginBottom: 6 }} />
                  <Skel w="25%" h={9} r={4} />
                </div>
              </div>
              <Skel h={13} style={{ width: "90%", marginBottom: 6 }} />
              <Skel h={13} style={{ width: "70%", marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 16 }}>
                <Skel w={40} h={11} r={4} />
                <Skel w={40} h={11} r={4} />
                <Skel w={60} h={11} r={4} />
              </div>
            </div>
          ))}
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
              <button onClick={() => openUserProfile(post.authorId)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
                <PostAvatar name={post.authorName} role={post.authorRole} avatar={post.authorAvatar} size={44} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                  <span onClick={() => openUserProfile(post.authorId)} style={{ fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{post.authorName}</span>
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
                    <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => { setMenuOpenId(null); setConfirmDeleteId(null); }} />
                    <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, background: "#252525", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, minWidth: 160, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                      {confirmDeleteId === post.id ? (
                        <>
                          <div style={{ padding: "12px 16px", fontSize: 12, color: "#aaa", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>¿Eliminar este post?</div>
                          <div style={{ display: "flex" }}>
                            <button
                              onClick={() => handleDelete(post.id)}
                              style={{ flex: 1, padding: "12px 0", background: "transparent", border: "none", borderRight: "1px solid rgba(255,255,255,0.07)", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                            >Sí, eliminar</button>
                            <button
                              onClick={() => { setConfirmDeleteId(null); setMenuOpenId(null); }}
                              style={{ flex: 1, padding: "12px 0", background: "transparent", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                            >Cancelar</button>
                          </div>
                        </>
                      ) : (
                        <>
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
                              onClick={() => setConfirmDeleteId(post.id)}
                              style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", color: "#ef4444", fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                            >🗑 Eliminar post</button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content — clickable to open detail */}
            <div
              onClick={() => setDetailPost(post)}
              style={{ cursor: "pointer" }}
            >
              {post.content?.trim() && (
                <div style={{ padding: "0 16px 10px", fontSize: 14, lineHeight: 1.55 }}>{post.content}</div>
              )}
              {post.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={post.imageUrl}
                  alt=""
                  style={{ width: "100%", maxHeight: 340, objectFit: "cover", display: "block", marginBottom: 4 }}
                />
              )}
            </div>

            {/* Poll */}
            {post.type === "poll" && post.pollOptions && (
              <div style={{ margin: "0 16px 12px", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                {post.pollOptions.map((opt) => {
                  const votes   = post.pollVotes?.[opt] ?? 0;
                  const pct     = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                  const isVoted = isAuthenticated && pollVoted[post.id] === opt;
                  const showPct = (isAuthenticated && !!pollVoted[post.id]) || !!post.pollClosed;
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

            {/* Quick emoji reactions */}
            <div style={{ display: "flex", gap: 6, padding: "0 16px 4px", flexWrap: "wrap" }}>
              {REACTION_EMOJIS.map((emoji) => {
                const count = post.reactions?.[emoji] ?? 0;
                const mine = post.myReactions?.includes(emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(post.id, emoji)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 16, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", background: mine ? "rgba(240,224,64,0.14)" : "rgba(255,255,255,0.05)", border: `1px solid ${mine ? "rgba(240,224,64,0.4)" : "rgba(255,255,255,0.08)"}`, color: mine ? "var(--color-accent)" : "var(--color-muted)" }}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span style={{ fontSize: 11, fontWeight: 700 }}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 22, padding: "6px 16px 16px", alignItems: "center" }}>
              <button
                onClick={() => handleLike(post.id)}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
              >
                {isLiked ? "❤️" : "🤍"} <span>{post.likesCount}</span>
              </button>
              <button
                onClick={() => setDetailPost(post)}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
              >
                💬 <span>{post.commentsCount ?? 0}</span>
              </button>
              <button
                onClick={async () => {
                  const result = await sharePost(post.id, post.content.substring(0, 100));
                  if (result.copied) showToast("Link copiado ✓");
                }}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
              >
                ↗ <span>Compartir</span>
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
  userId?: string;
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
  const { addXP, name: myName, id: myId, avatar: myAvatar, role, isAuthenticated } = useUserStore();
  const { showToast, openAuth } = useUIStore();
  const [activeChannel, setActiveChannel] = useState<Channel>("general");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChannelRef = useRef(activeChannel);
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  const fetchMessages = (channel: Channel) => {
    setLoading(true);
    api.get(`/community/messages?channel=${channel}`)
      .then((r) => setMessages(r.data))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(activeChannel); }, [activeChannel]);

  // Real-time: subscribe to active channel
  useEffect(() => {
    let sock: ReturnType<typeof getSocket> | null = null;
    try {
      sock = getSocket();
      sock.emit("join_channel", activeChannel);
      const handleMsg = ({ channel, message }: { channel: string; message: ChatMsg }) => {
        if (channel !== activeChannelRef.current) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          if (message.userId && message.userId === myId) return prev; // skip own (shown optimistically)
          return [...prev, message];
        });
      };
      const handleDeleted = ({ channel, messageId }: { channel: string; messageId: string }) => {
        if (channel !== activeChannelRef.current) return;
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      };
      sock.on("new_message", handleMsg);
      sock.on("deleted_message", handleDeleted);
      return () => {
        sock?.off("new_message", handleMsg);
        sock?.off("deleted_message", handleDeleted);
        sock?.emit("leave_channel", activeChannel);
      };
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!isAuthenticated) { openAuth(); return; }
    setInput("");
    const tempId = `opt-${Date.now()}`;
    const optimistic: ChatMsg = {
      id: tempId,
      userId: myId ?? undefined,
      content: trimmed,
      authorName: myName,
      authorAvatar: myAvatar || myName[0] || "?",
      authorRole: "fan",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const r = await api.post("/community/messages", { content: trimmed, channel: activeChannel });
      addXP(1);
      // Replace optimistic with server ID
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...optimistic, id: r.data.id } : m));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const canDeleteMsg = (m: ChatMsg) => {
    if (!isAuthenticated) return false;
    if (m.id.startsWith("opt-")) return false; // aún sin ID de servidor
    if (role === "admin") return true;
    if (role === "creator" && m.authorRole !== "admin") return true;
    return !!myId && m.userId === myId;
  };

  const deleteMsg = async (id: string) => {
    const prev = messages;
    setMessages((p) => p.filter((m) => m.id !== id)); // optimista
    try {
      await api.delete(`/community/messages/${id}`);
    } catch {
      setMessages(prev); // revertir
      showToast("No se pudo eliminar ❌");
    }
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
          <button key={e} onClick={() => { if (!isAuthenticated) { openAuth(); return; } setInput((prev) => prev + e); }} style={{ flexShrink: 0, fontSize: 18, width: 42, height: 42, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "#1a1a1a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{e}</button>
        ))}
      </div>

      {/* Messages — scrollable area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0" }}>
                <Skel w={36} h={36} r={18} />
                <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px" }}>
                  <Skel w={100} h={11} r={4} style={{ marginBottom: 8 }} />
                  <Skel w="80%" h={13} r={4} style={{ marginBottom: 4 }} />
                  <Skel w="55%" h={13} r={4} />
                </div>
              </div>
            ))}
          </div>
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
          const avatarIsImg = m.authorAvatar?.startsWith("http") || m.authorAvatar?.startsWith("data:");
          const photo = avatarIsImg ? m.authorAvatar : CREATOR_PHOTOS[m.authorName];
          return (
            <div key={m.id || i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0" }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={m.authorName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: color + "22", color, border: `1.5px solid ${color}33`, overflow: "hidden" }}>
                  {m.authorAvatar || m.authorName?.[0] || "?"}
                </div>
              )}
              <div className="chat-bubble" style={{ flex: 1, position: "relative", background: "#1a1a1a", borderRadius: 10, padding: "10px 14px", ...(isCreator ? { borderLeft: `2px solid ${color}` } : {}) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{m.authorName || "Anónimo"}</span>
                  {isCreator && <span style={{ fontSize: 7, fontWeight: 900, background: color + "22", color, padding: "2px 5px", borderRadius: 4 }}>CREADOR</span>}
                  {m.authorRole === "socio" && <span style={{ fontSize: 7, fontWeight: 900, background: "rgba(255,255,255,0.08)", color: "#888", padding: "2px 5px", borderRadius: 4 }}>SOCIO</span>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: "#ddd" }}>{m.content}</div>
                {canDeleteMsg(m) && (
                  <button
                    className="chat-del-btn"
                    onClick={() => deleteMsg(m.id)}
                    aria-label="Eliminar mensaje"
                    style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.4)", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, lineHeight: 1, padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "var(--color-black)", flexShrink: 0 }}>
        {isAuthenticated ? (
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat(input)}
              placeholder="Escribe algo..."
              style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 16px", fontSize: 13, color: "#fff", fontFamily: "var(--font-body)", outline: "none" }}
            />
            <button
              onClick={() => sendChat(input)}
              style={{ background: "#fff", color: "#000", border: "none", padding: "13px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}
            >
              Enviar
            </button>
          </div>
        ) : (
          <button
            onClick={openAuth}
            className="btn-y"
            style={{ width: "100%", fontSize: 13, fontWeight: 800, padding: "13px" }}
          >
            Inicia sesión para chatear ⚡
          </button>
        )}
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
  myVote?: string | null;
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
  const { showToast, openAuth, setTab } = useUIStore();
  const { spendCredits, addXP, voted, setVoted, isAuthenticated } = useUserStore();
  const { sharePost } = useShare();
  const [votes, setVotes] = useState<VoteDecision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/gamification/votes")
      .then((r) => {
        const data: VoteDecision[] = r.data ?? [];
        setVotes(data);
        // Rehydrate the user's previous votes from the server so they persist across reloads
        data.forEach((v) => { if (v.myVote) setVoted(v.id, v.myVote); });
      })
      .catch(() => setVotes([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleVote = async (v: VoteDecision, option: string) => {
    if (voted[v.id]) { showToast("Ya has votado en esta decisión"); return; }
    if (!isAuthenticated) { openAuth(); return; }

    // Optimistic update — UI reacts immediately
    setVoted(v.id, option);
    addXP(v.xpReward);
    setVotes((prev) => prev.map((vote) =>
      vote.id === v.id
        ? { ...vote, results: { ...vote.results, [option]: (vote.results[option] ?? 0) + 1 } }
        : vote
    ));
    const cashback = v.votationType === "encuesta" ? 2 : v.votationType === "pregunta" ? 4 : 0;
    showToast(cashback > 0 ? `+${cashback} ⚡ · +${v.xpReward} XP` : `¡Voto registrado! +${v.xpReward} XP`);

    try {
      await api.post(`/gamification/votes/${v.id}/cast`, { selectedOption: option });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (typeof msg === "string" && msg.includes("Insufficient")) { showToast("Necesitas más créditos ⚡"); setTab("store"); }
    }
  };

  const getPct = (results: Record<string, number>, opt: string) => {
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    return total === 0 ? 0 : Math.round(((results[opt] || 0) / total) * 100);
  };

  if (loading) return (
    <div className="community-vote" style={{ padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Skel w={220} h={22} r={4} style={{ marginBottom: 8 }} />
        <Skel w={200} h={13} r={4} />
      </div>
      {/* Vote cards */}
      {[0, 1].map((i) => (
        <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#1a1a1a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 0" }}>
            <Skel w={60} h={10} r={4} />
            <Skel w={36} h={16} r={4} />
          </div>
          <div style={{ padding: "12px 16px 16px" }}>
            <Skel w="75%" h={16} r={4} style={{ marginBottom: 16 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[0, 1, 2].map((j) => (
                <Skel key={j} h={46} r={8} style={{ width: "100%" }} />
              ))}
            </div>
          </div>
          <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end" }}>
            <Skel w={70} h={11} r={4} />
          </div>
        </div>
      ))}
    </div>
  );

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
  const { communityTab, setCommunityTab, openUserSearch } = useUIStore();
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

      {/* Online count + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-green)", flexShrink: 0 }} />
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted)", flex: 1 }}>{onlineCount} fans conectados ahora</div>
        <button
          onClick={openUserSearch}
          style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
        >
          <span style={{ fontSize: 13 }}>🔍</span>
          Buscar fans
        </button>
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
