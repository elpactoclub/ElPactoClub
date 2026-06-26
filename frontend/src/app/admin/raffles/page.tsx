"use client";

// EN: Admin raffles page for creating and managing club giveaways: prizes, credit costs, draw dates and winner selection.
// ES: Página de sorteos del admin para crear y gestionar sorteos del club: premios, costes en créditos, fechas de sorteo y selección de ganadores.

import { useEffect, useState, useCallback, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

// Resize + compress an image file to a base64 data URL (stored directly in prizeImageUrl).
function resizeImageToBase64(file: File, maxPx = 800): Promise<string> {
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
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface AdminRaffle {
  id: string;
  title: string;
  description?: string;
  prizeImageUrl?: string;
  prizeValue: number;
  ticketCost: number;
  xpReward: number;
  participantCount: number;
  isActive: boolean;
  audience?: string;
  winnerId?: string;
  winnerName?: string;
  winnerEmail?: string;
  drawDate?: string;
  month?: string;
  createdAt: string;
}

interface RaffleEntryRow {
  userId: string;
  name: string;
  avatar: string;
  email: string;
  city: string | null;
  country: string | null;
  isSocio: boolean;
  tickets: number;
  createdAt: string;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function SkeletonCard() {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px" }}>
      <div className="skeleton" style={{ width: "50%", height: 16, borderRadius: 4, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: "30%", height: 13, borderRadius: 4, marginBottom: 14 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ flex: 1, height: 40, borderRadius: 8 }} />)}
      </div>
    </div>
  );
}

const EMPTY_FORM = { title: "", description: "", prizeImageUrl: "", prizeValue: 0, ticketCost: 75, xpReward: 1, month: "", drawDate: "", audience: "all" };

