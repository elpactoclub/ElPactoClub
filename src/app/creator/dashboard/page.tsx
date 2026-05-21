"use client";

import { useEffect, useState } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface CreatorStats {
  subscribers: number;
  totalPosts: number;
  totalEvents: number;
  totalDMs: number;
  totalLikes: number;
  totalComments: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.3, color: "#888", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "1A", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 700, letterSpacing: 1, lineHeight: 1, color: "#fff" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function CreatorDashboardPage() {
  const [stats, setStats] = useState<CreatorStats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("el_pacto_token");
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        // Reusamos /admin/stats por ahora — endpoint específico /creator/stats vendrá luego
        setStats({
          subscribers: data?.users?.socios ?? 0,
          totalPosts: data?.posts?.total ?? 0,
          totalEvents: data?.events?.total ?? 0,
          totalDMs: 0,
          totalLikes: 0,
          totalComments: 0,
        });
      })
      .catch(() => setStats({ subscribers: 0, totalPosts: 0, totalEvents: 0, totalDMs: 0, totalLikes: 0, totalComments: 0 }));
  }, []);

  if (!stats) {
    return <div style={{ padding: 60, textAlign: "center", color: "#666", fontSize: 14 }}>Cargando...</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Hero summary */}
      <div style={{ background: "linear-gradient(135deg, #1a1024, #110a1d)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 16, padding: "22px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#A78BFA", textTransform: "uppercase", marginBottom: 6 }}>Tu impacto</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, letterSpacing: 1.5, lineHeight: 1.1 }}>
            {stats.subscribers} fans suscritos · {stats.totalPosts} posts
          </div>
          <div style={{ fontSize: 12.5, color: "#888", marginTop: 6 }}>Bienvenido a tu panel de creador</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#A78BFA" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>Creator activo</span>
        </div>
      </div>

      {/* Audiencia */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, color: "#fff", margin: 0 }}>AUDIENCIA <span style={{ fontSize: 11, color: "#777", letterSpacing: 0 }}>· Tus fans</span></h2>
        </div>
        <div className="creator-grid-3">
          <StatCard label="Fans suscritos" value={stats.subscribers} icon="⭐" color="#F0E040" />
          <StatCard label="DMs sin leer" value={stats.totalDMs} sub="Responder ahora →" icon="💬" color="#EC4899" />
          <StatCard label="Likes totales" value={stats.totalLikes} icon="❤️" color="#22C55E" />
        </div>
      </section>

      {/* Contenido */}
      <section>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, color: "#fff", margin: 0 }}>CONTENIDO <span style={{ fontSize: 11, color: "#777", letterSpacing: 0 }}>· Lo que has publicado</span></h2>
        </div>
        <div className="creator-grid-3">
          <StatCard label="Posts publicados" value={stats.totalPosts} icon="📝" color="#60A5FA" />
          <StatCard label="Charlas creadas" value={stats.totalEvents} icon="🎙" color="#A78BFA" />
          <StatCard label="Comentarios" value={stats.totalComments} icon="💭" color="#F59E0B" />
        </div>
      </section>

      <style jsx>{`
        .creator-grid-3 {
          display: grid;
          gap: 14px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 560px) {
          .creator-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .creator-grid-3 { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
