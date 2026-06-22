"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface CreatorStats {
  totalPosts: number;
  totalLikes: number;
  avgLikes: number;
  posts: { id: string; content: string; type: string; likesCount: number; createdAt: string }[];
}

interface MeProfile {
  id: string;
  name: string;
  avatar: string;
  level: string;
  xp: number;
  city?: string;
  isSocio: boolean;
  followersCount?: number;
  followingCount?: number;
}

function SkeletonProfileCard() {
  return (
    <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="skeleton" style={{ width: "55%", height: 18, borderRadius: 6, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 5 }}>
            <div className="skeleton" style={{ width: 56, height: 16, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 46, height: 16, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 62, height: 16, borderRadius: 10 }} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ flex: 1, height: 50, borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: number | string; sub?: string; icon: string; color: string }) {
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

const TYPE_COLOR: Record<string, string> = { text: "#60A5FA", poll: "#F0E040", image: "#22C55E", challenge: "#F59E0B" };
const TYPE_LABEL: Record<string, string> = { text: "Texto", poll: "Encuesta", image: "Imagen", challenge: "Reto" };

export default function CreatorDashboardPage() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("el_pacto_token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    let userId: string;
    try { userId = JSON.parse(atob(token.split(".")[1])).sub; } catch { return; }

    Promise.all([
      fetch(`${API}/admin/my-stats`, { headers }).then((r) => r.json()),
      fetch(`${API}/users/me`, { headers }).then((r) => r.json()),
      fetch(`${API}/users/${userId}/profile`, { headers }).then((r) => r.json()),
    ]).then(([statsData, user, profile]) => {
      setStats(statsData);
      setMe({ ...user, followersCount: profile.followersCount ?? 0, followingCount: profile.followingCount ?? 0 });
    }).catch(() => {});
  }, []);

  const topPost = stats?.posts.slice().sort((a, b) => b.likesCount - a.likesCount)[0];

  const typeEngagement = stats?.posts.reduce((acc, p) => {
    if (!acc[p.type]) acc[p.type] = { count: 0, likes: 0 };
    acc[p.type].count++;
    acc[p.type].likes += p.likesCount;
    return acc;
  }, {} as Record<string, { count: number; likes: number }>) ?? {};

  // Posts per week (last 4 weeks)
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const postsThisWeek = stats?.posts.filter((p) => now - new Date(p.createdAt).getTime() < weekMs).length ?? 0;
  const postsLastWeek = stats?.posts.filter((p) => {
    const age = now - new Date(p.createdAt).getTime();
    return age >= weekMs && age < 2 * weekMs;
  }).length ?? 0;
  const weekTrend = postsThisWeek - postsLastWeek;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>

      {/* ── Perfil ── */}
      {!me && <SkeletonProfileCard />}
      {me && (
        <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(167,139,250,0.15)", border: "2px solid rgba(167,139,250,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, overflow: "hidden" }}>
              {me.avatar?.startsWith("http") || me.avatar?.startsWith("data:")
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={me.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (me.avatar && me.avatar.length <= 2 ? me.avatar : me.name?.[0]?.toUpperCase())}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 1, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name.toUpperCase()}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", color: "#aaa", whiteSpace: "nowrap" }}>{me.level.toUpperCase()}</span>
                {me.isSocio && <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 10, background: "#F0E040", color: "#000", whiteSpace: "nowrap" }}>SOCIO</span>}
                <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 10, background: "rgba(167,139,250,0.2)", color: "#A78BFA", whiteSpace: "nowrap" }}>CREADOR</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {[
              { label: "Seguidores", value: me.followersCount ?? 0 },
              { label: "Siguiendo",  value: me.followingCount  ?? 0 },
              { label: "XP",         value: me.xp.toLocaleString("es") },
              ...(me.city ? [{ label: "Ciudad", value: me.city }] : []),
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 10px", flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "#fff", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "#666", marginTop: 3, whiteSpace: "nowrap" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hero impacto ── */}
      <div style={{ background: "linear-gradient(135deg, #1a1024, #110a1d)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 16, padding: "22px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#A78BFA", textTransform: "uppercase", marginBottom: 6 }}>Tu impacto</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, letterSpacing: 1.5, lineHeight: 1.1 }}>
            {stats?.totalPosts ?? "—"} posts · {stats?.totalLikes ?? "—"} likes totales
          </div>
          <div style={{ fontSize: 12.5, color: "#888", marginTop: 6 }}>
            Media de {stats?.avgLikes ?? 0} likes por post
            {postsThisWeek > 0 && <> · <span style={{ color: weekTrend >= 0 ? "#22C55E" : "#ef4444" }}>{postsThisWeek} post{postsThisWeek !== 1 ? "s" : ""} esta semana {weekTrend > 0 ? `(+${weekTrend} vs anterior)` : weekTrend < 0 ? `(${weekTrend} vs anterior)` : ""}</span></>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#A78BFA" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>Creator activo</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, color: "#fff", margin: "0 0 14px" }}>ESTADÍSTICAS</h2>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {!stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />
            ))
          ) : (
            <>
              <StatCard label="Posts publicados" value={stats.totalPosts ?? 0} icon="📝" color="#60A5FA" />
              <StatCard label="Likes totales"    value={stats.totalLikes ?? 0} icon="❤️" color="#EC4899" />
              <StatCard label="Media por post"   value={stats.avgLikes ?? 0}   icon="📈" color="#22C55E" sub="likes/post" />
              <StatCard label="Esta semana"      value={postsThisWeek}          icon="📅" color="#A78BFA" sub={weekTrend > 0 ? `↑ ${weekTrend} más que la anterior` : weekTrend < 0 ? `↓ ${Math.abs(weekTrend)} menos` : "igual que la anterior"} />
            </>
          )}
        </div>
      </section>

      {/* ── Rendimiento por tipo ── */}
      {Object.keys(typeEngagement).length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, color: "#fff", margin: "0 0 14px" }}>RENDIMIENTO POR TIPO</h2>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {Object.entries(typeEngagement).map(([type, data]) => {
              const avg = data.count > 0 ? Math.round(data.likes / data.count) : 0;
              const color = TYPE_COLOR[type] ?? "#888";
              return (
                <div key={type} style={{ background: "#141414", border: `1px solid ${color}22`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: color + "22", color }}>{TYPE_LABEL[type] ?? type}</span>
                    <span style={{ fontSize: 11, color: "#555" }}>{data.count} post{data.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "#fff", lineHeight: 1 }}>{avg}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>media de likes</div>
                  <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, avg * 10)}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Mejor post ── */}
      {topPost && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, color: "#fff", margin: "0 0 14px" }}>MEJOR POST</h2>
          <div style={{ background: "#141414", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(236,72,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏆</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 8px", fontSize: 14, color: "#ddd", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const }}>{topPost.content}</p>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#666" }}>
                <span>{new Date(topPost.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "#EC4899", lineHeight: 1 }}>❤ {topPost.likesCount}</div>
              <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>likes</div>
            </div>
          </div>
        </section>
      )}

      {/* ── Accesos rápidos ── */}
      <section>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, color: "#fff", margin: "0 0 14px" }}>ACCESOS RÁPIDOS</h2>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {[
            { href: "/creator/posts",    icon: "📝", label: "Nuevo post",       sub: "Publica en el feed",       color: "#60A5FA" },
            { href: "/creator/events",   icon: "🎙", label: "Proponer charla",  sub: "Envía para revisión",      color: "#A78BFA" },
            { href: "/creator/messages", icon: "💬", label: "Ver mensajes",     sub: "Bandeja de fans",          color: "#EC4899" },
          ].map((q) => (
            <Link key={q.href} href={q.href} style={{ background: "#141414", border: `1px solid ${q.color}22`, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, textDecoration: "none", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = q.color + "55")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = q.color + "22")}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: q.color + "1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{q.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{q.label}</div>
                <div style={{ fontSize: 11, color: "#666" }}>{q.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {!stats && (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", marginTop: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />
          ))}
        </div>
      )}
    </div>
  );
}
