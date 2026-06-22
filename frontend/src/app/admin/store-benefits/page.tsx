"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

// Resize + compress an image file to a base64 data URL (stored directly in imageUrl).
function resizeImageToBase64(file: File, maxPx = 400): Promise<string> {
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

interface Benefit {
  id: string;
  name: string;
  description?: string;
  discount?: string;
  emoji?: string;
  imageUrl?: string;
  color?: string;
  link?: string;
  displayOrder: number;
  isActive: boolean;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

const EMPTY_FORM = { name: "", description: "", discount: "", emoji: "🏀", imageUrl: "", color: "#F0E040", link: "", displayOrder: 0, isActive: true };

export default function StoreBenefitsPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/admin/store-benefits`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setBenefits(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, displayOrder: benefits.length });
    setShowForm(true);
  }

  function openEdit(b: Benefit) {
    setEditId(b.id);
    setForm({
      name: b.name, description: b.description ?? "", discount: b.discount ?? "",
      emoji: b.emoji ?? "🏀", imageUrl: b.imageUrl ?? "", color: b.color ?? "#F0E040",
      link: b.link ?? "", displayOrder: b.displayOrder ?? 0, isActive: b.isActive,
    });
    setShowForm(true);
  }

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

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { await alert({ title: "Error", message: "El nombre es obligatorio.", confirmLabel: "Ok" }); return; }
    setSaving(true);
    const url = editId ? `${API}/admin/store-benefits/${editId}` : `${API}/admin/store-benefits`;
    const method = editId ? "PATCH" : "POST";
    const payload: Record<string, unknown> = { ...form };
    if (!form.imageUrl) delete payload.imageUrl;
    if (!form.link) delete payload.link;
    try {
      const r = await fetch(url, { method, headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      setShowForm(false);
      load();
    } catch {
      await alert({ title: "Error", message: "No se pudo guardar el beneficio.", confirmLabel: "Entendido" });
    } finally { setSaving(false); }
  }

  async function toggleActive(b: Benefit) {
    await fetch(`${API}/admin/store-benefits/${b.id}`, { method: "PATCH", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !b.isActive }) });
    load();
  }

  async function remove(b: Benefit) {
    const ok = await confirm({ title: "Eliminar beneficio", message: `¿Eliminar "${b.name}"?`, confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    await fetch(`${API}/admin/store-benefits/${b.id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  return (
    <div className="admin-page">
      {ConfirmUI}

      <div className="admin-header">
        <h1 className="admin-title">BENEFICIOS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({benefits.length})</span></h1>
        <button onClick={openCreate} className="admin-btn-primary">+ Nuevo beneficio</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#666", padding: 32 }}>Cargando…</div>
        ) : benefits.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: 48, background: "#141414", borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
            <p>No hay beneficios. Crea el primero.</p>
          </div>
        ) : benefits.map((b) => (
          <div key={b.id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: b.imageUrl ? "#1e1e1e" : `linear-gradient(135deg, ${b.color || "#F0E040"}, ${b.color || "#F0E040"}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, overflow: "hidden" }}>
                  {b.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={b.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (b.emoji || "🏀")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{b.name}</span>
                    {b.discount && <span style={{ fontSize: 12, fontWeight: 800, color: "#F0E040" }}>{b.discount}</span>}
                    {b.isActive
                      ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700 }}>Visible</span>
                      : <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(100,100,100,0.15)", color: "#666", fontWeight: 700 }}>Oculto</span>}
                  </div>
                  {b.description && <div style={{ fontSize: 12, color: "#888" }}>{b.description}</div>}
                  {b.link && <div style={{ fontSize: 11, color: "#5b8cff", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🔗 {b.link}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                <button onClick={() => toggleActive(b)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc" }}>
                  {b.isActive ? "Ocultar" : "Mostrar"}
                </button>
                <button onClick={() => openEdit(b)} className="admin-btn-edit">Editar</button>
                <button onClick={() => remove(b)} className="admin-btn-delete">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }}>
            <h2>{editId ? "EDITAR BENEFICIO" : "NUEVO BENEFICIO"}</h2>
            <form onSubmit={saveForm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="admin-label">Nombre de la tienda</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="admin-input" placeholder="Ej: Basketball Emotion" /></div>
              <div><label className="admin-label">Descripción</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" placeholder="Ej: La mayor tienda de basket de España" /></div>
              {/* Logo / imagen */}
              <div>
                <label className="admin-label">Logo / imagen (opcional)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: form.imageUrl ? "#1e1e1e" : `linear-gradient(135deg, ${form.color || "#F0E040"}, ${form.color || "#F0E040"}99)`, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                    {form.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (form.emoji || "🏀")}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="admin-btn-ghost">
                    {uploadingImg ? "Subiendo..." : form.imageUrl ? "Cambiar" : "📷 Subir logo"}
                  </button>
                  {form.imageUrl && (
                    <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="admin-btn-ghost" style={{ color: "#ef4444" }}>Quitar</button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Si no subes imagen, se muestra el emoji con el color de fondo.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label className="admin-label">Descuento</label><input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="admin-input" placeholder="Ej: 5%" /></div>
                <div><label className="admin-label">Emoji (sin imagen)</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="admin-input" placeholder="🏀" /></div>
                <div><label className="admin-label">Color de fondo</label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="admin-input" style={{ padding: 4, height: 40 }} /></div>
                <div><label className="admin-label">Orden</label><input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="admin-input" /></div>
              </div>
              <div><label className="admin-label">Link a la tienda / descuento</label><input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="admin-input" placeholder="https://..." /></div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ccc", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Visible en la tienda
              </label>
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
