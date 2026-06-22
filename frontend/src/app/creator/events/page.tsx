"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

const EVENT_TYPES = ["partido", "charla", "tour", "sorteo", "reto"] as const;
type EventType = typeof EVENT_TYPES[number];

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

interface CreatorEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location?: string;
  city?: string;
  creditsCost: number;
  maxAttendees?: number;
  attendeesCount?: number;
  status: "approved" | "pending" | "rejected";
}

interface Attendee {
  userId: string;
  name: string;
  avatar: string;
  email: string;
  city: string | null;
  isSocio: boolean;
  registeredAt: string;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "charla" as EventType,
  date: "",
  location: "",
  city: "",
  creditsCost: 0,
  maxAttendees: undefined as number | undefined,
  imageUrl: "",
  liveStreamUrl: "",
};

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending:  { label: "Pendiente",  cls: "admin-badge-yellow" },
    approved: { label: "Aprobado",   cls: "admin-badge-green" },
    rejected: { label: "Rechazado",  cls: "admin-badge-red" },
  };
  const c = cfg[status] ?? cfg.pending;
  return <span className={`admin-badge ${c.cls}`}>{c.label}</span>;
}

export default function CreatorEventsPage() {
  const [events, setEvents] = useState<CreatorEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [attendeesEvent, setAttendeesEvent] = useState<CreatorEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const load = useCallback(() => {
    fetch(`${API}/events/my`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setForm((f) => ({ ...f, imageUrl: base64 }));
    } catch {
      alert("Error al procesar la imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function openAttendees(ev: CreatorEvent) {
    setAttendeesEvent(ev);
    setAttendees([]);
    setLoadingAttendees(true);
    try {
      const res = await fetch(`${API}/events/${ev.id}/attendees`, { headers: authHeader() });
      const data = await res.json();
      setAttendees(Array.isArray(data) ? data : []);
    } catch {
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  }

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        maxAttendees: form.maxAttendees || undefined,
        imageUrl: form.imageUrl || undefined,
        liveStreamUrl: form.liveStreamUrl || undefined,
        location: form.location || undefined,
        city: form.city || undefined,
      };
      const res = await fetch(`${API}/events/submit`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setShowForm(false);
      load();
    } catch {
      alert("Error al enviar la propuesta");
    } finally {
      setSaving(false);
    }
  }

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">MIS CHARLAS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({events.length})</span></h1>
          <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>Las propuestas se publican tras la aprobación de un administrador.</p>
        </div>
        <button onClick={openCreate} className="admin-btn-primary" style={{ background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "#fff" }}>+ Nueva propuesta</button>
      </div>

      {events.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎙</div>
          <p style={{ color: "#888", fontSize: 13.5, maxWidth: 360, margin: "0 auto" }}>
            Aún no has propuesto ninguna charla. Crea la primera — un admin la revisará antes de publicarla.
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Charla</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Ciudad</th>
                <th>Coste</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td data-label="Charla" style={{ fontWeight: 600, color: "#fff" }}>{e.title}</td>
                  <td data-label="Tipo" className="muted" style={{ textTransform: "capitalize" }}>{e.type}</td>
                  <td data-label="Fecha" className="muted">{fmtDate(e.date)}</td>
                  <td data-label="Ciudad" className="muted">{e.city ?? "—"}</td>
                  <td data-label="Coste">{e.creditsCost ? <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{e.creditsCost} ⚡</span> : <span style={{ color: "#22C55E", fontWeight: 600 }}>Gratis</span>}</td>
                  <td data-label="Estado"><StatusBadge status={e.status} /></td>
                  <td data-label="" className="actions">
                    {e.status === "approved" && (
                      <button onClick={() => openAttendees(e)} className="admin-btn-edit" style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA", borderColor: "rgba(96,165,250,0.3)" }}>👥 Inscritos{typeof e.attendeesCount === "number" ? ` (${e.attendeesCount})` : ""}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 560 }}>
            <div>
              <h2>NUEVA PROPUESTA</h2>
              <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>Será revisada por un administrador antes de publicarse.</p>
            </div>
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
                      : <span style={{ fontSize: 22, opacity: 0.4 }}>🎙</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="admin-btn-ghost">
                    {uploading ? "Subiendo..." : form.imageUrl ? "Cambiar foto" : "📷 Subir foto"}
                  </button>
                  {form.imageUrl && (
                    <button type="button" onClick={() => set("imageUrl", "")} style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Quitar</button>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="admin-label">Tipo</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)} className="admin-input">
                    <option value="charla">Charla</option>
                    <option value="tour">Tour</option>
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

              <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
                <button type="submit" disabled={saving} className="admin-btn-primary" style={{ flex: 1, background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "#fff" }}>
                  {saving ? "Enviando..." : "Enviar para revisión"}
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
            <div>
              <h2>INSCRITOS</h2>
              <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{attendeesEvent.title} · {attendees.length} {attendees.length === 1 ? "persona" : "personas"}</p>
            </div>

            <div style={{ maxHeight: 420, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {loadingAttendees && <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Cargando...</div>}
              {!loadingAttendees && attendees.length === 0 && (
                <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Nadie se ha inscrito todavía.</div>
              )}
              {attendees.map((a) => (
                <div key={a.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                    {a.avatar?.startsWith("http") || a.avatar?.startsWith("data:")
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={a.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span>{a.avatar}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{a.name}</span>
                      {a.isSocio && <span className="admin-badge admin-badge-yellow" style={{ fontSize: 9 }}>SOCIO</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#777" }}>{a.email}{a.city ? ` · ${a.city}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#555", flexShrink: 0 }}>{new Date(a.registeredAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</div>
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
