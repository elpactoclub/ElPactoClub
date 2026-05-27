"use client";

import { useEffect, useState, useCallback } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

const EVENT_TYPES = ["partido", "charla", "tour", "sorteo", "reto"] as const;
type EventType = typeof EVENT_TYPES[number];

interface AdminEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location?: string;
  city?: string;
  creditsCost: number;
  maxAttendees?: number;
  isActive: boolean;
}

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
  imageUrl: "",
  liveStreamUrl: "",
};

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch(`${API}/admin/events`, { headers: authHeader() })
      .then((r) => r.json())
      .then(setEvents)
      .catch(console.error);
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
      type: e.type,
      date: e.date ? new Date(e.date).toISOString().slice(0, 16) : "",
      location: e.location ?? "",
      city: e.city ?? "",
      creditsCost: e.creditsCost,
      maxAttendees: e.maxAttendees,
      isActive: e.isActive,
    });
    setEditId(e.id);
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
      alert("Error al guardar evento");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("¿Eliminar evento?")) return;
    await fetch(`${API}/admin/events/${id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">EVENTOS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({events.length})</span></h1>
        <button onClick={openCreate} className="admin-btn-primary">+ Nuevo evento</button>
      </div>

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
            {events.map((e) => (
              <tr key={e.id}>
                <td data-label="Evento" style={{ fontWeight: 600, color: "#fff" }}>{e.title}</td>
                <td data-label="Tipo" className="muted" style={{ textTransform: "capitalize" }}>{e.type}</td>
                <td data-label="Fecha" className="muted">{fmtDate(e.date)}</td>
                <td data-label="Ciudad" className="muted">{e.city ?? "—"}</td>
                <td data-label="Coste">{e.creditsCost ? <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{e.creditsCost} ⚡</span> : <span style={{ color: "#22C55E", fontWeight: 600 }}>Gratis</span>}</td>
                <td data-label="Estado">
                  <span className={`admin-badge ${e.isActive ? "admin-badge-green" : "admin-badge-gray"}`}>
                    {e.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td data-label="" className="actions">
                  <button onClick={() => openEdit(e)} className="admin-btn-edit">Editar</button>
                  <button onClick={() => deleteEvent(e.id)} className="admin-btn-delete">Eliminar</button>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={7} className="empty">Sin eventos aún. Crea el primero con el botón de arriba.</td></tr>
            )}
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
                { key: "imageUrl", label: "URL imagen", type: "url" },
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
    </div>
  );
}
