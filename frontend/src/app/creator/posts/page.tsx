"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Skel from "@/components/ui/Skel";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

function resizeImageToBase64(file: File, maxPx = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface MyPost {
  id: string;
  content: string;
  type: string;
  likesCount: number;
  pollOptions?: string[];
  pollVotes?: Record<string, number>;
  pollClosed?: boolean;
  imageUrl?: string;
  createdAt: string;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}`, "Content-Type": "application/json" };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

const TYPE_COLOR: Record<string, string> = { text: "#60A5FA", poll: "#F0E040", image: "#22C55E", challenge: "#F59E0B" };
const TYPE_LABEL: Record<string, string> = { text: "Texto", poll: "Encuesta", image: "Imagen", challenge: "Reto" };

export default function CreatorPostsPage() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"posts" | "analytics">("posts");
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"text" | "image" | "poll">("text");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem("el_pacto_token");
    fetch(`${API}/admin/my-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setPosts(data?.posts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function publishPost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (type === "poll" && pollOptions.filter((o) => o.trim()).length < 2) {
      alert("Añade al menos 2 opciones a la encuesta");
      return;
    }
    setPosting(true);
    try {
      const body: Record<string, unknown> = { content: content.trim(), type };
      if (type === "image" && imageUrl.trim()) body.imageUrl = imageUrl.trim();
      if (type === "poll") body.pollOptions = pollOptions.filter((o) => o.trim());
      const res = await fetch(`${API}/community/posts`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setContent(""); setImageUrl(""); setPollOptions(["", ""]); setType("text"); setShowForm(false); setUploading(false);
      load();
    } catch { alert("Error al publicar"); }
    finally { setPosting(false); }
  }

  async function deletePost(id: string) {
    if (!confirm("¿Eliminar este post?")) return;
    setDeleting(id);
    const r = await fetch(`${API}/community/posts/${id}`, { method: "DELETE", headers: authHeader() });
    if (r.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  const sortedByLikes = [...posts].sort((a, b) => b.likesCount - a.likesCount);
  const maxLikes = sortedByLikes[0]?.likesCount || 1;

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 2, margin: 0 }}>
            MIS POSTS <span style={{ color: "#777", fontSize: 15, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({posts.length})</span>
          </h1>
          <div style={{ display: "flex", gap: 3, background: "#1a1a1a", borderRadius: 8, padding: 3 }}>
            {(["posts", "analytics"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: view === v ? "#333" : "transparent", color: view === v ? "#fff" : "#666" }}>
                {v === "posts" ? "Posts" : "Analytics"}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "#fff" }}
        >
          + Nuevo post
        </button>
      </div>

      {view === "analytics" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {posts.length === 0 && <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Sin posts aún</div>}

          {posts.length > 0 && (() => {
            const byType = posts.reduce((acc, p) => {
              if (!acc[p.type]) acc[p.type] = { count: 0, likes: 0 };
              acc[p.type].count++;
              acc[p.type].likes += p.likesCount;
              return acc;
            }, {} as Record<string, { count: number; likes: number }>);

            const totalLikes = posts.reduce((s, p) => s + p.likesCount, 0);
            const avgLikes = posts.length > 0 ? (totalLikes / posts.length).toFixed(1) : "0";
            const bestType = Object.entries(byType).sort((a, b) => (b[1].likes / b[1].count) - (a[1].likes / a[1].count))[0];

            return (
              <>
                {/* Resumen */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                  {[
                    { label: "Total posts", value: posts.length, color: "#60A5FA" },
                    { label: "Likes totales", value: totalLikes, color: "#EC4899" },
                    { label: "Media / post", value: avgLikes, color: "#22C55E" },
                    { label: "Mejor tipo", value: TYPE_COLOR[bestType?.[0]] ? bestType[0] : "—", color: TYPE_COLOR[bestType?.[0]] ?? "#888" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#141414", border: `1px solid ${s.color}22`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: s.color, lineHeight: 1, textTransform: "capitalize" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Rendimiento por tipo */}
                <div>
                  <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Rendimiento por tipo</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(byType).sort((a, b) => (b[1].likes / b[1].count) - (a[1].likes / a[1].count)).map(([type, data]) => {
                      const avg = data.count > 0 ? Math.round(data.likes / data.count) : 0;
                      const maxAvg = Math.max(...Object.values(byType).map((d) => Math.round(d.likes / d.count)), 1);
                      const color = TYPE_COLOR[type] ?? "#888";
                      return (
                        <div key={type} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: color + "22", color }}>{TYPE_LABEL[type] ?? type}</span>
                              <span style={{ fontSize: 11, color: "#555" }}>{data.count} post{data.count !== 1 ? "s" : ""}</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#EC4899" }}>❤ {avg} media</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${Math.round((avg / maxAvg) * 100)}%`, background: color, borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top posts */}
                <div>
                  <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Top posts por likes</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sortedByLikes.map((p, i) => (
                      <div key={p.id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 7 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "#F0E040" : i === 1 ? "#aaa" : i === 2 ? "#A0522D" : "#555", width: 20, flexShrink: 0 }}>#{i + 1}</span>
                          <p style={{ margin: 0, fontSize: 13, color: "#ccc", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.content}</p>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#EC4899", flexShrink: 0 }}>❤ {p.likesCount}</span>
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginLeft: 32 }}>
                          <div style={{ height: "100%", width: `${Math.round((p.likesCount / maxLikes) * 100)}%`, background: "linear-gradient(90deg, #A78BFA, #EC4899)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Skel w={44} h={16} r={4} />
                  <Skel w={50} h={11} r={4} />
                </div>
                <Skel w={70} h={24} r={6} />
              </div>
              <Skel h={13} style={{ width: `${55 + (i % 3) * 12}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {posts.map((p) => (
            <div key={p.id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: (TYPE_COLOR[p.type] ?? "#888") + "22", color: TYPE_COLOR[p.type] ?? "#888" }}>{p.type}</span>
                  <span style={{ fontSize: 11, color: "#555" }}>{timeAgo(p.createdAt)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#EC4899" }}>❤ {p.likesCount}</span>
                  <button onClick={() => deletePost(p.id)} disabled={deleting === p.id} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                    {deleting === p.id ? "…" : "Eliminar"}
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "#ddd", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.content}</p>
              {p.pollOptions && p.pollOptions.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                  {p.pollOptions.map((opt) => {
                    const votes = p.pollVotes?.[opt] ?? 0;
                    const total = Object.values(p.pollVotes ?? {}).reduce((s, v) => s + v, 0);
                    const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                    return (
                      <div key={opt} style={{ position: "relative", background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "7px 12px", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "rgba(240,224,64,0.1)" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                          <span style={{ fontSize: 12, color: "#ddd" }}>{opt}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent)" }}>{pct}% ({votes})</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                    {Object.values(p.pollVotes ?? {}).reduce((s, v) => s + v, 0)} votos
                    {p.pollClosed && " · Encuesta cerrada"}
                  </div>
                </div>
              )}
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8, marginTop: 10 }} />
              )}
            </div>
          ))}
          {posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
              <p style={{ fontSize: 13.5 }}>Aún no has publicado nada.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 540 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, margin: "0 0 20px" }}>NUEVO POST</h2>
            <form onSubmit={publishPost} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", marginBottom: 8 }}>Tipo</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["text", "image", "poll"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setType(t)} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: type === t ? "none" : "1px solid rgba(255,255,255,0.12)", background: type === t ? "linear-gradient(135deg, #A78BFA, #EC4899)" : "#1a1a1a", color: type === t ? "#fff" : "#aaa" }}>
                      {t === "text" ? "📝 Texto" : t === "image" ? "🖼 Imagen" : "📊 Encuesta"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>
                  {type === "poll" ? "Pregunta" : "Contenido"}
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={3}
                  placeholder={type === "poll" ? "¿Cuál es tu pregunta?" : "¿Qué quieres compartir?"}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13.5, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              {type === "image" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", marginBottom: 8 }}>Imagen</div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      e.target.value = "";
                      setUploading(true);
                      try { setImageUrl(await resizeImageToBase64(file)); }
                      catch { /* noop */ }
                      finally { setUploading(false); }
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: 10, background: "#1a1a1a", border: "1px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🖼</div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", color: "#ccc" }}>
                        {uploading ? "Procesando…" : imageUrl ? "Cambiar foto" : "📷 Subir foto"}
                      </button>
                      {imageUrl && (
                        <button type="button" onClick={() => setImageUrl("")}
                          style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {type === "poll" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", marginBottom: 8 }}>Opciones</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {pollOptions.map((opt, i) => (
                      <div key={i} style={{ display: "flex", gap: 6 }}>
                        <input value={opt} onChange={(e) => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }}
                          placeholder={`Opción ${i + 1}`}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, outline: "none" }}
                        />
                        {pollOptions.length > 2 && (
                          <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                            style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer" }}>✕</button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <button type="button" onClick={() => setPollOptions([...pollOptions, ""])}
                        style={{ padding: "7px", borderRadius: 8, background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", color: "#666", cursor: "pointer", fontSize: 12 }}>+ Añadir opción</button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button type="submit" disabled={posting || !content.trim()} style={{ flex: 1, padding: "11px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "#fff", opacity: posting || !content.trim() ? 0.5 : 1 }}>
                  {posting ? "Publicando…" : "Publicar"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
