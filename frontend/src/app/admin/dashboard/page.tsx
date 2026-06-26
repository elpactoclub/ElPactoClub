"use client";

// EN: Admin dashboard page showing club-wide stats (users, socios, content counts) and a broadcast notification form.
// ES: Página de dashboard del administrador que muestra estadísticas globales del club (usuarios, socios, conteos de contenido) y un formulario de notificación broadcast.

import { useEffect, useState } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface Stats {
  users: {
    total: number;
    socios: number;
    creators: number;
    admins: number;
    onlineNow: number;
    newUsers7d: number;
  };
  events: { total: number };
  votes: { total: number };
  missions: { total: number };
  posts: { total: number };
}

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  color: string;
}

// EN: Single stat tile with a colored stripe, icon and numeric value.
// ES: Tarjeta de estadística individual con franja de color, icono y valor numérico.
function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: "18px 18px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Color stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.3, color: "#888", textTransform: "uppercase" }}>{label}</span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: color + "1A",
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 700, letterSpacing: 1, lineHeight: 1, color: "#fff" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// EN: Skeleton placeholder rendered while dashboard stats are loading.
// ES: Marcador de posición esqueleto renderizado mientras se cargan las estadísticas del dashboard.
function SkeletonStatCard() {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#1e1e1e" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 80, height: 11, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
      </div>
      <div className="skeleton" style={{ width: 56, height: 30, borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 100, height: 11, borderRadius: 4 }} />
    </div>
  );
}

// EN: Section heading component with an optional subtitle for dashboard sections.
// ES: Componente de encabezado de sección con subtítulo opcional para las secciones del dashboard.
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 14, display: "flex", alignItems: "baseline", gap: 10 }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, color: "#fff" }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 11, color: "#777" }}>· {subtitle}</span>}
    </div>
  );
}

