"use client";

// EN: Admin posts page for browsing, moderating and deleting community feed posts with optional image support.
// ES: Página de posts del admin para explorar, moderar y eliminar publicaciones del feed de la comunidad con soporte opcional de imágenes.

import { useEffect, useState, useCallback, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

type ActiveTab = "posts" | "deleted-posts" | "deleted-comments";

interface AdminPost {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorEmail?: string | null;
  type: string;
  content: string;
  pollOptions?: string[];
  pollClosed?: boolean;
  likesCount: number;
  isVisible: boolean;
  imageUrl?: string;
  createdAt: string;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

function SkeletonPostCard() {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <div className="skeleton" style={{ width: 44, height: 18, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 20, height: 20, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 90, height: 13, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 55, height: 13, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: "100%", height: 13, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: "72%", height: 13, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ width: 80, height: 30, borderRadius: 7, flexShrink: 0 }} />
    </div>
  );
}

const TYPE_COLOR: Record<string, string> = {
  text: "#60A5FA",
  poll: "#F0E040",
  challenge: "#F59E0B",
  image: "#22C55E",
};

// EN: Posts admin page component displaying all community posts with delete and moderation controls.
// ES: Componente de página de posts del admin que muestra todas las publicaciones de la comunidad con controles de eliminación y moderación.
export default function PostsPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [authorSearch, setAuthorSearch] = useState("");

  // Deleted items state
  const [deletedPosts, setDeletedPosts] = useState<any[]>([]);
  const [deletedComments, setDeletedComments] = useState<any[]>([]);
  const [deletedPostsLoading, setDeletedPostsLoading] = useState(false);
  const [deletedCommentsLoading, setDeletedCommentsLoading] = useState(false);
  // Create post
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<"text" | "image" | "poll">("text");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newPollOptions, setNewPollOptions] = useState<string[]>(["", ""]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/admin/posts?limit=100`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data) => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeTab === "deleted-posts") {
      setDeletedPostsLoading(true);
      fetch(`${API}/admin/deleted-posts`, { headers: authHeader() })
        .then(r => r.json()).then(d => setDeletedPosts(Array.isArray(d) ? d : []))
        .finally(() => setDeletedPostsLoading(false));
    } else if (activeTab === "deleted-comments") {
      setDeletedCommentsLoading(true);
      fetch(`${API}/admin/deleted-comments`, { headers: authHeader() })
        .then(r => r.json()).then(d => setDeletedComments(Array.isArray(d) ? d : []))
        .finally(() => setDeletedCommentsLoading(false));
    }
  }, [activeTab]);

  async function restorePost(id: string) {
    await fetch(`${API}/admin/deleted-posts/${id}/restore`, { method: "PATCH", headers: authHeader() });
    setDeletedPosts(p => p.filter(m => m.id !== id));
  }

  async function restoreComment(id: string) {
    await fetch(`${API}/admin/deleted-comments/${id}/restore`, { method: "PATCH", headers: authHeader() });
    setDeletedComments(p => p.filter(m => m.id !== id));
  }

  async function deletePost(id: string, preview: string) {
    const ok = await confirm({ title: "Eliminar post", message: "¿Seguro que quieres eliminar este post?", detail: `"${preview}"`, confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    setDeleting(id);
    const r = await fetch(`${API}/admin/posts/${id}`, { method: "DELETE", headers: authHeader() });
    if (r.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  function resetCreate() {
    setNewType("text"); setNewContent(""); setNewImage(""); setNewPollOptions(["", ""]);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API}/community/upload-image`, { method: "POST", headers: authHeader(), body: fd });
      const d = await r.json();
      if (d?.url) setNewImage(d.url);
      else throw new Error();
    } catch {
      await alert({ title: "Error", message: "No se pudo subir la imagen.", confirmLabel: "Ok" });
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function createPost() {
    const content = newContent.trim();
    const opts = newPollOptions.map((o) => o.trim()).filter(Boolean);
    if (newType !== "image" && !content) { await alert({ title: "Falta texto", message: "Escribe el contenido del post.", confirmLabel: "Ok" }); return; }
    if (newType === "image" && !newImage) { await alert({ title: "Falta imagen", message: "Sube una imagen.", confirmLabel: "Ok" }); return; }
    if (newType === "poll" && opts.length < 2) { await alert({ title: "Faltan opciones", message: "La encuesta necesita al menos 2 opciones.", confirmLabel: "Ok" }); return; }
    setCreating(true);
    try {
      const body: Record<string, unknown> = { type: newType, content };
      if (newType === "image") body.imageUrl = newImage;
      if (newType === "poll") body.pollOptions = opts;
      const r = await fetch(`${API}/community/posts`, { method: "POST", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      setShowCreate(false);
      resetCreate();
      load();
    } catch {
      await alert({ title: "Error", message: "No se pudo publicar el post.", confirmLabel: "Entendido" });
    } finally {
      setCreating(false);
    }
  }

  async function closePoll(id: string) {
    setClosing(id);
    const r = await fetch(`${API}/community/posts/${id}/close-poll`, { method: "PATCH", headers: authHeader() });
    if (r.ok) setPosts((prev) => prev.map((p) => p.id === id ? { ...p, pollClosed: true } : p));
    setClosing(null);
  }

  const filtered = posts.filter((p) => {
    if (filter !== "all" && p.type !== filter) return false;
    if (authorSearch) {
      const q = authorSearch.toLowerCase();
      return (p.authorName ?? "").toLowerCase().includes(q) || (p.authorEmail ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const tabBtn = (key: ActiveTab, label: string) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: activeTab === key ? "#F0E040" : "rgba(255,255,255,0.06)", color: activeTab === key ? "#000" : "#888" }}
    >
      {label}
    </button>
  );

  const deletedRow = (item: any, onRestore: (id: string) => void) => (
    <div key={item.id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.authorName}</span>
          <span style={{ fontSize: 10, color: "#555" }}>{item.authorEmail}</span>
        </div>
        <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5, marginBottom: 6 }}>{(item.content ?? "").slice(0, 200)}{(item.content ?? "").length > 200 ? "…" : ""}</div>
        <div style={{ fontSize: 10, color: "#555" }}>Borrado: {new Date(item.deletedAt).toLocaleString("es")}</div>
      </div>
      <button onClick={() => onRestore(item.id)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E", cursor: "pointer", flexShrink: 0 }}>
        Restaurar
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      {ConfirmUI}

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabBtn("posts", "📝 Posts")}
        {tabBtn("deleted-posts", "🗑 Posts Borrados")}
        {tabBtn("deleted-comments", "🗨 Comentarios Borrados")}
      </div>

      {/* ── Deleted posts panel ── */}
      {activeTab === "deleted-posts" && (
        <div style={{ maxHeight: 600, overflowY: "auto", paddingRight: 4 }}>
          {deletedPostsLoading ? (
            <div style={{ color: "#666", textAlign: "center", padding: 40 }}>Cargando...</div>
          ) : deletedPosts.length === 0 ? (
            <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No hay posts borrados</div>
          ) : deletedPosts.map(p => deletedRow(p, restorePost))}
        </div>
      )}

      {/* ── Deleted comments panel ── */}
      {activeTab === "deleted-comments" && (
        <div style={{ maxHeight: 600, overflowY: "auto", paddingRight: 4 }}>
          {deletedCommentsLoading ? (
            <div style={{ color: "#666", textAlign: "center", padding: 40 }}>Cargando...</div>
          ) : deletedComments.length === 0 ? (
            <div style={{ color: "#555", textAlign: "center", padding: 40 }}>No hay comentarios borrados</div>
          ) : deletedComments.map(c => deletedRow(c, restoreComment))}
        </div>
      )}

      {/* ── Posts panel ── */}
      {activeTab === "posts" && <><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 2, margin: 0 }}>
          POSTS <span style={{ color: "#777", fontSize: 15, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({filtered.length})</span>
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => { resetCreate(); setShowCreate(true); }} className="admin-btn-primary">+ Nuevo post</button>
          <input
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            placeholder="Filtrar por autor..."
            style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#fff", outline: "none", width: 180 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "text", "poll", "image", "challenge"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: filter === f ? "none" : "1px solid rgba(255,255,255,0.15)",
                  background: filter === f ? "var(--color-accent)" : "transparent",
                  color: filter === f ? "#000" : "#aaa", textTransform: "capitalize",
                }}
              >
                {f === "all" ? "Todos" : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonPostCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12,
                padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                    padding: "2px 8px", borderRadius: 4,
                    background: (TYPE_COLOR[p.type] ?? "#888") + "22",
                    color: TYPE_COLOR[p.type] ?? "#888",
                  }}>{p.type}</span>
                  {p.pollClosed && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(100,100,100,0.2)", color: "#888" }}>Cerrada</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, overflow: "hidden", flexShrink: 0 }}>
                      {p.authorAvatar?.startsWith("http") || p.authorAvatar?.startsWith("data:")
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.authorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span>{p.authorAvatar ?? "🏀"}</span>}
                    </div>
                    <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{p.authorName ?? "—"}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#555" }}>{new Date(p.createdAt).toLocaleDateString("es")}</span>
                  <span style={{ fontSize: 11, color: "#555" }}>❤ {p.likesCount}</span>
                </div>
                <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>
                  {p.content.length > 220 ? p.content.slice(0, 220) + "…" : p.content}
                </p>
                {p.pollOptions && p.pollOptions.length > 0 && (
                  <div style={{ marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.pollOptions.map((opt) => (
                      <span key={opt} style={{ fontSize: 11, padding: "2px 8px", background: "rgba(240,224,64,0.08)", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 4, color: "var(--color-accent)" }}>{opt}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                {p.type === "poll" && !p.pollClosed && (
                  <button
                    onClick={() => closePoll(p.id)}
                    disabled={closing === p.id}
                    style={{
                      padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      background: "rgba(240,224,64,0.08)", border: "1px solid rgba(240,224,64,0.25)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {closing === p.id ? "…" : "Cerrar encuesta"}
                  </button>
                )}
                <button
                  onClick={() => deletePost(p.id, p.content.slice(0, 60))}
                  disabled={deleting === p.id}
                  style={{
                    padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                    color: "#ef4444",
                  }}
                >
                  {deleting === p.id ? "…" : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Sin posts</div>
          )}
        </div>
      )}

      {/* Create post modal */}
      {activeTab === "posts" && showCreate && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }}>
            <div>
              <h2>NUEVO POST</h2>
              <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>Se publica como el club y se notifica a todos.</p>
            </div>
            {/* Type selector */}
            <div style={{ display: "flex", gap: 8 }}>
              {([["text", "📝 Texto"], ["image", "🖼 Imagen"], ["poll", "📊 Encuesta"]] as const).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  style={{ flex: 1, padding: "10px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: newType === t ? "none" : "1px solid rgba(255,255,255,0.12)", background: newType === t ? "var(--color-accent)" : "transparent", color: newType === t ? "#000" : "#aaa" }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Image */}
            {newType === "image" && (
              <div>
                <label className="admin-label">Imagen</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 10, background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {newImage
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={newImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "🖼"}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="admin-btn-ghost">
                    {uploadingImg ? "Subiendo..." : newImage ? "Cambiar imagen" : "📷 Subir imagen"}
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="admin-label">{newType === "image" ? "Texto (opcional)" : newType === "poll" ? "Pregunta" : "Mensaje"}</label>
              <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} className="admin-input" style={{ resize: "vertical" }} placeholder={newType === "poll" ? "¿Qué quieres preguntar?" : "Escribe el anuncio..."} />
            </div>

            {/* Poll options */}
            {newType === "poll" && (
              <div>
                <label className="admin-label">Opciones</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {newPollOptions.map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input value={opt} onChange={(e) => setNewPollOptions((prev) => prev.map((o, j) => j === i ? e.target.value : o))} className="admin-input" placeholder={`Opción ${i + 1}`} style={{ flex: 1 }} />
                      {newPollOptions.length > 2 && (
                        <button type="button" onClick={() => setNewPollOptions((prev) => prev.filter((_, j) => j !== i))} className="admin-btn-ghost" style={{ color: "#888", padding: "4px 8px" }}>−</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewPollOptions((prev) => [...prev, ""])} className="admin-btn-ghost" style={{ fontSize: 11, alignSelf: "flex-start" }}>+ Opción</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button onClick={createPost} disabled={creating || uploadingImg} className="admin-btn-primary" style={{ flex: 1 }}>{creating ? "Publicando..." : "Publicar"}</button>
              <button onClick={() => setShowCreate(false)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
