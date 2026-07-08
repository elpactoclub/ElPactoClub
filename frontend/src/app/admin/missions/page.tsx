"use client";

// EN: Admin missions page for viewing, creating, editing and deleting weekly gamification missions.
// ES: Página de misiones del admin para ver, crear, editar y eliminar misiones semanales de gamificación.

import { useEffect, useState, useCallback } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

// EN: Shape of a single gamification mission stored in the backend.
// ES: Forma de una misión de gamificación individual almacenada en el backend.
interface Mission {
  id?: string;
  code: string;
  title: string;
  description?: string;
  target: number;
  current: number;
  reward?: string;
  isActive: boolean;
  isComplete: boolean;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}`, "Content-Type": "application/json" };
}

function SkeletonMissionCard() {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#1e1e1e" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="skeleton" style={{ width: 170, height: 15, borderRadius: 4, marginBottom: 7 }} />
          <div className="skeleton" style={{ width: 80, height: 11, borderRadius: 4 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 7 }} />
          <div className="skeleton" style={{ width: 72, height: 28, borderRadius: 7 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "100%", height: 6, borderRadius: 999 }} />
    </div>
  );
}

// EN: Missions admin page component listing missions and providing a modal form to create or update them.
// ES: Componente de página de misiones del admin que lista las misiones y provee un formulario modal para crearlas o actualizarlas.
export default function MissionsPage() {
  const { confirm, ConfirmUI } = useConfirm();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Mission>>({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState({ code: "", title: "", description: "", target: 100, reward: "", isActive: true });
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`${API}/admin/missions`, { headers: authHeader(), signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => { setMissions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setLoading(false); });
    return ctrl;
  }, []);

  useEffect(() => {
    const ctrl = load();
    return () => ctrl.abort();
  }, [load]);

  function startEdit(m: Mission) {
    setEditingCode(m.code);
    setDraft({ title: m.title, description: m.description ?? "", target: m.target, reward: m.reward ?? "", isActive: m.isActive });
  }

  async function saveMission(code: string) {
    setSaving(true);
    try {
      const r = await fetch(`${API}/admin/missions/${code}`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify(draft),
      });
      if (r.ok) {
        const updated = await r.json();
        setMissions((prev) => prev.map((m) => m.code === code ? { ...m, ...updated } : m));
        setEditingCode(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: Mission) {
    const r = await fetch(`${API}/admin/missions/${m.code}`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    if (r.ok) {
      const updated = await r.json();
      setMissions((prev) => prev.map((x) => x.code === m.code ? { ...x, ...updated } : x));
    }
  }

  async function createMission() {
    if (!createDraft.code.trim() || !createDraft.title.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${API}/admin/missions`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(createDraft),
      });
      if (r.ok) {
        setShowCreate(false);
        setCreateDraft({ code: "", title: "", description: "", target: 100, reward: "", isActive: true });
        load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function resetMission(code: string, title: string) {
    const ok = await confirm({ title: "Reiniciar misión", message: `¿Reiniciar el progreso de "${title}"?`, detail: "El contador volverá a 0. Esta acción no se puede deshacer.", confirmLabel: "Reiniciar", danger: true });
    if (!ok) return;
    setResetting(code);
    try {
      await fetch(`${API}/admin/missions/${code}/reset`, { method: "PATCH", headers: authHeader() });
      load();
    } finally {
      setResetting(null);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {ConfirmUI}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 2, margin: 0 }}>
          MISIONES <span style={{ color: "#777", fontSize: 15, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({missions.length})</span>
        </h1>
        <button onClick={() => setShowCreate(true)} className="admin-btn-primary">+ Nueva misión</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonMissionCard key={i} />)
        ) : missions.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Sin misiones</div>
        ) : missions.map((m) => {
          const pct = Math.min(100, Math.round((m.current / m.target) * 100));
          const isEditing = editingCode === m.code;

          return (
            <div
              key={m.code}
              style={{
                background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14,
                padding: "18px 18px 16px", position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: m.isComplete ? "#22C55E" : m.isActive ? "var(--color-accent)" : "#444" }} />

              {isEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Título</label>
                      <input
                        value={draft.title ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ width: 110 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Objetivo</label>
                      <input
                        type="number"
                        value={draft.target ?? 0}
                        onChange={(e) => setDraft((d) => ({ ...d, target: Number(e.target.value) }))}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Descripción</label>
                    <textarea
                      value={draft.description ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      rows={2}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#666", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Recompensa</label>
                    <input
                      value={draft.reward ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, reward: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
                      <input
                        type="checkbox"
                        checked={draft.isActive ?? true}
                        onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
                        style={{ accentColor: "var(--color-accent)", width: 15, height: 15 }}
                      />
                      Activa
                    </label>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => setEditingCode(null)}
                      style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#aaa", cursor: "pointer" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => saveMission(m.code)}
                      disabled={saving}
                      style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "var(--color-accent)", border: "none", color: "#000", cursor: "pointer" }}
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{m.title}</span>
                        {m.isComplete && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.15)", color: "#22C55E", fontWeight: 700 }}>Completada</span>}
                        {!m.isActive && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(100,100,100,0.15)", color: "#888", fontWeight: 700 }}>Pausada</span>}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>{m.code}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                      <button
                        onClick={() => toggleActive(m)}
                        style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: m.isActive ? "rgba(255,255,255,0.06)" : "rgba(240,224,64,0.12)", border: `1px solid ${m.isActive ? "rgba(255,255,255,0.1)" : "rgba(240,224,64,0.3)"}`, color: m.isActive ? "#ccc" : "#F0E040", cursor: "pointer" }}
                      >
                        {m.isActive ? "Pausar" : "Activar"}
                      </button>
                      <button
                        onClick={() => startEdit(m)}
                        style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", cursor: "pointer" }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => resetMission(m.code, m.title)}
                        disabled={resetting === m.code}
                        style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer" }}
                      >
                        {resetting === m.code ? "…" : "Reiniciar"}
                      </button>
                    </div>
                  </div>

                  {m.description && <div style={{ fontSize: 12.5, color: "#aaa", lineHeight: 1.5, marginBottom: 10 }}>{m.description}</div>}
                  {m.reward && (
                    <div style={{ fontSize: 11.5, color: "var(--color-accent)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      🎁 <span>{m.reward}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 999, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: m.isComplete ? "#22C55E" : "linear-gradient(90deg, var(--color-accent), #FF6B1A)", transition: "width 0.4s" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap", fontWeight: 600 }}>
                      {m.current.toLocaleString()} / {m.target.toLocaleString()}{" "}
                      <span style={{ color: m.isComplete ? "#22C55E" : "var(--color-accent)" }}>({pct}%)</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setShowCreate(false)}>
          <div className="admin-modal">
            <h2>NUEVA MISIÓN</h2>
            <div>
              <label className="admin-label">Código único (sin espacios, ej: chat_100_dia)</label>
              <input
                value={createDraft.code}
                onChange={(e) => setCreateDraft(d => ({ ...d, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                className="admin-input" placeholder="codigo_mision"
              />
            </div>
            <div>
              <label className="admin-label">Título</label>
              <input value={createDraft.title} onChange={(e) => setCreateDraft(d => ({ ...d, title: e.target.value }))} className="admin-input" placeholder="Título de la misión" />
            </div>
            <div>
              <label className="admin-label">Descripción</label>
              <textarea value={createDraft.description} onChange={(e) => setCreateDraft(d => ({ ...d, description: e.target.value }))} className="admin-input" rows={2} style={{ resize: "vertical" }} />
            </div>
            <div>
              <label className="admin-label">Objetivo (número)</label>
              <input type="number" value={createDraft.target} onChange={(e) => setCreateDraft(d => ({ ...d, target: Number(e.target.value) }))} className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Recompensa</label>
              <input value={createDraft.reward} onChange={(e) => setCreateDraft(d => ({ ...d, reward: e.target.value }))} className="admin-input" placeholder="Descripción de la recompensa" />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ddd", cursor: "pointer" }}>
              <input type="checkbox" checked={createDraft.isActive} onChange={(e) => setCreateDraft(d => ({ ...d, isActive: e.target.checked }))} style={{ accentColor: "#F0E040" }} />
              Activa desde el inicio
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={createMission} disabled={creating || !createDraft.code.trim() || !createDraft.title.trim()} className="admin-btn-primary" style={{ flex: 1 }}>
                {creating ? "Creando..." : "Crear misión"}
              </button>
              <button onClick={() => setShowCreate(false)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
