"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";
import AnimatedBar from "@/components/ui/AnimatedBar";
import Skel from "@/components/ui/Skel";
import { useAuthLoading } from "@/hooks/useAuthLoading";

interface Badge {
  code: string;
  name: string;
  emoji: string;
  description: string;
  isSecret: boolean;
}

interface UserBadge { badgeCode: string; }

// All 14 badge definitions — mirrors backend BADGE_DEFINITIONS
const BADGE_CATALOG: Badge[] = [
  { code: "primer_pacto",   name: "Primer Pacto",    emoji: "🏀", description: "Registra tu primer voto",            isSecret: false },
  { code: "socializador",   name: "Socializador",    emoji: "💬", description: "Envía 10 mensajes en el chat",       isSecret: false },
  { code: "llama_viva",     name: "Llama Viva",      emoji: "🔥", description: "7 días consecutivos activo",        isSecret: false },
  { code: "diamante",       name: "Diamante",        emoji: "💎", description: "30 días consecutivos activo",       isSecret: false },
  { code: "fundador",       name: "Fundador",        emoji: "👑", description: "Hazte socio en el primer mes",      isSecret: false },
  { code: "embajador",      name: "Embajador",       emoji: "🌍", description: "Primero de tu ciudad en unirse",    isSecret: false },
  { code: "en_el_bombo",    name: "En el Bombo",     emoji: "🎟", description: "Participa por primera vez en un sorteo", isSecret: false },
  { code: "fan_directo",    name: "Fan Directo",     emoji: "✉",  description: "Manda un DM a un creador",          isSecret: false },
  { code: "dribble_spirit", name: "Dribble Spirit",  emoji: "🇮🇳", description: "Dona al proyecto India",            isSecret: false },
  { code: "mentor",         name: "Mentor",          emoji: "🎓", description: "Dona al proyecto Tecnificar",       isSecret: false },
  { code: "impacto_global", name: "Impacto Global",  emoji: "🌐", description: "Dona a los dos proyectos sociales", isSecret: false },
  { code: "reclutador",     name: "Reclutador",      emoji: "🤝", description: "Invita a 3 amigos que se hagan socios", isSecret: false },
  { code: "semana_perfecta",name: "Semana Perfecta", emoji: "⭐", description: "Completa todas las misiones semanales", isSecret: false },
  { code: "og_dia_1",       name: "OG Día 1",        emoji: "🥇", description: "???",                               isSecret: true  },
];

const BADGE_ACCENT: Record<string, string> = {
  llama_viva:  "#FF6B1A",
  fundador:    "#F0E040",
  diamante:    "#60D0FF",
  og_dia_1:    "#F0E040",
};

const LEVEL_NEXT: Record<string, { label: string; xp: number }> = {
  Rookie:  { label: "Starter", xp: 500 },
  Starter: { label: "MVP",     xp: 2000 },
  MVP:     { label: "Leyenda", xp: 5000 },
  Leyenda: { label: "MAX",     xp: 9999 },
};

function formatSocioDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

interface FollowUser { id: string; name: string; avatar: string; level: string; xp: number; city?: string; isSocio: boolean; role: string; }

