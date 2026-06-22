"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

function resizeImageToBase64(file: File, maxPx = 800): Promise<string> {
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
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface Attendee {
  userId: string;
  name: string;
  avatar: string;
  email: string;
  city: string | null;
  country: string | null;
  level: string | null;
  xp: number;
  role: string;
  isSocio: boolean;
  socioNumber: number | null;
  registeredAt: string;
}

const EVENT_TYPES = ["partido", "charla", "tour", "sorteo", "reto"] as const;
type EventType = typeof EVENT_TYPES[number];

interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  date: string;
  location?: string;
  city?: string;
  creditsCost: number;
  maxAttendees?: number;
  isActive: boolean;
  status: "approved" | "pending" | "rejected";
  createdBy?: string;
  imageUrl?: string;
  bannerUrl?: string;
  showOnHome?: boolean;
  attendeesCount?: number;
  polls?: { question: string; options: string[] }[];
}

type EventPoll = { question: string; options: string[] };

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "partido" as EventType,
  date: "",
  location: "",
  city: "",
  creditsCost: 0,
  maxAttendees: undefined as number | undefined,
  isActive: true,
  showOnHome: false,
  imageUrl: "",
  bannerUrl: "",
  liveStreamUrl: "",
  polls: [] as EventPoll[],
};

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

