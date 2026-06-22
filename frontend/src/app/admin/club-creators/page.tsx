"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

// Resize + compress to base64 data URL (stored in photoUrl).
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

interface ClubCreatorCard {
  id: string;
  userId: string;
  name?: string;
  currentName?: string;
  photoUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

interface CreatorUser {
  id: string;
  name: string;
  avatar: string;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

const EMPTY_FORM = { userId: "", photoUrl: "", displayOrder: 0, isActive: true };

export default function ClubCreatorsPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [cards, setCards] = useState<ClubCreatorCard[]>([]);
  const [creatorUsers, setCreatorUsers] = useState<CreatorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/admin/club-creators`, { headers: authHeader() }).then((r) => r.json()),
      fetch(`${API}/admin/creator-users`, { headers: authHeader() }).then((r) => r.json()),
    ])
      .then(([list, users]) => {
        setCards(Array.isArray(list) ? list : []);
        setCreatorUsers(Array.isArray(users) ? users : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, displayOrder: cards.length });
    setShowForm(true);
  }

  function openEdit(c: ClubCreatorCard) {
    setEditId(c.id);
    setForm({ userId: c.userId, photoUrl: c.photoUrl ?? "", displayOrder: c.displayOrder ?? 0, isActive: c.isActive });
    setShowForm(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setForm((f) => ({ ...f, photoUrl: base64 }));
    } catch {
      await alert({ title: "Error", message: "No se pudo procesar la imagen.", confirmLabel: "Ok" });
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) { await alert({ title: "Error", message: "Selecciona la cuenta del creador.", confirmLabel: "Ok" }); return; }
    setSaving(true);
    const url = editId ? `${API}/admin/club-creators/${editId}` : `${API}/admin/club-creators`;
    const method = editId ? "PATCH" : "POST";
    const payload: Record<string, unknown> = { ...form };
    if (!form.photoUrl) delete payload.photoUrl;
    try {
      const r = await fetch(url, { method, headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      setShowForm(false);
      load();
    } catch {
      await alert({ title: "Error", message: "No se pudo guardar.", confirmLabel: "Entendido" });
    } finally { setSaving(false); }
  }

  async function toggleActive(c: ClubCreatorCard) {
    await fetch(`${API}/admin/club-creators/${c.id}`, { method: "PATCH", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  }

  async function remove(c: ClubCreatorCard) {
    const ok = await confirm({ title: "Quitar creador", message: `¿Quitar a "${c.currentName ?? c.name}" de la sección?`, confirmLabel: "Quitar", danger: true });
    if (!ok) return;
    await fetch(`${API}/admin/club-creators/${c.id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  return (
    <div className="admin-page">
      {ConfirmUI}

      <div className="admin-header">
        <h1 className="admin-title">CREADORES DEL CLUB <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({cards.length})</span></h1>
        <button onClick={openCreate} className="admin-btn-primary">+ Añadir creador</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#666", padding: 32 }}>Cargando…</div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: 48, background: "#141414", borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <p>Sin creadores destacados. Añade el primero.</p>
          </div>
        ) : cards.map((c) => (
          <div key={c.id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: "#1e1e1e", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                  {c.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                    : "🏀"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{c.currentName ?? c.name}</span>
                    {c.isActive
                      ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700 }}>Visible</span>
                      : <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(100,100,100,0.15)", color: "#666", fontWeight: 700 }}>Oculto</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#777" }}>Creador {c.photoUrl ? "· foto personalizada" : "· sin foto"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                <button onClick={() => toggleActive(c)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc" }}>
                  {c.isActive ? "Ocultar" : "Mostrar"}
                </button>
                <button onClick={() => openEdit(c)} className="admin-btn-edit">Editar</button>
                <button onClick={() => remove(c)} className="admin-btn-delete">Quitar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 460 }}>
            <h2>{editId ? "EDITAR CREADOR" : "AÑADIR CREADOR"}</h2>
            <form onSubmit={saveForm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="admin-label">Cuenta del creador</label>
                <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required className="admin-input">
                  <option value="">— Selecciona —</option>
                  {creatorUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                {creatorUsers.length === 0 && <div style={{ fontSize: 11, color: "#b45309", marginTop: 6 }}>No hay usuarios con rol &quot;creator&quot;. Asigna el rol en la sección Usuarios primero.</div>}
                <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>El botón &quot;Mensaje&quot; abrirá el chat con esta cuenta. El rol mostrado siempre es &quot;Creador&quot;.</div>
              </div>
              {/* Foto editorial */}
              <div>
                <label className="admin-label">Foto de la tarjeta</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 80, height: 96, borderRadius: 10, background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                    {form.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={form.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                      : "🏀"}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="admin-btn-ghost">
                      {uploadingImg ? "Subiendo..." : form.photoUrl ? "Cambiar foto" : "📷 Subir foto"}
                    </button>
                    {form.photoUrl && (
                      <button type="button" onClick={() => setForm({ ...form, photoUrl: "" })} className="admin-btn-ghost" style={{ color: "#ef4444", marginLeft: 8 }}>Quitar</button>
                    )}
                    <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Foto vertical (tipo retrato) se ve mejor.</div>
                  </div>
                </div>
              </div>
              <div><label className="admin-label">Orden</label><input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="admin-input" /></div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ccc", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Visible en El Pacto
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