// EN: Dashboard page component fetching stats and handling the broadcast notification form submission.
// ES: Componente de página del dashboard que obtiene estadísticas y gestiona el envío del formulario de notificación broadcast.
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    setBroadcasting(true);
    try {
      await fetch(`${API}/admin/broadcast`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: broadcastTitle.trim(), message: broadcastMsg.trim() }),
      });
      setBroadcastDone(true);
      setBroadcastTitle(""); setBroadcastMsg("");
      setTimeout(() => setBroadcastDone(false), 3000);
    } finally { setBroadcasting(false); }
  }

  useEffect(() => {
    const token = localStorage.getItem("el_pacto_token");
    if (!token) {
      setError("No hay token de autenticación");
      return;
    }
    fetch(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.text();
          throw new Error(`${r.status}: ${err}`);
        }
        return r.json();
      })
      .then(setStats)
      .catch((err) => {
        console.error("Error loading stats:", err);
        setError(`Error: ${err.message}`);
      });
  }, []);

  if (error) return <p style={{ color: "#ef4444" }}>{error}</p>;
  if (!stats) {
    return (
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(135deg, #131310, #0c0c0c)", border: "1px solid rgba(240,224,64,0.08)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
          <div className="skeleton" style={{ width: 100, height: 10, borderRadius: 4, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: 280, height: 24, borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: 180, height: 13, borderRadius: 4 }} />
        </div>
        <section style={{ marginBottom: 28 }}>
          <div className="skeleton" style={{ width: 100, height: 18, borderRadius: 6, marginBottom: 14 }} />
          <div className="admin-grid-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        </section>
        <section>
          <div className="skeleton" style={{ width: 100, height: 18, borderRadius: 6, marginBottom: 14 }} />
          <div className="admin-grid-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        </section>
        <style jsx>{`
          .admin-grid-3 { display: grid; gap: 14px; grid-template-columns: 1fr; }
          .admin-grid-4 { display: grid; gap: 14px; grid-template-columns: 1fr; }
          @media (min-width: 560px) {
            .admin-grid-3, .admin-grid-4 { grid-template-columns: repeat(2, 1fr); }
          }
          @media (min-width: 900px) {
            .admin-grid-3 { grid-template-columns: repeat(3, 1fr); }
            .admin-grid-4 { grid-template-columns: repeat(4, 1fr); }
          }
        `}</style>
      </div>
    );
  }

  const onlinePct = stats.users.total > 0 ? Math.round((stats.users.onlineNow / stats.users.total) * 100) : 0;
  const sociosPct = stats.users.total > 0 ? Math.round((stats.users.socios / stats.users.total) * 100) : 0;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Hero summary */}
      <div
        style={{
          background: "linear-gradient(135deg, #131310, #0c0c0c)",
          border: "1px solid rgba(240,224,64,0.15)",
          borderRadius: 16,
          padding: "22px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 6 }}>Resumen general</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, letterSpacing: 1.5, lineHeight: 1.1 }}>
            {stats.users.total} fans · {stats.users.onlineNow} online ahora
          </div>
          <div style={{ fontSize: 12.5, color: "#888", marginTop: 6 }}>
            {sociosPct}% son socios · {onlinePct}% conectados
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>Sistema operativo</span>
        </div>
      </div>

      {/* Usuarios */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="USUARIOS" subtitle="Métricas de la comunidad" />
        <div className="admin-grid-3">
          <StatCard label="Total fans" value={stats.users.total} icon="👥" color="#60A5FA" />
          <StatCard label="Socios" value={stats.users.socios} sub={`${sociosPct}% del total`} icon="⭐" color="#F0E040" />
          <StatCard label="Online ahora" value={stats.users.onlineNow} sub="últimos 5 min" icon="🟢" color="#22C55E" />
          <StatCard label="Nuevos (7d)" value={stats.users.newUsers7d} sub="esta semana" icon="✨" color="#A78BFA" />
          <StatCard label="Creadores" value={stats.users.creators} icon="🎤" color="#EC4899" />
          <StatCard label="Admins" value={stats.users.admins} icon="🛡" color="#F59E0B" />
        </div>
      </section>

      {/* Contenido */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader title="CONTENIDO" subtitle="Actividad del club" />
        <div className="admin-grid-4">
          <StatCard label="Eventos" value={stats.events.total} icon="📅" color="#60A5FA" />
          <StatCard label="Votaciones" value={stats.votes.total} icon="🗳" color="#F0E040" />
          <StatCard label="Misiones" value={stats.missions.total} icon="🎯" color="#F59E0B" />
          <StatCard label="Posts" value={stats.posts.total} icon="💬" color="#22C55E" />
        </div>
      </section>

      {/* Notificación broadcast */}
      <section>
        <SectionHeader title="NOTIFICACIÓN A TODOS" subtitle="Llega a todos los usuarios registrados" />
        <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 20px" }}>
          <form onSubmit={sendBroadcast} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="Título (ej: ¡Nuevo evento esta noche!)" className="admin-input" required />
            <input value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Mensaje (ej: No te pierdas el MVP'S TOUR 3x3 — inscríbete ya)" className="admin-input" required />
            <button type="submit" disabled={broadcasting || broadcastDone} style={{ padding: "10px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: broadcastDone ? "#22C55E" : "var(--color-accent)", color: "#000", alignSelf: "flex-start", transition: "background 0.2s" }}>
              {broadcasting ? "Enviando..." : broadcastDone ? "✓ Enviado a todos" : "📢 Enviar a todos los fans"}
            </button>
          </form>
        </div>
      </section>

      <style jsx>{`
        .admin-grid-3 {
          display: grid;
          gap: 14px;
          grid-template-columns: 1fr;
        }
        .admin-grid-4 {
          display: grid;
          gap: 14px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 560px) {
          .admin-grid-3, .admin-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .admin-grid-3 { grid-template-columns: repeat(3, 1fr); }
          .admin-grid-4 { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </div>
  );
}
