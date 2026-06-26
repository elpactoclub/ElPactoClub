"use client";

// EN: Admin votes page for creating, editing and settling community vote/poll/bet decisions and viewing individual vote records.
// ES: Página de votaciones del admin para crear, editar y resolver decisiones de votos/encuestas/apuestas de la comunidad y ver registros individuales de votos.

import { useEffect, useState, useCallback } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

const CATEGORIES = ["celebracion", "diseno", "contenido", "pregunta", "decision"] as const;
const VOTE_TYPES = ["encuesta", "pregunta", "votacion", "apuesta"] as const;

interface VoteObject {
  id: string;
  title: string;
  description?: string;
  category: string;
  votationType?: string;
  options: string[];
  results: Record<string, number>;
  creditsCost: number;
  xpReward: number;
  isActive: boolean;
  closesAt?: string;
  correctOption?: string;
  settledAt?: string;
  createdAt: string;
}

interface VoteRecord {
  id: string; voteId: string; voteTitle: string;
  userId: string; userName: string; userAvatar: string | null;
  option: string; createdAt: string;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function SkeletonHistRow() {
  return (
    <tr>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 110, height: 13, borderRadius: 4 }} />
        </div>
      </td>
      {[160, 80, 70].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="skeleton" style={{ width: w, height: 13, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

const EMPTY_FORM = { title: "", description: "", category: "pregunta" as typeof CATEGORIES[number], votationType: "encuesta" as typeof VOTE_TYPES[number], options: ["", ""], creditsCost: 5, xpReward: 10, closesAt: "", isActive: true };

// EN: Votes admin page component managing the full lifecycle of club decisions (create, update, settle, delete).
// ES: Componente de página de votaciones del admin que gestiona el ciclo de vida completo de las decisiones del club (crear, actualizar, resolver, eliminar).
export default function VotesPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [tab, setTab] = useState<"gestionar" | "historial">("gestionar");

  // ── Gestionar ──
  const [voteObjects, setVoteObjects] = useState<VoteObject[]>([]);
  const [loadingObjs, setLoadingObjs] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editVote, setEditVote] = useState<VoteObject | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleOption, setSettleOption] = useState("");

  // ── Historial ──
  const [history, setHistory] = useState<VoteRecord[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [search, setSearch] = useState("");
  const [histFilter, setHistFilter] = useState("all");

  const loadObjects = useCallback(() => {
    setLoadingObjs(true);
    fetch(`${API}/admin/vote-objects`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setVoteObjects(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingObjs(false));
  }, []);

  const loadHistory = useCallback(() => {
    setLoadingHist(true);
    fetch(`${API}/admin/votes`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

  useEffect(() => { loadObjects(); }, [loadObjects]);
  useEffect(() => { if (tab === "historial" && history.length === 0) loadHistory(); }, [tab, history.length, loadHistory]);

  function openCreate() {
    setEditVote(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(v: VoteObject) {
    setEditVote(v);
    setForm({
      title: v.title, description: v.description ?? "", category: v.category as any,
      votationType: (v.votationType ?? "encuesta") as any,
      options: v.options.length >= 2 ? v.options : [...v.options, ""],
      creditsCost: v.creditsCost, xpReward: v.xpReward,
      closesAt: v.closesAt ? new Date(v.closesAt).toISOString().slice(0, 16) : "",
      isActive: v.isActive,
    });
    setShowForm(true);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    const opts = form.options.filter((o) => o.trim());
    if (opts.length < 2) { await alert({ title: "Error", message: "Añade al menos 2 opciones.", confirmLabel: "Ok" }); return; }
    setSaving(true);
    const payload = { ...form, options: opts, closesAt: form.closesAt || undefined };
    const url = editVote ? `${API}/admin/vote-objects/${editVote.id}` : `${API}/admin/vote-objects`;
    const method = editVote ? "PATCH" : "POST";
    try {
      const r = await fetch(url, { method, headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      setShowForm(false);
      loadObjects();
    } catch {
      await alert({ title: "Error", message: "No se pudo guardar la votación.", confirmLabel: "Entendido" });
    } finally { setSaving(false); }
  }

  async function deleteVote(id: string, title: string) {
    const ok = await confirm({ title: "Eliminar votación", message: `¿Eliminar "${title}"?`, detail: "Se borrarán también todos los votos emitidos.", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    await fetch(`${API}/admin/vote-objects/${id}`, { method: "DELETE", headers: authHeader() });
    loadObjects();
  }

  async function settleVote(id: string) {
    if (!settleOption.trim()) return;
    const ok = await confirm({ title: "Resolver apuesta", message: `Marcar "${settleOption}" como opción correcta`, detail: "La votación se cerrará y se notificará el resultado.", confirmLabel: "Resolver" });
    if (!ok) return;
    const r = await fetch(`${API}/admin/vote-objects/${id}/settle`, {
      method: "PATCH", headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ correctOption: settleOption }),
    });
    if (r.ok) { setSettlingId(null); setSettleOption(""); loadObjects(); }
  }

  // Distinct votaciones (by title) present in the history — for the selector
  const histVotaciones = Array.from(
    new Set(history.filter((v) => v.voteTitle && v.voteTitle !== "—").map((v) => v.voteTitle))
  );

  const filteredHist = history.filter((v) => {
    if (histFilter !== "all" && v.voteTitle !== histFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return v.userName.toLowerCase().includes(q) || v.voteTitle.toLowerCase().includes(q) || v.option.toLowerCase().includes(q);
  });

  return (
    <div className="admin-page">
      {ConfirmUI}

      <div className="admin-header">
        <h1 className="admin-title">VOTACIONES</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {tab === "gestionar" && <button onClick={openCreate} className="admin-btn-primary">+ Nueva votación</button>}
          {tab === "historial" && (
            <>
              <select value={histFilter} onChange={(e) => setHistFilter(e.target.value)} className="admin-input" style={{ maxWidth: 280 }}>
                <option value="all">Todas las votaciones</option>
                {histVotaciones.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="admin-input" style={{ width: 200 }} />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#141414", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["gestionar", "historial"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 18px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t ? "#F0E040" : "transparent", color: tab === t ? "#000" : "#888" }}>
            {t === "gestionar" ? "Gestionar" : "Historial de votos"}
          </button>
        ))}
      </div>

      {/* ── GESTIONAR ── */}
      {tab === "gestionar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loadingObjs ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />) :
           voteObjects.length === 0 ? <div style={{ textAlign: "center", color: "#666", padding: 40 }}>No hay votaciones. Crea la primera.</div> :
           voteObjects.map((v) => {
            const totalVotes = Object.values(v.results).reduce((s, n) => s + n, 0);
            return (
              <div key={v.id} style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{v.title}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(240,224,64,0.12)", color: "#F0E040", fontWeight: 700 }}>{v.votationType ?? v.category}</span>
                      {v.isActive ? <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700 }}>Activa</span>
                        : <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(100,100,100,0.15)", color: "#666", fontWeight: 700 }}>Cerrada</span>}
                      {v.settledAt && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(167,139,250,0.12)", color: "#A78BFA", fontWeight: 700 }}>Resuelta ✓</span>}
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#666", flexWrap: "wrap" }}>
                      <span>{totalVotes} votos</span>
                      <span>{v.creditsCost} ⚡ · {v.xpReward} XP</span>
                      {v.closesAt && <span>Cierra: {new Date(v.closesAt).toLocaleDateString("es-ES")}</span>}
                      {v.correctOption && <span style={{ color: "#22C55E" }}>Correcto: {v.correctOption}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {v.options.map((opt) => {
                        const count = v.results[opt] ?? 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        return (
                          <span key={opt} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: opt === v.correctOption ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: opt === v.correctOption ? "#22C55E" : "#aaa", border: opt === v.correctOption ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                            {opt} <span style={{ color: "#555" }}>({pct}%)</span>
                          </span>
                        );
                      })}
                    </div>
                    {/* Settle inline */}
                    {settlingId === v.id && (
                      <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <select value={settleOption} onChange={(e) => setSettleOption(e.target.value)} style={{ padding: "6px 10px", borderRadius: 7, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 12 }}>
                          <option value="">— Opción correcta —</option>
                          {v.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <button onClick={() => settleVote(v.id)} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "#A78BFA", border: "none", color: "#000" }}>Confirmar</button>
                        <button onClick={() => setSettlingId(null)} style={{ padding: "6px 10px", borderRadius: 7, fontSize: 12, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#888" }}>Cancelar</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                    {v.votationType === "apuesta" && !v.settledAt && (
                      <button onClick={() => { setSettlingId(v.id); setSettleOption(""); }} className="admin-btn-edit" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA", borderColor: "rgba(167,139,250,0.3)", fontSize: 11 }}>Resolver</button>
                    )}
                    <button onClick={() => openEdit(v)} className="admin-btn-edit">Editar</button>
                    <button onClick={() => deleteVote(v.id, v.title)} className="admin-btn-delete">Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {tab === "historial" && (
        <div className="admin-card" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead><tr><th>Usuario</th><th>Votación</th><th>Opción</th><th>Fecha</th></tr></thead>
            <tbody>
              {loadingHist ? Array.from({ length: 7 }).map((_, i) => <SkeletonHistRow key={i} />) :
               filteredHist.length === 0 ? <tr><td colSpan={4} className="empty">{search ? `Sin resultados` : "Sin votos registrados"}</td></tr> :
               filteredHist.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, overflow: "hidden" }}>
                        {v.userAvatar?.startsWith("http") || v.userAvatar?.startsWith("data:")
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={v.userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span>{v.userAvatar ?? "🏀"}</span>}
                      </div>
                      <span style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{v.userName}</span>
                    </div>
                  </td>
                  <td style={{ color: "#ccc", fontSize: 13 }}>{v.voteTitle}</td>
                  <td><span style={{ background: "rgba(240,224,64,0.1)", border: "1px solid rgba(240,224,64,0.25)", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, color: "var(--color-accent)" }}>{v.option}</span></td>
                  <td className="muted">{fmtDate(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 560 }}>
            <h2>{editVote ? "EDITAR VOTACIÓN" : "NUEVA VOTACIÓN"}</h2>
            <form onSubmit={saveForm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="admin-label">Título</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="admin-input" /></div>
              <div><label className="admin-label">Descripción</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" /></div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="admin-label">Categoría</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="admin-input">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Tipo</label>
                  <select value={form.votationType} onChange={(e) => setForm({ ...form, votationType: e.target.value as any })} className="admin-input">
                    {VOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Coste (créditos)</label>
                  <input type="number" min={0} value={form.creditsCost} onChange={(e) => setForm({ ...form, creditsCost: Number(e.target.value) })} className="admin-input" />
                </div>
                <div>
                  <label className="admin-label">XP por votar</label>
                  <input type="number" min={0} value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })} className="admin-input" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="admin-label">Fecha cierre (opcional)</label>
                  <input type="datetime-local" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} className="admin-input" />
                </div>
              </div>

              <div>
                <label className="admin-label">Opciones</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {form.options.map((opt, i) => (
                    <div key={i} style={{ display: "flex", gap: 6 }}>
                      <input value={opt} onChange={(e) => { const next = [...form.options]; next[i] = e.target.value; setForm({ ...form, options: next }); }} placeholder={`Opción ${i + 1}`} className="admin-input" style={{ flex: 1 }} />
                      {form.options.length > 2 && <button type="button" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer" }}>✕</button>}
                    </div>
                  ))}
                  {form.options.length < 6 && <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })} style={{ padding: "7px", borderRadius: 8, background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", color: "#666", cursor: "pointer", fontSize: 12 }}>+ Añadir opción</button>}
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ddd", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ accentColor: "var(--color-accent)" }} />
                Votación activa
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