export default function ProfileModal({ inline = false }: { inline?: boolean } = {}) {
  const authLoading = useAuthLoading();
  const { isProfileOpen, closeProfile, openCarnet, openPersonalize, showToast, openUserProfile } = useUIStore();
  const {
    id: myId, name, avatar, city, credits, xp, level, xpProgress,
    tickets, streak, referralCode, isAuthenticated, isSocio,
    socioSince, rank, logout, fetchProfile,
  } = useUserStore();

  const [catalog, setCatalog] = useState<Badge[]>(BADGE_CATALOG);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [adminRole, setAdminRole] = useState<"admin" | "creator" | null>(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [activity, setActivity] = useState<{ id: string; type: string; title: string; body: string; createdAt: string }[]>([]);
  const [followList, setFollowList] = useState<FollowUser[] | null>(null);
  const [followListTitle, setFollowListTitle] = useState("");
  const [followListType, setFollowListType] = useState<"followers" | "following" | "blocked">("followers");
  const [followSearch, setFollowSearch] = useState("");
  const [blockedCount, setBlockedCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);

  const isActive = inline || isProfileOpen;

  // Decode admin/creator role from JWT
  useEffect(() => {
    if (!isActive) return;
    try {
      const token = localStorage.getItem("el_pacto_token");
      if (!token) { setAdminRole(null); return; }
      const payload = JSON.parse(atob(token.split(".")[1]));
      setAdminRole(payload?.role === "admin" || payload?.role === "creator" ? payload.role : null);
    } catch { setAdminRole(null); }
  }, [isActive]);

  // Refrescar datos del perfil (socioSince, rank, créditos…) al abrir
  useEffect(() => {
    if (isActive && isAuthenticated) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isAuthenticated]);

  // Fetch badge catalog + user badges
  useEffect(() => {
    if (!isActive) return;
    api.get("/badges")
      .then((r) => { if (r.data?.length > 0) setCatalog(r.data); })
      .catch(() => {});

    if (isAuthenticated) {
      api.get("/badges/me")
        .then((r) => setUnlocked(new Set<string>((r.data as UserBadge[]).map((b) => b.badgeCode))))
        .catch(() => setUnlocked(new Set()));
    } else {
      setUnlocked(new Set());
    }
  }, [isActive, isAuthenticated]);

  // Fetch follow counts + activity
  useEffect(() => {
    if (!isActive || !isAuthenticated || !myId) return;
    setCountsLoading(true);
    Promise.allSettled([
      api.get(`/users/${myId}/profile`).then((r) => setFollowCounts({ followers: r.data.followersCount ?? 0, following: r.data.followingCount ?? 0 })),
      api.get("/users/me/blocked").then((r) => setBlockedCount(Array.isArray(r.data) ? r.data.length : 0)),
    ]).finally(() => setCountsLoading(false));
    api.get("/users/me/activity")
      .then((r) => setActivity(Array.isArray(r.data) ? r.data.slice(0, 8) : []))
      .catch(() => {});
  }, [isActive, isAuthenticated, myId]);

  const openFollowList = async (type: "followers" | "following" | "blocked") => {
    setFollowList(null);
    setFollowSearch("");
    setFollowListType(type);
    setFollowListTitle(type === "followers" ? "Seguidores" : type === "following" ? "Siguiendo" : "Bloqueados");
    try {
      const r = await api.get(`/users/me/${type}`);
      setFollowList(Array.isArray(r.data) ? r.data : []);
    } catch { setFollowList([]); }
  };

  const handleUnblock = async (id: string) => {
    try {
      await api.delete(`/users/${id}/block`);
      setFollowList((prev) => (prev ? prev.filter((u) => u.id !== id) : prev));
      setBlockedCount((c) => Math.max(0, c - 1));
      showToast("Usuario desbloqueado");
    } catch { showToast("No se pudo desbloquear"); }
  };

  if (!inline && !isProfileOpen) return null;

  const handleLogout = () => { logout(); showToast("Sesión cerrada 🚪"); closeProfile(); };
  const openAuth = () => { useUIStore.setState({ isAuthOpen: true } as unknown as Parameters<typeof useUIStore.setState>[0]); closeProfile(); };

  const handleCopyReferral = async () => {
    try { await navigator.clipboard.writeText(referralCode); showToast("Código copiado 📋 " + referralCode); }
    catch { showToast(referralCode); }
  };
  const handleShareReferral = async () => {
    const text = `Únete a El Pacto BC con mi código ${referralCode} y los dos ganamos 50 créditos 🏀`;
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: object) => Promise<void> }).share) {
      try { await (navigator as Navigator & { share: (d: object) => Promise<void> }).share({ title: "El Pacto BC", text }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(text); showToast("¡Enlace copiado! 📋"); } catch { showToast(text); }
  };

  const next = LEVEL_NEXT[level] ?? { label: "MAX", xp: 9999 };
  const rankDisplay = rank != null ? `#${rank}` : "—";

  const content = (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Handle (solo modal mobile) */}
      {!inline && (
        <div className="sm:hidden" style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "14px auto 18px" }} />
      )}

      {/* Spacer desktop (reemplaza el handle) */}
      {!inline && (
        <div className="hidden sm:block" style={{ height: 20 }} />
      )}

      {/* Close button desktop */}
      {!inline && (
        <button
          onClick={closeProfile}
          className="hidden sm:flex"
          style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: "50%", background: "#2a2a2a", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, alignItems: "center", justifyContent: "center" }}
        >✕</button>
      )}

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "0 16px 16px" }}>
        <button onClick={isAuthenticated ? openPersonalize : openAuth} style={{ position: "relative", flexShrink: 0, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FF6B1A33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "2px solid rgba(255,107,26,0.4)", overflow: "hidden" }}>
            {avatar?.startsWith("http") || avatar?.startsWith("data:")
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
              : avatar}
          </div>
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, border: "2px solid #181818" }}>✎</div>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 1, marginBottom: 3 }}>
            {name.toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 7 }}>
            {city ? `📍 ${city}` : "📍 Sin ciudad"}
            {isSocio && socioSince ? ` · Socio desde ${formatSocioDate(socioSince)}` : ""}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", color: "#aaa" }}>
              {level.toUpperCase()}
            </span>
            {isSocio && (
              <span style={{ fontSize: 8, fontWeight: 900, padding: "3px 8px", borderRadius: 12, background: "var(--color-accent)", color: "#000" }}>
                SOCIO
              </span>
            )}
            {streak > 0 && (
              <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 8px", borderRadius: 12, background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }}>
                🔥 {streak} días
              </span>
            )}
          </div>
          <button
            onClick={isAuthenticated ? openPersonalize : openAuth}
            style={{ fontSize: 10, fontWeight: 700, color: "var(--color-accent)", background: "rgba(240,224,64,0.08)", border: "1px solid rgba(240,224,64,0.25)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            ✎ Editar perfil
          </button>
        </div>

        {/* Close (mobile modal only) */}
        {!inline && (
          <button
            onClick={closeProfile}
            className="sm:hidden"
            style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a2a", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >✕</button>
        )}
      </div>

      {/* ── Auth CTA ────────────────────────────────── */}
      {!isAuthenticated && (
        <div style={{ margin: "0 16px 14px", background: "#222", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 10 }}>
            Regístrate para guardar tu XP, competir en el ranking y votar decisiones oficiales.
          </p>
          <button
            onClick={openAuth}
            style={{ width: "100%", background: "var(--color-accent)", color: "#000", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            INICIAR SESIÓN / REGISTRARME ⚡
          </button>
        </div>
      )}

      {/* ── Stats grid ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isAuthenticated ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 6, padding: "0 16px 12px" }}>
        {[
          { value: credits,  label: "Créditos", color: "var(--color-accent)", loading: authLoading },
          { value: xp.toLocaleString("es"), label: "XP", color: "#A78BFA", loading: authLoading },
          { value: rankDisplay, label: "Ranking", color: "#fff", loading: authLoading || (isAuthenticated && rank == null) },
          ...(isAuthenticated ? [{ value: tickets, label: "Sorteo", color: "#fff", loading: authLoading }] : []),
        ].map((s, i) => (
          <div key={i} style={{ background: "#222", borderRadius: 8, textAlign: "center", padding: "10px 4px" }}>
            {s.loading
              ? <Skel h={22} style={{ width: "55%", margin: "0 auto", borderRadius: 5 }} />
              : <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: s.color, lineHeight: 1.1 }}>{s.value}</div>}
            <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── XP bar ──────────────────────────────────── */}
      <div style={{ padding: "0 16px 2px" }}>
        <div style={{ height: 5, background: "#2a2a2a", borderRadius: 3, overflow: "hidden" }}>
          <AnimatedBar pct={xpProgress} background="linear-gradient(90deg,var(--color-accent),#22C55E)" />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 16px 14px", fontSize: 9, color: "var(--color-muted)" }}>
        <span>{xp.toLocaleString("es")} XP · {level}</span>
        <span>{next.xp.toLocaleString("es")} → {next.label}</span>
      </div>

      {/* ── Seguidores / Siguiendo ──────────────────── */}
      {isAuthenticated && (
        <div style={{ display: "flex", gap: 8, padding: "0 16px 14px" }}>
          <button
            onClick={() => openFollowList("followers")}
            style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "center" }}
          >
            {countsLoading ? <Skel w={28} h={22} style={{ margin: "0 auto", borderRadius: 5 }} /> : <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "#fff", lineHeight: 1.1 }}>{followCounts.followers}</div>}
            <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 2 }}>Seguidores</div>
          </button>
          <button
            onClick={() => openFollowList("following")}
            style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "center" }}
          >
            {countsLoading ? <Skel w={28} h={22} style={{ margin: "0 auto", borderRadius: 5 }} /> : <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "#fff", lineHeight: 1.1 }}>{followCounts.following}</div>}
            <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 2 }}>Siguiendo</div>
          </button>
          <button
            onClick={() => openFollowList("blocked")}
            style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "center" }}
          >
            {countsLoading ? <Skel w={28} h={22} style={{ margin: "0 auto", borderRadius: 5 }} /> : <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "#fff", lineHeight: 1.1 }}>{blockedCount}</div>}
            <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 2 }}>Bloqueados</div>
          </button>
        </div>
      )}

      {/* ── Carnet shortcut ─────────────────────────── */}
      {isSocio && (
        <button
          onClick={openCarnet}
          style={{ display: "block", width: "100%", padding: "0 16px 12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", boxSizing: "border-box" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#1a1a10,#252520)", border: "1px solid rgba(240,224,64,0.25)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ width: 36, height: 22, borderRadius: 5, background: "linear-gradient(135deg,var(--color-accent),#c8bc00)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Ver mi carnet de socio</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{level} · Socio desde {formatSocioDate(socioSince)}</div>
            </div>
            <div style={{ color: "var(--color-muted)", fontSize: 18 }}>›</div>
          </div>
        </button>
      )}

      {/* ── Creator / Admin panels ───────────────────── */}
      {(adminRole === "creator" || adminRole === "admin") && (
        <a href="/creator/dashboard" style={{ display: "block", padding: "0 16px 10px", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#150d1f,#1a0f24)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#A78BFA,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎙</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Panel de creador</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Gestiona tu contenido</div>
            </div>
            <div style={{ color: "var(--color-muted)", fontSize: 18 }}>›</div>
          </div>
        </a>
      )}
      {adminRole === "admin" && (
        <a href="/admin/dashboard" style={{ display: "block", padding: "0 16px 12px", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#1a1a10,#211f0d)", border: "1px solid rgba(240,224,64,0.3)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#F0E040,#FF6B1A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🛡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Panel de administración</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Configuración del club</div>
            </div>
            <div style={{ color: "var(--color-muted)", fontSize: 18 }}>›</div>
          </div>
        </a>
      )}

      {/* ── Insignias ───────────────────────────────── */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)" }}>
            MIS INSIGNIAS
          </span>
          <span style={{ fontSize: 10, color: "#555" }}>
            {unlocked.size} / {catalog.filter(b => !b.isSecret).length + (unlocked.has("og_dia_1") ? 1 : 0)}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {catalog.map((b) => {
            const isUnlocked = unlocked.has(b.code);
            const isHidden = b.isSecret && !isUnlocked;
            const accent = BADGE_ACCENT[b.code];
            return (
              <button
                key={b.code}
                onClick={() => showToast(isHidden ? "Insignia secreta · sigue jugando 🔒" : `${b.emoji} ${b.name} — ${b.description}`)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  background: isUnlocked ? (accent ? `${accent}22` : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)",
                  border: isHidden
                    ? "1.5px dashed rgba(255,255,255,0.12)"
                    : isUnlocked
                      ? `2px solid ${accent ?? "rgba(255,255,255,0.4)"}`
                      : "1.5px solid rgba(255,255,255,0.1)",
                  opacity: isUnlocked ? 1 : 0.45,
                  transition: "opacity 0.2s",
                }}>
                  {isHidden ? <span style={{ fontSize: 16, color: "#444", fontWeight: 700 }}>?</span> : b.emoji}
                </div>
                <div style={{ fontSize: 8, color: isUnlocked ? "#ccc" : "#555", textAlign: "center", lineHeight: 1.2, maxWidth: 58 }}>
                  {isHidden ? "Secreto" : b.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Cómo ganar insignias — guía rápida */}
        {isAuthenticated && unlocked.size < 3 && (
          <div style={{ marginTop: 14, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 8 }}>
              CÓMO CONSEGUIRLAS
            </div>
            {[
              { emoji: "🏀", text: "Vota en cualquier decisión del club" },
              { emoji: "🔥", text: "Entra 7 días seguidos para la racha" },
              { emoji: "🎟", text: "Entra en un sorteo desde Eventos" },
            ].map((tip) => (
              <div key={tip.text} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11, color: "#888" }}>
                <span>{tip.emoji}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Código referido ─────────────────────────── */}
      <div style={{ margin: "0 16px 14px", background: "#222", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FF6B1A22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏀</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
            Invita ·{" "}
            {isAuthenticated && referralCode
              ? <span style={{ color: "var(--color-accent)" }}>{referralCode}</span>
              : <span style={{ color: "#555", letterSpacing: 2 }}>PACTO-XXXXXX</span>
            }
          </div>
          <div style={{ fontSize: 10, color: "var(--color-muted)" }}>
            {isAuthenticated ? "Ambos ganáis +50 ⚡ al registrarse" : "Inicia sesión para ver tu código"}
          </div>
        </div>
        {isAuthenticated && referralCode && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={handleCopyReferral}
              style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Copiar
            </button>
            <button
              onClick={handleShareReferral}
              style={{ background: "#2a2a2a", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}
            >
              📤
            </button>
          </div>
        )}
      </div>

      {/* ── Actividad reciente ──────────────────────── */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 12 }}>
          ACTIVIDAD RECIENTE
        </div>
        {isAuthenticated ? (
          activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#444" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Sin actividad todavía</div>
              <div style={{ fontSize: 11, color: "#333" }}>Vota, chatea o gira la ruleta para empezar</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {activity.map((item) => {
                const iconMap: Record<string, string> = { badge_unlock: "🏅", bet_result: "🎲", mission_complete: "🎯", post_creator: "📝", new_vote: "🗳", new_follow: "👤" };
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#1a1a1a", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{iconMap[item.type] ?? "⚡"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#ddd", marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: "#666", lineHeight: 1.3 }}>{item.body}</div>
                    </div>
                    <div style={{ fontSize: 9, color: "#444", flexShrink: 0, whiteSpace: "nowrap" }}>{new Date(item.createdAt).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Inicia sesión para ver tu actividad</div>
            <div style={{ fontSize: 10, color: "#333" }}>Votos, recompensas, sorteos y más</div>
          </div>
        )}
      </div>

      {/* ── Logout ──────────────────────────────────── */}
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          style={{ display: "block", width: "calc(100% - 32px)", margin: "4px 16px 0", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          CERRAR SESIÓN 🚪
        </button>
      )}
    </div>
  );

  const followListModal = followListTitle ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}
      onClick={() => { setFollowList(null); setFollowListTitle(""); }}
    >
      <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 400, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{followListTitle}</span>
          <button onClick={() => { setFollowList(null); setFollowListTitle(""); setFollowSearch(""); }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
        {followList !== null && followList.length > 0 && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <input
              value={followSearch}
              onChange={(e) => setFollowSearch(e.target.value)}
              placeholder="Buscar..."
              style={{ width: "100%", background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {followList === null && <div style={{ textAlign: "center", color: "#666", padding: 24, fontSize: 13 }}>Cargando...</div>}
          {followList?.length === 0 && <div style={{ textAlign: "center", color: "#555", padding: 24, fontSize: 13 }}>{followListType === "blocked" ? "No has bloqueado a nadie" : "Nadie todavía"}</div>}
          {followList?.filter((u) => !followSearch || u.name.toLowerCase().includes(followSearch.toLowerCase())).map((u) => (
            <div key={u.id}
              onClick={() => { if (followListType === "blocked") return; setFollowList(null); setFollowListTitle(""); closeProfile(); openUserProfile(u.id); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: followListType === "blocked" ? "default" : "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                {u.avatar?.startsWith("http") || u.avatar?.startsWith("data:") ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{u.avatar}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{u.name}</span>
                  {u.role === "creator" && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "rgba(167,139,250,0.2)", color: "#A78BFA" }}>CREADOR</span>}
                  {u.isSocio && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "rgba(240,224,64,0.15)", color: "#F0E040" }}>SOCIO</span>}
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>{u.level} · {(u.xp ?? 0).toLocaleString("es")} XP{u.city ? ` · ${u.city}` : ""}</div>
              </div>
              {followListType === "blocked" ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnblock(u.id); }}
                  style={{ flexShrink: 0, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#aaa", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  Desbloquear
                </button>
              ) : (
                <span style={{ fontSize: 16, color: "#444" }}>›</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  if (inline) {
    return <>{followListModal}<div style={{ width: "100%", paddingTop: 24, paddingBottom: 32 }}>{content}</div></>;
  }

  return (
    <>
      {followListModal}
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300 }}
        onClick={closeProfile}
      />

      {/* Mobile: bottom sheet */}
      <div
        className="sm:hidden animate-slide-up"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301, background: "#181818", borderRadius: "16px 16px 0 0", maxHeight: "90vh", overflowY: "auto", paddingBottom: 32 }}
      >
        {content}
      </div>

      {/* Desktop: centered dialog */}
      <div
        className="hidden sm:block animate-dialog-in"
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 301, background: "#181818", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", paddingBottom: 32, boxShadow: "0 32px 80px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {content}
      </div>
    </>
  );
}
