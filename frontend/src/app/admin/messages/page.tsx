"use client";

import { useState, useCallback, useRef } from "react";
import { useConfirm } from "@/hooks/useConfirm";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface UserRow {
  id: string;
  name: string;
  email: string;
  city?: string | null;
  role?: string;
  isSocio?: boolean;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

export default function AdminMessagesPage() {
  const { alert, ConfirmUI } = useConfirm();
  const [mode, setMode] = useState<"all" | "select">("all");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // User picker (select mode)
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({}); // id -> name
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API}/admin/users?limit=20&search=${encodeURIComponent(q)}`, { headers: authHeader() });
        const d = await r.json();
        setResults(Array.isArray(d?.items) ? d.items : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  function toggleUser(u: UserRow) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[u.id]) delete next[u.id];
      else next[u.id] = u.name;
      return next;
    });
  }

  const selectedCount = Object.keys(selected).length;

  async function send() {
    const text = content.trim();
    if (!text) { await alert({ title: "Error", message: "Escribe un mensaje.", confirmLabel: "Ok" }); return; }
    if (mode === "select" && selectedCount === 0) { await alert({ title: "Error", message: "Selecciona al menos un usuario.", confirmLabel: "Ok" }); return; }
    setSending(true);
    try {
      const body: { content: string; userIds?: string[] } = { content: text };
      if (mode === "select") body.userIds = Object.keys(selected);
      const r = await fetch(`${API}/admin/dm-broadcast`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      await alert({ title: "Mensaje enviado ✓", message: `Se envió a ${d.sent ?? 0} ${d.sent === 1 ? "persona" : "personas"}.`, confirmLabel: "Perfecto" });
      setContent("");
      setSelected({});
      setResults([]);
      setSearch("");
    } catch {
      await alert({ title: "Error", message: "No se pudo enviar el mensaje.", confirmLabel: "Entendido" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="admin-page">
      {ConfirmUI}

      <div className="admin-header">
        <h1 className="admin-title">MENSAJE DIRECTO</h1>
      </div>

      <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: 0 }}>
          Envía un mensaje a la <strong style={{ color: "#fff" }}>bandeja de mensajes</strong> de los usuarios (lo reciben en sus DMs y pueden responderte). Distinto de la &quot;Notificación a todos&quot;, que es solo un aviso 🔔.
        </p>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setMode("all")}
            style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: mode === "all" ? "none" : "1px solid rgba(255,255,255,0.12)", background: mode === "all" ? "var(--color-accent)" : "transparent", color: mode === "all" ? "#000" : "#aaa" }}
          >
            👥 A todos
          </button>
          <button
            onClick={() => setMode("select")}
            style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: mode === "select" ? "none" : "1px solid rgba(255,255,255,0.12)", background: mode === "select" ? "var(--color-accent)" : "transparent", color: mode === "select" ? "#000" : "#aaa" }}
          >
            ✅ Elegir usuarios{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
        </div>

        {/* User picker */}
        {mode === "select" && (
          <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}>
            {/* Selected chips */}
            {selectedCount > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {Object.entries(selected).map(([id, name]) => (
                  <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(240,224,64,0.12)", border: "1px solid rgba(240,224,64,0.3)", color: "#F0E040", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                    {name}
                    <button onClick={() => setSelected((p) => { const n = { ...p }; delete n[id]; return n; })} style={{ background: "none", border: "none", color: "#F0E040", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0 }}>✕</button>
                  </span>
                ))}
              </div>
            )}
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); runSearch(e.target.value); }}
              placeholder="Buscar por nombre, email o ciudad..."
              style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ marginTop: 8, maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {searching && <div style={{ textAlign: "center", color: "#666", padding: 12, fontSize: 12 }}>Buscando…</div>}
              {!searching && search && results.length === 0 && <div style={{ textAlign: "center", color: "#666", padding: 12, fontSize: 12 }}>Sin resultados.</div>}
              {!searching && !search && <div style={{ textAlign: "center", color: "#555", padding: 12, fontSize: 12 }}>Escribe para buscar usuarios.</div>}
              {results.map((u) => {
                const checked = !!selected[u.id];
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: checked ? "rgba(240,224,64,0.08)" : "transparent", border: `1px solid ${checked ? "rgba(240,224,64,0.3)" : "transparent"}`, cursor: "pointer", textAlign: "left", width: "100%" }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? "#F0E040" : "#555"}`, background: checked ? "#F0E040" : "transparent", color: "#000", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{checked ? "✓" : ""}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{u.name}{u.isSocio && <span style={{ fontSize: 9, color: "#F0E040", marginLeft: 6 }}>SOCIO</span>}</div>
                      <div style={{ fontSize: 11, color: "#777" }}>{u.email}{u.city ? ` · ${u.city}` : ""}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="admin-label">Mensaje</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="admin-input"
            style={{ resize: "vertical" }}
            placeholder="Escribe el mensaje que recibirán en sus DMs..."
          />
        </div>

        <button
          onClick={send}
          disabled={sending}
          className="admin-btn-primary"
          style={{ alignSelf: "flex-start", opacity: sending ? 0.7 : 1 }}
        >
          {sending ? "Enviando..." : mode === "all" ? "Enviar a todos" : `Enviar a ${selectedCount || 0} seleccionados`}
        </button>
      </div>
    </div>
  );
}