function SkeletonRow() {
  return (
    <tr>
      {[160, 70, 80, 80, 50, 60, 130].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="skeleton" style={{ width: w, height: 13, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [pending, setPending] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [attendeesEvent, setAttendeesEvent] = useState<AdminEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [removingAttendee, setRemovingAttendee] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/admin/events`, { headers: authHeader() }).then((r) => r.json()),
      fetch(`${API}/admin/events/pending`, { headers: authHeader() }).then((r) => r.json()),
    ]).then(([all, pend]) => {
      setEvents(Array.isArray(all) ? all : []);
      setPending(Array.isArray(pend) ? pend : []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(e: AdminEvent) {
    setForm({
      ...EMPTY_FORM,
      title: e.title,
      description: e.description ?? "",
      type: e.type,
      date: e.date ? new Date(e.date).toISOString().slice(0, 16) : "",
      location: e.location ?? "",
      city: e.city ?? "",
      creditsCost: e.creditsCost,
      maxAttendees: e.maxAttendees,
      isActive: e.isActive,
      showOnHome: e.showOnHome ?? true,
      imageUrl: e.imageUrl ?? "",
      bannerUrl: e.bannerUrl ?? "",
      polls: Array.isArray(e.polls) ? e.polls.map((p) => ({ question: p.question, options: [...p.options] })) : [],
    });
    setEditId(e.id);
    setShowForm(true);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      // Clean polls: drop empty questions/options
      const cleanPolls = (form.polls ?? [])
        .map((p) => ({ question: p.question.trim(), options: p.options.map((o) => o.trim()).filter(Boolean) }))
        .filter((p) => p.question && p.options.length >= 2);
      const payload = {
        ...form,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        maxAttendees: form.maxAttendees || undefined,
        imageUrl: form.imageUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        liveStreamUrl: form.liveStreamUrl || undefined,
        location: form.location || undefined,
        city: form.city || undefined,
        polls: cleanPolls,
      };
      const url = editId ? `${API}/admin/events/${editId}` : `${API}/admin/events`;
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setShowForm(false);
      load();
    } catch {
      await alert({ title: "Error al guardar", message: "No se pudo guardar el evento. Revisa los datos e inténtalo de nuevo.", confirmLabel: "Entendido" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string, title: string) {
    const ok = await confirm({ title: "Eliminar evento", message: `¿Seguro que quieres eliminar "${title}"?`, detail: "Esta acción no se puede deshacer.", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    await fetch(`${API}/admin/events/${id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  async function approveEvent(id: string) {
    await fetch(`${API}/admin/events/${id}/approve`, { method: "PATCH", headers: authHeader() });
    load();
  }

  async function rejectEvent(id: string) {
    await fetch(`${API}/admin/events/${id}/reject`, { method: "PATCH", headers: authHeader() });
    load();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setForm((f) => ({ ...f, imageUrl: base64 }));
    } catch {
      await alert({ title: "Error", message: "No se pudo procesar la imagen. Intenta con otra.", confirmLabel: "Entendido" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const base64 = await resizeImageToBase64(file, 1000);
      setForm((f) => ({ ...f, bannerUrl: base64 }));
    } catch {
      await alert({ title: "Error", message: "No se pudo procesar la imagen.", confirmLabel: "Entendido" });
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  }

  // ── Polls (event decision questions) editor helpers ──
  function addPoll() {
    setForm((f) => ({ ...f, polls: [...(f.polls ?? []), { question: "", options: ["", ""] }] }));
  }
  function removePoll(pi: number) {
    setForm((f) => ({ ...f, polls: (f.polls ?? []).filter((_, i) => i !== pi) }));
  }
  function setPollQuestion(pi: number, q: string) {
    setForm((f) => ({ ...f, polls: (f.polls ?? []).map((p, i) => i === pi ? { ...p, question: q } : p) }));
  }
  function setPollOption(pi: number, oi: number, val: string) {
    setForm((f) => ({ ...f, polls: (f.polls ?? []).map((p, i) => i === pi ? { ...p, options: p.options.map((o, j) => j === oi ? val : o) } : p) }));
  }
  function addPollOption(pi: number) {
    setForm((f) => ({ ...f, polls: (f.polls ?? []).map((p, i) => i === pi ? { ...p, options: [...p.options, ""] } : p) }));
  }
  function removePollOption(pi: number, oi: number) {
    setForm((f) => ({ ...f, polls: (f.polls ?? []).map((p, i) => i === pi ? { ...p, options: p.options.filter((_, j) => j !== oi) } : p) }));
  }

  async function openAttendees(e: AdminEvent) {
    setAttendeesEvent(e);
    setAttendees([]);
    setAttendeeSearch("");
    setLoadingAttendees(true);
    try {
      const res = await fetch(`${API}/events/${e.id}/attendees`, { headers: authHeader() });
      const data = await res.json();
      setAttendees(Array.isArray(data) ? data : []);
    } catch {
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  }

  async function removeAttendee(userId: string, userName: string) {
    if (!attendeesEvent) return;
    const ok = await confirm({ title: "Quitar inscrito", message: `¿Quitar a ${userName} de este evento?`, detail: "Se le devolverán los créditos gastados automáticamente.", confirmLabel: "Quitar", danger: true });
    if (!ok) return;
    setRemovingAttendee(userId);
    try {
      const res = await fetch(`${API}/admin/events/${attendeesEvent.id}/attendees/${userId}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (res.ok) {
        setAttendees((prev) => prev.filter((a) => a.userId !== userId));
        setAttendeesEvent((ev) => ev ? { ...ev, attendeesCount: Math.max(0, (ev.attendeesCount ?? 1) - 1) } : ev);
      }
    } finally {
      setRemovingAttendee(null);
    }
  }

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function downloadAttendeesCsv() {
    if (!attendeesEvent || attendees.length === 0) return;
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["Nombre", "Email", "Ciudad", "País", "Nivel", "XP", "Rol", "Socio", "Nº Socio", "Inscrito el"];
    const lines = attendees.map((a) => [
      a.name, a.email, a.city ?? "", a.country ?? "", a.level ?? "", a.xp, a.role,
      a.isSocio ? "Sí" : "No", a.socioNumber ?? "",
      new Date(a.registeredAt).toLocaleString("es-ES"),
    ].map(esc).join(","));
    // BOM so Excel reads accents correctly
    const csv = "﻿" + [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = attendeesEvent.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.href = url;
    a.download = `inscritos-${safeTitle}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-page">
      {ConfirmUI}
      <div className="admin-header">
        <h1 className="admin-title">EVENTOS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({events.length})</span></h1>
        <button onClick={openCreate} className="admin-btn-primary">+ Nuevo evento</button>
      </div>

      {/* Pending events awaiting approval */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 15, letterSpacing: 2, color: "#F0E040", marginBottom: 12 }}>
            PENDIENTES DE APROBACIÓN <span style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({pending.length})</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map((e) => (
              <div key={e.id} style={{ background: "#1a1505", border: "1px solid rgba(240,224,64,0.25)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                    <span style={{ textTransform: "capitalize" }}>{e.type}</span>
                    {e.date && <> · {fmtDate(e.date)}</>}
                    {e.city && <> · {e.city}</>}
                    {e.creditsCost > 0 && <> · {e.creditsCost} ⚡</>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => approveEvent(e.id)} style={{ padding: "6px 14px", borderRadius: 8, background: "#22C55E", color: "#000", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>Aprobar</button>
                  <button onClick={() => rejectEvent(e.id)} style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", color: "#ef4444", fontWeight: 700, fontSize: 12, border: "1px solid #ef4444", cursor: "pointer" }}>Rechazar</button>
                  <button onClick={() => openEdit(e)} className="admin-btn-edit">Editar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Ciudad</th>
              <th>Coste</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : events.length === 0 ? (
              <tr><td colSpan={7} className="empty">Sin eventos aún. Crea el primero con el botón de arriba.</td></tr>
            ) : events.map((e) => (
              <tr key={e.id}>
                <td data-label="Evento" style={{ fontWeight: 600, color: "#fff" }}>{e.title}</td>
                <td data-label="Tipo" className="muted" style={{ textTransform: "capitalize" }}>{e.type}</td>
                <td data-label="Fecha" className="muted">{fmtDate(e.date)}</td>
                <td data-label="Ciudad" className="muted">{e.city ?? "—"}</td>
                <td data-label="Coste">{e.creditsCost ? <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{e.creditsCost} ⚡</span> : <span style={{ color: "#22C55E", fontWeight: 600 }}>Gratis</span>}</td>
                <td data-label="Estado">
                  <span className={`admin-badge ${e.status === "rejected" ? "admin-badge-red" : e.isActive ? "admin-badge-green" : "admin-badge-gray"}`}>
                    {e.status === "rejected" ? "Rechazado" : e.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td data-label="" className="actions">
                  <button onClick={() => openAttendees(e)} className="admin-btn-edit" style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA", borderColor: "rgba(96,165,250,0.3)" }}>👥 Inscritos{typeof e.attendeesCount === "number" ? ` (${e.attendeesCount})` : ""}</button>
                  <button onClick={() => openEdit(e)} className="admin-btn-edit">Editar</button>
                  <button onClick={() => deleteEvent(e.id, e.title)} className="admin-btn-delete">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 560 }}>
            <h2>{editId ? "EDITAR EVENTO" : "NUEVO EVENTO"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "title", label: "Título", type: "text", required: true },
                { key: "description", label: "Descripción", type: "text" },
                { key: "location", label: "Ubicación", type: "text" },
                { key: "city", label: "Ciudad", type: "text" },
                { key: "liveStreamUrl", label: "URL streaming", type: "url" },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="admin-label">{label}</label>
                  <input
                    type={type}
                    value={(form as Record<string, unknown>)[key] as string ?? ""}
                    onChange={(e) => set(key, e.target.value)}
                    required={required}
                    className="admin-input"
                  />
                </div>
              ))}

              {/* Imagen del evento — subida real */}
              <div>
                <label className="admin-label">Imagen del evento</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 10, background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 22, opacity: 0.4 }}>🏀</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="admin-btn-ghost">
                    {uploading ? "Subiendo..." : form.imageUrl ? "Cambiar foto" : "📷 Subir foto"}
                  </button>
                  {form.imageUrl && (
                    <button type="button" onClick={() => set("imageUrl", "")} style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Quitar</button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Logo/icono pequeño que sale en el círculo de la card.</div>
              </div>

              {/* Imagen de portada (banner) */}
              <div>
                <label className="admin-label">Imagen de portada (banner)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 120, height: 64, borderRadius: 10, background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.bannerUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={form.bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 20, opacity: 0.4 }}>🖼</span>}
                  </div>
                  <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner} className="admin-btn-ghost">
                    {uploadingBanner ? "Subiendo..." : form.bannerUrl ? "Cambiar portada" : "🖼 Subir portada"}
                  </button>
                  {form.bannerUrl && (
                    <button type="button" onClick={() => set("bannerUrl", "")} style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Quitar</button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Imagen grande (apaisada) de fondo en la página del evento.</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="admin-label">Tipo</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)} className="admin-input">
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Fecha</label>
                  <input type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)} required className="admin-input" />
                </div>
                <div>
                  <label className="admin-label">Coste (créditos)</label>
                  <input type="number" min={0} value={form.creditsCost} onChange={(e) => set("creditsCost", Number(e.target.value))} className="admin-input" />
                </div>
                <div>
                  <label className="admin-label">Aforo máximo</label>
                  <input type="number" min={0} value={form.maxAttendees ?? ""} onChange={(e) => set("maxAttendees", e.target.value ? Number(e.target.value) : undefined)} className="admin-input" />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ddd", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} style={{ accentColor: "#F0E040" }} />
                Evento activo
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ddd", cursor: "pointer" }}>
                <input type="checkbox" checked={form.showOnHome} onChange={(e) => set("showOnHome", e.target.checked)} style={{ accentColor: "#F0E040" }} />
                Mostrar en el inicio (carrusel &quot;Próximos eventos&quot;)
              </label>

              {/* Preguntas / decisiones del evento */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label className="admin-label" style={{ margin: 0 }}>Preguntas de votación (pestaña &quot;Votar&quot;)</label>
                  <button type="button" onClick={addPoll} className="admin-btn-ghost" style={{ fontSize: 11 }}>+ Añadir pregunta</button>
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>Lo que los inscritos votan en el evento. Cada pregunta necesita al menos 2 opciones. Déjalo vacío si el evento no tiene votaciones.</div>
                {(form.polls ?? []).length === 0 && (
                  <div style={{ fontSize: 12, color: "#555", padding: "8px 0" }}>Sin preguntas.</div>
                )}
                {(form.polls ?? []).map((poll, pi) => (
                  <div key={pi} style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input value={poll.question} onChange={(e) => setPollQuestion(pi, e.target.value)} className="admin-input" placeholder={`Pregunta ${pi + 1} (ej: ¿Qué música quieres?)`} style={{ flex: 1 }} />
                      <button type="button" onClick={() => removePoll(pi)} className="admin-btn-ghost" style={{ color: "#ef4444", flexShrink: 0 }}>✕</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
                      {poll.options.map((opt, oi) => (
                        <div key={oi} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#666" }}>{oi + 1}.</span>
                          <input value={opt} onChange={(e) => setPollOption(pi, oi, e.target.value)} className="admin-input" placeholder={`Opción ${oi + 1}`} style={{ flex: 1 }} />
                          {poll.options.length > 2 && (
                            <button type="button" onClick={() => removePollOption(pi, oi)} className="admin-btn-ghost" style={{ color: "#888", flexShrink: 0, padding: "4px 8px" }}>−</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addPollOption(pi)} className="admin-btn-ghost" style={{ fontSize: 11, alignSelf: "flex-start" }}>+ Opción</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
                <button type="submit" disabled={saving} className="admin-btn-primary" style={{ flex: 1 }}>
                  {saving ? "Guardando..." : (editId ? "Guardar cambios" : "Crear evento")}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {attendeesEvent && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setAttendeesEvent(null)}>
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2>INSCRITOS</h2>
                <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{attendeesEvent.title} · {attendees.length} {attendees.length === 1 ? "persona" : "personas"}</p>
              </div>
              {attendees.length > 0 && (
                <button onClick={downloadAttendeesCsv} className="admin-btn-ghost" style={{ flexShrink: 0, fontSize: 12 }}>⬇ Descargar CSV</button>
              )}
            </div>

            <input
              value={attendeeSearch}
              onChange={(e) => setAttendeeSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              style={{ width: "100%", background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", marginTop: 12 }}
            />

            <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {loadingAttendees && <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Cargando...</div>}
              {!loadingAttendees && attendees.length === 0 && (
                <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Nadie se ha inscrito todavía.</div>
              )}
              {!loadingAttendees && attendees.length > 0 && attendeeSearch && attendees.filter(a => a.name.toLowerCase().includes(attendeeSearch.toLowerCase()) || a.email.toLowerCase().includes(attendeeSearch.toLowerCase())).length === 0 && (
                <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Sin resultados para "{attendeeSearch}"</div>
              )}
              {attendees.filter(a => !attendeeSearch || a.name.toLowerCase().includes(attendeeSearch.toLowerCase()) || a.email.toLowerCase().includes(attendeeSearch.toLowerCase())).map((a) => (
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
                      {a.isSocio && <span className="admin-badge admin-badge-yellow" style={{ fontSize: 9 }}>SOCIO{a.socioNumber ? ` #${a.socioNumber}` : ""}</span>}
                      {a.level && <span style={{ fontSize: 9, color: "#888", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "1px 6px" }}>{a.level} · {a.xp.toLocaleString("es")} XP</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#777" }}>{a.email}{a.city ? ` · ${a.city}` : ""}{a.country ? `, ${a.country}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "#555" }}>{new Date(a.registeredAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</div>
                    <button
                      onClick={() => removeAttendee(a.userId, a.name)}
                      disabled={removingAttendee === a.userId}
                      style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
                    >
                      {removingAttendee === a.userId ? "…" : "Quitar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 12 }}>
              <button onClick={() => setAttendeesEvent(null)} className="admin-btn-ghost" style={{ width: "100%" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
