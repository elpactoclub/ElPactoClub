"use client";

import { useEffect, useState, useCallback } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorRole: "fan" | "socio" | "creator";
  likeCount?: number;
  commentCount?: number;
  createdAt: string;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export default function CreatorPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    fetch(`${API}/admin/posts`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data: Post[]) => setPosts(data.filter((p) => p.authorRole === "creator")))
      .catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function publishPost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/community/posts`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), imageUrl: imageUrl.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      setImageUrl("");
      setShowForm(false);
      load();
    } catch {
      alert("Error al publicar");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">MIS POSTS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({posts.length})</span></h1>
        <button onClick={() => setShowForm(true)} className="admin-btn-primary" style={{ background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "#fff" }}>+ Nuevo post</button>
      </div>

      {posts.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <p style={{ color: "#888", fontSize: 13.5, maxWidth: 360, margin: "0 auto" }}>
            Aún no has publicado nada. Crea tu primer post para llegar a tus fans.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => (
            <div key={p.id} className="admin-card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 11, color: "#666" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="admin-badge admin-badge-purple">CREATOR</span>
                  {timeAgo(p.createdAt)}
                </span>
                <span>
                  ❤️ {p.likeCount ?? 0} · 💬 {p.commentCount ?? 0}
                </span>
              </div>
              <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.content}</div>
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 10, marginTop: 12 }} />
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 560 }}>
            <h2>NUEVO POST</h2>
            <form onSubmit={publishPost} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="admin-label">¿Qué quieres compartir con tus fans?</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={5}
                  placeholder="Escribe algo aquí..."
                  className="admin-input"
                  style={{ resize: "vertical", minHeight: 100, fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label className="admin-label">URL imagen (opcional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="admin-input"
                />
              </div>
              <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
                <button type="submit" disabled={posting || !content.trim()} className="admin-btn-primary" style={{ flex: 1, background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "#fff" }}>
                  {posting ? "Publicando..." : "Publicar"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
