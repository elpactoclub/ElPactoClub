"use client";

// EN: Admin projects page for creating and managing social projects that fans can donate credits to and vote on.
// ES: Página de proyectos del admin para crear y gestionar proyectos sociales a los que los fans pueden donar créditos y votar.

import { useEffect, useState, useCallback, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

function resizeImageToBase64(file: File, maxPx = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > height && width > maxPx) { height = Math.round((height * maxPx) / width); width = maxPx; }
      else if (height > maxPx) { width = Math.round((width * maxPx) / height); height = maxPx; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no ctx")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface Project {
  id: string;
  slug: string;
  emoji?: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  color?: string;
  badgeLabel?: string;
  displayOrder: number;
  isActive: boolean;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

const EMPTY_FORM = { title: "", emoji: "🌍", imageUrl: "", subtitle: "", summary: "", description: "", color: "#F59E0B", badgeLabel: "", displayOrder: 0, isActive: true };

// EN: Projects admin page component managing social projects with CRUD operations and image upload.
// ES: Componente de página de proyectos del admin que gestiona proyectos sociales con operaciones CRUD y subida de imágenes.
export default function ProjectsPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setForm((f) => ({ ...f, imageUrl: base64 }));
    } catch {
      await alert({ title: "Error", message: "No se pudo procesar la imagen.", confirmLabel: "Ok" });
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/admin/projects`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, displayOrder: projects.length });
    setShowForm(true);
  }

  function openEdit(p: Project) {
    setEditId(p.id);
    setForm({
      title: p.title, emoji: p.emoji ?? "🌍", imageUrl: p.imageUrl ?? "", subtitle: p.subtitle ?? "", summary: p.summary ?? "",
      description: p.description ?? "", color: p.color ?? "#F59E0B", badgeLabel: p.badgeLabel ?? "",
      displayOrder: p.displayOrder ?? 0, isActive: p.isActive,
    });
    setShowForm(true);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { await alert({ title: "Error", message: "El título es obligatorio.", confirmLabel: "Ok" }); return; }
    setSaving(true);
    const url = editId ? `${API}/admin/projects/${editId}` : `${API}/admin/projects`;
    const method = editId ? "PATCH" : "POST";
    try {
      const r = await fetch(url, { method, headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      setShowForm(false);
      load();
    } catch {
      await alert({ title: "Error", message: "No se pudo guardar el proyecto.", confirmLabel: "Entendido" });
    } finally { setSaving(false); }
  }

  async function toggleActive(p: Project) {
    await fetch(`${API}/admin/projects/${p.id}`, { method: "PATCH", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    load();
  }

  async function remove(p: Project) {
    const ok = await confirm({ title: "Eliminar proyecto", message: `¿Eliminar "${p.title}"?`, detail: "El chat y donaciones asociados quedarán huérfanos.", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    await fetch(`${API}/admin/projects/${p.id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  return (
    <div className="admin-page">
      {ConfirmUI}

      <div className="admin-header">
        <h1 className="admin-title">PROYECTOS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({projects.length})</span></h1>
        <button onClick={openCreate} className="admin-btn-primary">+ Nuevo proyecto</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#666", padding: 32 }}>Cargando…</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: 48, background: "#141414", borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
            <p>No hay proyectos. Crea el primero.</p>
          </div>
        ) : projects.map((p) => {
          const color = p.color || "#F59E0B";
          return (
            <div key={p.id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: p.imageUrl ? "#1e1e1e" : `${color}26`, border: `1px solid ${color}4d`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, overflow: "hidden" }}>
                    {p.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (p.emoji || "🌍")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{p.title}</span>
                      <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>/{p.slug}</span>
                      {p.isActive
                        ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700 }}>Visible</span>
                        : <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(100,100,100,0.15)", color: "#666", fontWeight: 700 }}>Oculto</span>}
                    </div>
                    {p.subtitle && <div style={{ fontSize: 12, color: "#aaa", marginBottom: 2 }}>{p.subtitle}</div>}
                    {p.summary && <div style={{ fontSize: 12, color: "#777" }}>{p.summary}</div>}
                    {p.badgeLabel && <div style={{ fontSize: 11, color, marginTop: 4 }}>🏅 {p.badgeLabel}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                  <button onClick={() => toggleActive(p)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc" }}>
                    {p.isActive ? "Ocultar" : "Mostrar"}
                  </button>
                  <button onClick={() => openEdit(p)} className="admin-btn-edit">Editar</button>
                  <button onClick={() => remove(p)} className="admin-btn-delete">Eliminar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <h2>{editId ? "EDITAR PROYECTO" : "NUEVO PROYECTO"}</h2>
            <form onSubmit={saveForm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
                <div><label className="admin-label">Emoji</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="admin-input" placeholder="🌍" /></div>
                <div><label className="admin-label">Título</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="admin-input" placeholder="Ej: India · Dribble Academy" /></div>
              </div>
              {/* Imagen del proyecto */}
              <div>
                <label className="admin-label">Imagen (opcional)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: form.imageUrl ? "#1e1e1e" : `${form.color || "#F59E0B"}26`, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                    {form.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (form.emoji || "🌍")}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="admin-btn-ghost">
                    {uploadingImg ? "Subiendo..." : form.imageUrl ? "Cambiar imagen" : "📷 Subir imagen"}
                  </button>
                  {form.imageUrl && (
                    <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="admin-btn-ghost" style={{ color: "#ef4444" }}>Quitar</button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Si no subes imagen, se usa el emoji con el color.</div>
              </div>
              <div><label className="admin-label">Subtítulo</label><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="admin-input" placeholder="Ej: Llevamos el baloncesto a India" /></div>
              <div><label className="admin-label">Resumen (texto corto de la tarjeta)</label><textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="admin-input" rows={2} style={{ resize: "vertical" }} placeholder="Frase breve que aparece en la tarjeta de El Pacto" /></div>
              <div><label className="admin-label">Descripción completa (página del proyecto)</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" rows={4} style={{ resize: "vertical" }} placeholder="Texto completo que se muestra al abrir el proyecto" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label className="admin-label">Color</label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="admin-input" style={{ padding: 4, height: 40 }} /></div>
                <div><label className="admin-label">Orden</label><input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="admin-input" /></div>
              </div>
              <div><label className="admin-label">Badge al donar</label><input value={form.badgeLabel} onChange={(e) => setForm({ ...form, badgeLabel: e.target.value })} className="admin-input" placeholder="Ej: Dribble Spirit 🇮🇳" /></div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ccc", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Visible en El Pacto
              </label>
              {editId && <div style={{ fontSize: 11, color: "#666" }}>Nota: el identificador interno (slug) no cambia al editar, para no romper el chat ni las donaciones del proyecto.</div>}
              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button type="submit" disabled={saving} className="admin-btn-primary" style={{ flex: 1 }}>{saving ? "Guardando..." : "Guardar"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
