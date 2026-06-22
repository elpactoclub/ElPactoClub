"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: string;
  xp: number;
  level: string;
  city?: string;
  bio?: string;
  isSocio: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
}

interface ProfilePost {
  id: string;
  authorId: string;
  type: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount?: number;
  reactions?: Record<string, number>;
  createdAt: string;
}

const LEVEL_COLOR: Record<string, string> = {
  Rookie: "#888",
  Starter: "#60A5FA",
  MVP: "#A78BFA",
  Leyenda: "#F0E040",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function UserProfileModal() {
  const { userProfileId, closeUserProfile, openAuth, showToast, openDMWithUser, openViewPost } = useUIStore();
  const { isAuthenticated, id: myId, role: myRole } = useUserStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [tab, setTab] = useState<"posts" | "liked">("posts");
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    if (!userProfileId) { setProfile(null); return; }
    setLoading(true);
    setConfirmBlock(false);
    setTab("posts");
    api.get(`/users/${userProfileId}/profile`)
      .then((r) => {
        setProfile(r.data);
        setFollowing(r.data.isFollowing);
        setBlocked(!!r.data.isBlocked);
        setFollowersCount(r.data.followersCount);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userProfileId]);

  useEffect(() => {
    if (!userProfileId) { setPosts([]); return; }
    setPostsLoading(true);
    const path = tab === "liked" ? "liked" : "posts";
    api.get(`/community/users/${userProfileId}/${path}`)
      .then((r) => setPosts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, [userProfileId, tab]);

  if (!userProfileId) return null;

  async function toggleFollow() {
    if (!isAuthenticated) { openAuth(); return; }
    setToggling(true);
    try {
      if (following) {
        const r = await api.delete(`/users/${userProfileId}/follow`);
        setFollowing(false);
        setFollowersCount(r.data.followersCount);
      } else {
        const r = await api.post(`/users/${userProfileId}/follow`);
        setFollowing(true);
        setFollowersCount(r.data.followersCount);
      }
    } finally { setToggling(false); }
  }

  async function toggleBlock() {
    if (!isAuthenticated) { openAuth(); return; }
    setToggling(true);
    try {
      if (blocked) {
        await api.delete(`/users/${userProfileId}/block`);
        setBlocked(false);
        showToast("Usuario desbloqueado");
      } else {
        await api.post(`/users/${userProfileId}/block`);
        setBlocked(true);
        setFollowing(false);
        showToast("Usuario bloqueado");
      }
      setConfirmBlock(false);
    } finally { setToggling(false); }
  }

  async function handleDeletePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await api.delete(`/community/posts/${postId}`);
      showToast("Publicación eliminada 🗑");
    } catch {
      showToast("No se pudo eliminar ❌");
    }
  }

  const isMe = myId === userProfileId;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 190, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && closeUserProfile()}
    >
      <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header close */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 14px 0" }}>
          <button onClick={closeUserProfile} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#666", padding: "40px 20px" }}>Cargando perfil...</div>
        ) : profile ? (
          <div style={{ padding: "0 24px 28px" }}>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)" }}>
                {profile.avatar?.startsWith("http") || profile.avatar?.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>{profile.avatar}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{profile.name}</span>
                  {profile.role === "creator" && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "2px 7px", borderRadius: 4, background: "rgba(167,139,250,0.2)", color: "#A78BFA" }}>CREADOR</span>}
                  {profile.isSocio && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "2px 7px", borderRadius: 4, background: "rgba(240,224,64,0.15)", color: "#F0E040" }}>SOCIO</span>}
                </div>
                <div style={{ fontSize: 13, color: LEVEL_COLOR[profile.level] ?? "#888", fontWeight: 600 }}>
                  {profile.level} · {profile.xp.toLocaleString("es")} XP
                </div>
                {profile.city && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>📍 {profile.city}</div>}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.55, margin: "0 0 18px" }}>{profile.bio}</p>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", margin: "0 -24px 20px", padding: "14px 24px" }}>
              {[
                { val: followersCount.toLocaleString("es"), lbl: "Seguidores" },
                { val: profile.followingCount.toLocaleString("es"), lbl: "Siguiendo" },
                { val: profile.xp.toLocaleString("es"), lbl: "XP" },
              ].map((s, i) => (
                <div key={s.lbl} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#555", textTransform: "uppercase", marginTop: 3 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            {!isMe && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {blocked ? (
                  <div style={{ textAlign: "center", fontSize: 12, color: "#888", padding: "10px 0", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
                    Has bloqueado a este usuario. No verás su contenido.
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={toggleFollow}
                      disabled={toggling}
                      style={{
                        flex: 1, padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none",
                        background: following ? "rgba(255,255,255,0.08)" : "var(--color-accent)",
                        color: following ? "#aaa" : "#000",
                        transition: "all 0.15s",
                      }}
                    >
                      {toggling ? "…" : following ? "✓ Siguiendo" : "Seguir"}
                    </button>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) { openAuth(); return; }
                        if (!profile) return;
                        closeUserProfile();
                        openDMWithUser({ id: profile.id, name: profile.name, avatar: profile.avatar, role: profile.role });
                      }}
                      style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff" }}
                    >
                      ✉ Mensaje
                    </button>
                  </div>
                )}

                {confirmBlock ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={toggleBlock}
                      disabled={toggling}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                    >
                      Sí, bloquear
                    </button>
                    <button
                      onClick={() => setConfirmBlock(false)}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#888" }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => blocked ? toggleBlock() : setConfirmBlock(true)}
                    disabled={toggling}
                    style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", color: blocked ? "#888" : "#ef4444" }}
                  >
                    {blocked ? "Desbloquear usuario" : "🚫 Bloquear usuario"}
                  </button>
                )}
              </div>
            )}

            {/* Tabs: posts / me gusta */}
            <div style={{ display: "flex", gap: 8, margin: "20px 0 12px" }}>
              {([["posts", "Publicaciones"], ["liked", "❤ Me gusta"]] as const).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: tab === t ? "none" : "1px solid rgba(255,255,255,0.12)", background: tab === t ? "var(--color-accent)" : "transparent", color: tab === t ? "#000" : "#aaa" }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Posts list */}
            {postsLoading ? (
              <div style={{ textAlign: "center", color: "#666", padding: "20px 0", fontSize: 13 }}>Cargando...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", color: "#666", padding: "24px 0", fontSize: 13 }}>
                {tab === "liked" ? "Aún no ha dado me gusta a ningún post." : "Aún no tiene publicaciones."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {posts.map((p) => {
                  const reactTotal = p.reactions ? Object.values(p.reactions).reduce((a, b) => a + b, 0) : 0;
                  const canDelete = myRole === "admin" || p.authorId === myId;
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openViewPost(p.id)}
                      style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left", width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}
                    >
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.type === "poll" ? "📊 " : ""}{p.content || (p.imageUrl ? "📷 Imagen" : "—")}
                        </div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 3, display: "flex", gap: 12 }}>
                          <span>❤ {p.likesCount}</span>
                          <span>💬 {p.commentsCount ?? 0}</span>
                          {reactTotal > 0 && <span>🔥 {reactTotal}</span>}
                          <span style={{ marginLeft: "auto" }}>{timeAgo(p.createdAt)}</span>
                        </div>
                      </div>
                      {canDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePost(p.id); }}
                          title="Eliminar"
                          style={{ flexShrink: 0, background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 15, padding: "4px 6px", lineHeight: 1 }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#666", padding: "40px 20px" }}>Perfil no encontrado</div>
        )}
      </div>
    </div>
  );
}
