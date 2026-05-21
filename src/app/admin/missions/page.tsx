"use client";

import { useEffect, useState, useCallback } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface Mission {
  id: string;
  code: string;
  title: string;
  description?: string;
  target: number;
  current: number;
  reward?: string;
  isComplete: boolean;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [resetting, setResetting] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`${API}/admin/missions`, { headers: authHeader() })
      .then((r) => r.json())
      .then(setMissions)
      .catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resetMission(code: string) {
    if (!confirm(`¿Reiniciar misión "${code}"?`)) return;
    setResetting(code);
    try {
      await fetch(`${API}/admin/missions/${code}/reset`, { method: "PATCH", headers: authHeader() });
      load();
    } finally {
      setResetting(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">MISIONES <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({missions.length})</span></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
        {missions.map((m, idx) => {
          const pct = Math.min(100, Math.round((m.current / m.target) * 100));
          return (
            <div key={m.code || m.id || idx} className="admin-card" style={{ padding: "18px 18px 16px", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: m.isComplete ? "#22C55E" : "var(--color-accent)" }} />

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{m.title}</span>
                    {m.isComplete && <span className="admin-badge admin-badge-green">Completada</span>}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>{m.code}</div>
                </div>
                <button
                  onClick={() => resetMission(m.code)}
                  disabled={resetting === m.code}
                  className="admin-btn-ghost"
                  style={{ fontSize: 11.5, padding: "6px 12px", flexShrink: 0 }}
                >
                  {resetting === m.code ? "..." : "Reiniciar"}
                </button>
              </div>

              {m.description && <div style={{ fontSize: 12.5, color: "#aaa", lineHeight: 1.45, marginBottom: 10 }}>{m.description}</div>}
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
                  {m.current.toLocaleString()} / {m.target.toLocaleString()} <span style={{ color: m.isComplete ? "#22C55E" : "var(--color-accent)" }}>({pct}%)</span>
                </span>
              </div>
            </div>
          );
        })}
        {missions.length === 0 && (
          <div className="admin-card" style={{ padding: "40px 20px", textAlign: "center", color: "#666", gridColumn: "1 / -1" }}>Sin misiones activas</div>
        )}
      </div>
    </div>
  );
}
