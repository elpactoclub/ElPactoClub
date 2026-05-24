"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

interface Post {
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
  const { viewPostId, closeViewPost, showToast } = useUIStore();
  const { liked, toggleLike, isAuthenticated } = useUserStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollVoted, setPollVoted] = useState<string>("");

  useEffect(() => {
    if (!viewPostId) return;

    setLoading(true);
    api
      .get(`/community/posts`)
      .then((r) => {
        const found = r.data.find((p: Post) => p.id === viewPostId);
        setPost(found || null);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [viewPostId]);

  if (!viewPostId || !post) return null;

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast("Inicia sesión para reaccionar ⚡");
      return;
    }
    toggleLike(post.id);
    try {
      await api.post(`/community/posts/${post.id}/like`);
    } catch {}
  };

  const handlePollVote = async (option: string) => {
    if (pollVoted) {
      showToast("Ya votaste en esta encuesta");
      return;
    }
    if (!isAuthenticated) {
      showToast("Inicia sesión para votar ⚡");
      return;
    }
    setPollVoted(option);
    try {
      await api.post(`/community/posts/${post.id}/vote`, { option });
      showToast(`Votaste: ${option} ✓`);
    } catch {
      showToast("Error al votar");
    }
  };

  const isCreator = post.authorRole === "creator";
  const pollTotal = post.pollVotes ? Object.values(post.pollVotes).reduce((a, b) => a + b, 0) : 0;
  const isLiked = liked[post.id];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && closeViewPost()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#141414",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          maxWidth: 600,
          width: "90%",
          maxHeight: "95vh",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Cargando...</div>
        ) : (
          <>
            {/* Author */}
            <div style={{ padding: "16px 20px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: isCreator ? "linear-gradient(135deg, #F0E040, #FF6B1A)" : "#1e1e1e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: isCreator ? "#000" : "#888",
                  flexShrink: 0,
                }}
              >
                {post.authorAvatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{post.authorName}</span>
                  {isCreator && <span style={{ fontSize: 8, fontWeight: 900, background: "#F0E040", color: "#000", padding: "2px 6px", borderRadius: 4 }}>CREADOR</span>}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>{timeAgo(post.createdAt)}</div>
              </div>
              <button
                onClick={closeViewPost}
                style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "16px 20px 12px", fontSize: 15, lineHeight: 1.55 }}>{post.content}</div>

            {/* Poll */}
            {post.type === "poll" && post.pollOptions && (
              <div style={{ margin: "0 20px 16px", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                {post.pollOptions.map((opt) => {
                  const votes = post.pollVotes?.[opt] ?? 0;
                  const pct = pollTotal > 0 ? Math.round((votes / pollTotal) * 100) : 0;
                  const isVoted = pollVoted === opt;
                  const showPct = !!pollVoted;
                  return (
                    <button
                      key={opt}
                      onClick={() => handlePollVote(opt)}
                      disabled={!!pollVoted}
                      style={{
                        width: "100%",
                        padding: "13px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        cursor: pollVoted ? "default" : "pointer",
                        position: "relative",
                        overflow: "hidden",
                        textAlign: "left",
                      }}
                    >
                      {showPct && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            background: isVoted ? "rgba(240,224,64,0.12)" : "rgba(255,255,255,0.04)",
                            width: `${pct}%`,
                            transition: "width 0.4s ease",
                          }}
                        />
                      )}
                      <span style={{ fontSize: 13, fontWeight: isVoted ? 700 : 400, color: isVoted ? "#F0E040" : "#ddd", position: "relative", zIndex: 1 }}>
                        {isVoted ? "✓ " : ""}
                        {opt}
                      </span>
                      {showPct && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#888", position: "relative", zIndex: 1 }}>
                          {pct}%
                        </span>
                      )}
                    </button>
                  );
                })}
                <div style={{ padding: "10px 16px", fontSize: 11, color: "#888", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  📊 {pollTotal.toLocaleString("es")} votos
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 18, padding: "12px 20px 16px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={handleLike}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 13,
                  color: "#888",
                  fontFamily: "inherit",
                }}
              >
                {isLiked ? "❤️" : "🤍"} <span>{post.likesCount + (isLiked ? 1 : 0)}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