// EN: Raffles admin page component listing active and past giveaways with create/edit/draw-winner/delete actions.
// ES: Componente de página de sorteos del admin que lista sorteos activos y pasados con acciones de crear/editar/sortear ganador/eliminar.
export default function RafflesPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [raffles, setRaffles] = useState<AdminRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRaffle, setEditRaffle] = useState<AdminRaffle | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [entriesRaffle, setEntriesRaffle] = useState<AdminRaffle | null>(null);
  const [entries, setEntries] = useState<RaffleEntryRow[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  async function openEntries(r: AdminRaffle) {
    setEntriesRaffle(r);
    setEntries([]);
    setLoadingEntries(true);
    try {
      const res = await fetch(`${API}/admin/raffles/${r.id}/entries`, { headers: authHeader() });
      const d = await res.json();
      setEntries(Array.isArray(d) ? d : []);
    } catch {
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }

  function downloadEntriesCsv() {
    if (!entriesRaffle || entries.length === 0) return;
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["Nombre", "Email", "Ciudad", "País", "Socio", "Tickets", "Participó el"];
    const lines = entries.map((a) => [
      a.name, a.email, a.city ?? "", a.country ?? "", a.isSocio ? "Sí" : "No", a.tickets,
      new Date(a.createdAt).toLocaleString("es-ES"),
    ].map(esc).join(","));
    const csv = "﻿" + [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = entriesRaffle.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.href = url;
    a.download = `participantes-${safe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setForm((f) => ({ ...f, prizeImageUrl: base64 }));
    } catch {
      await alert({ title: "Error", message: "No se pudo procesar la imagen.", confirmLabel: "Ok" });
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/admin/raffles`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setRaffles(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditRaffle(null);
    const now = new Date();
    setForm({ ...EMPTY_FORM, month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` });
    setShowForm(true);
  }

  function openEdit(r: AdminRaffle) {
    setEditRaffle(r);
    setForm({ title: r.title, description: r.description ?? "", prizeImageUrl: r.prizeImageUrl ?? "", prizeValue: r.prizeValue, ticketCost: r.ticketCost, xpReward: r.xpReward, month: r.month ?? "", drawDate: r.drawDate ? r.drawDate.slice(0, 10) : "", audience: r.audience ?? "all" });
    setShowForm(true);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (form.prizeValue <= 0) { await alert({ title: "Error", message: "El valor del premio debe ser mayor que 0.", confirmLabel: "Ok" }); return; }
    setSaving(true);
    const url = editRaffle ? `${API}/admin/raffles/${editRaffle.id}` : `${API}/admin/raffles`;
    const method = editRaffle ? "PATCH" : "POST";
    const payload: Record<string, unknown> = { ...form };
    if (!form.drawDate) delete payload.drawDate;       // empty string breaks the Date column
    if (!form.prizeImageUrl) delete payload.prizeImageUrl;
    try {
      const r = await fetch(url, { method, headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      setShowForm(false);
      load();
    } catch {
      await alert({ title: "Error", message: "No se pudo guardar el sorteo.", confirmLabel: "Entendido" });
    } finally { setSaving(false); }
  }

  async function draw(id: string, title: string) {
    const ok = await confirm({ title: "Realizar sorteo", message: `¿Sortear ganador de "${title}"?`, detail: "Se seleccionará un ganador al azar. El sorteo se cerrará.", confirmLabel: "Sortear" });
    if (!ok) return;
    setDrawing(id);
    try {
      const r = await fetch(`${API}/admin/raffles/${id}/draw`, { method: "POST", headers: authHeader() });
      const data = await r.json();
      if (r.ok) {
        load();
        await alert({ title: "¡Ganador seleccionado! 🎉", message: `${data.winnerName}`, confirmLabel: "Perfecto" });
      } else {
        await alert({ title: "Error", message: data.message ?? "No se pudo realizar el sorteo.", confirmLabel: "Entendido", danger: true });
      }
    } finally { setDrawing(null); }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`${API}/admin/raffles/${id}`, { method: "PATCH", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    load();
  }

  async function deleteRaffle(id: string, title: string) {
    const ok = await confirm({ title: "Eliminar sorteo", message: `¿Eliminar "${title}"?`, detail: "Se borrarán también todas las participaciones.", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    await fetch(`${API}/admin/raffles/${id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  return (
    <div className="admin-page">
      {ConfirmUI}

      <div className="admin-header">
        <h1 className="admin-title">SORTEOS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({raffles.length})</span></h1>
        <button onClick={openCreate} className="admin-btn-primary">+ Nuevo sorteo</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) :
         raffles.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: 48, background: "#141414", borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
            <p>No hay sorteos. Crea el primero.</p>
          </div>
        ) : raffles.map((r) => (
          <div key={r.id} style={{ background: "#141414", border: `1px solid ${r.winnerId ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1e1e1e", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {r.prizeImageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={r.prizeImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "🎁"}
                  </div>
                  <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{r.title}</span>
                  {r.winnerId
                    ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700 }}>✓ Finalizado</span>
                    : r.isActive
                      ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(240,224,64,0.12)", color: "#F0E040", fontWeight: 700 }}>Activo</span>
                      : <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(100,100,100,0.15)", color: "#888", fontWeight: 700 }}>Pausado</span>}
                  {r.month && <span style={{ fontSize: 9, color: "#555" }}>{r.month}</span>}
                  {r.audience === "socios" && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(240,224,64,0.12)", color: "#F0E040", fontWeight: 700 }}>Solo socios</span>}
                  {r.audience === "fans" && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(96,165,250,0.12)", color: "#60A5FA", fontWeight: 700 }}>Solo fans</span>}
                </div>
                {r.description && <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{r.description}</div>}
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#666", flexWrap: "wrap" }}>
                  <span>🏆 {r.prizeValue}€</span>
                  <span>🎟 {r.ticketCost} ⚡/entrada</span>
                  <span>👥 {r.participantCount} participantes</span>
                  <span>✨ {r.xpReward} XP</span>
                </div>
                {r.winnerId && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 12 }}>
                    🎉 Ganador: <strong style={{ color: "#22C55E" }}>{r.winnerName}</strong>
                    {r.winnerEmail && <span style={{ color: "#555" }}> · {r.winnerEmail}</span>}
                    {r.drawDate && <span style={{ color: "#555" }}> · {fmtDate(r.drawDate)}</span>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                <button onClick={() => openEntries(r)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", color: "#60A5FA" }}>
                  👥 Participantes ({r.participantCount})
                </button>
                {!r.winnerId && r.isActive && (
                  <button onClick={() => draw(r.id, r.title)} disabled={drawing === r.id} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(240,224,64,0.15)", border: "1px solid rgba(240,224,64,0.3)", color: "#F0E040" }}>
                    {drawing === r.id ? "..." : "🎲 Sortear"}
                  </button>
                )}
                {!r.winnerId && (
                  <button onClick={() => toggleActive(r.id, r.isActive)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc" }}>
                    {r.isActive ? "Pausar" : "Activar"}
                  </button>
                )}
                <button onClick={() => openEdit(r)} className="admin-btn-edit">Editar</button>
                <button onClick={() => deleteRaffle(r.id, r.title)} className="admin-btn-delete">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Participants modal */}
      {entriesRaffle && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEntriesRaffle(null)}>
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2>PARTICIPANTES</h2>
                <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{entriesRaffle.title} · {entries.length} {entries.length === 1 ? "persona" : "personas"}</p>
              </div>
              {entries.length > 0 && (
                <button onClick={downloadEntriesCsv} className="admin-btn-ghost" style={{ flexShrink: 0, fontSize: 12 }}>⬇ Descargar CSV</button>
              )}
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {loadingEntries && <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Cargando...</div>}
              {!loadingEntries && entries.length === 0 && (
                <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Nadie participa todavía.</div>
              )}
              {entries.map((a) => (
                <div key={a.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                    {a.avatar?.startsWith("http") || a.avatar?.startsWith("data:")
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={a.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span>{a.avatar}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{a.name}</span>
                      {a.isSocio && <span className="admin-badge admin-badge-yellow" style={{ fontSize: 9 }}>SOCIO</span>}
                      {a.tickets > 1 && <span style={{ fontSize: 10, color: "#F0E040" }}>🎟 {a.tickets} tickets</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#777" }}>{a.email}{a.city ? ` · ${a.city}` : ""}{a.country ? `, ${a.country}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#555", flexShrink: 0 }}>{new Date(a.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</div>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 12 }}>
              <button onClick={() => setEntriesRaffle(null)} className="admin-btn-ghost" style={{ width: "100%" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }}>
            <h2>{editRaffle ? "EDITAR SORTEO" : "NUEVO SORTEO"}</h2>
            <form onSubmit={saveForm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="admin-label">Título del premio</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="admin-input" placeholder="Ej: Producto HOOPS exclusivo" /></div>
              <div><label className="admin-label">Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" rows={3} placeholder="Describe el premio, condiciones, etc." style={{ resize: "vertical" }} /></div>
              {/* Imagen del premio */}
              <div>
                <label className="admin-label">Imagen del premio</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 10, background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {form.prizeImageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={form.prizeImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "🎁"}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="admin-btn-ghost">
                    {uploadingImg ? "Subiendo..." : form.prizeImageUrl ? "Cambiar imagen" : "📷 Subir imagen"}
                  </button>
                  {form.prizeImageUrl && (
                    <button type="button" onClick={() => setForm({ ...form, prizeImageUrl: "" })} className="admin-btn-ghost" style={{ color: "#ef4444" }}>Quitar</button>
                  )}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label className="admin-label">Valor del premio (€)</label><input type="number" min={0} step={0.01} value={form.prizeValue} onChange={(e) => setForm({ ...form, prizeValue: Number(e.target.value) })} className="admin-input" /></div>
                <div><label className="admin-label">Coste entrada (⚡)</label><input type="number" min={0} value={form.ticketCost} onChange={(e) => setForm({ ...form, ticketCost: Number(e.target.value) })} className="admin-input" /></div>
                <div><label className="admin-label">XP por participar</label><input type="number" min={0} value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })} className="admin-input" /></div>
                <div><label className="admin-label">Mes (ej: 2026-06)</label><input value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="admin-input" placeholder="2026-06" /></div>
                <div><label className="admin-label">Fecha del sorteo</label><input type="date" value={form.drawDate} onChange={(e) => setForm({ ...form, drawDate: e.target.value })} className="admin-input" /></div>
              </div>
              <div>
                <label className="admin-label">¿Quién puede participar?</label>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="admin-input">
                  <option value="all">Todos los usuarios</option>
                  <option value="socios">Solo socios</option>
                  <option value="fans">Solo fans (excluir creadores/admins)</option>
                </select>
              </div>
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
