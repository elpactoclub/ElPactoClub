"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

interface Badge {
  code: string;
  name: string;
  emoji: string;
  description: string;
  isSecret: boolean;
}

interface UserBadge { badgeCode: string; }

const STATIC_BADGES: Badge[] = [
  { code: "primer_pacto", name: "Primer voto", emoji: "🏀", description: "Primer voto registrado", isSecret: false },
  { code: "socializador", name: "Socializador", emoji: "💬", description: "10 mensajes en chat", isSecret: false },
  { code: "llama_viva", name: "7 días", emoji: "🔥", description: "7 días de racha", isSecret: false },
  { code: "fundador", name: "Fundador", emoji: "👑", description: "Socio en el primer mes", isSecret: false },
  { code: "en_el_bombo", name: "En el bombo", emoji: "🎟", description: "Primera participación en sorteo", isSecret: false },
  { code: "fan_directo", name: "Fan directo", emoji: "✉", description: "Primer DM a creador", isSecret: false },
  { code: "og_dia_1", name: "Secreto", emoji: "🥇", description: "Secreto", isSecret: true },
  { code: "impacto_global", name: "Secreto", emoji: "🌐", description: "Secreto", isSecret: true },
];

const STATIC_UNLOCKED = new Set(["primer_pacto", "socializador", "llama_viva", "fundador", "en_el_bombo", "fan_directo"]);

const BADGE_COLORS: Record<string, string> = {
  llama_viva: "#FF6B1A", fundador: "#F0E040", primer_pacto: "#fff", socializador: "#fff",
  en_el_bombo: "#fff", fan_directo: "#fff",
};

const LEVEL_NEXT: Record<string, { label: string; xp: number }> = {
  Rookie:  { label: "Starter", xp: 500 },
  Starter: { label: "MVP", xp: 2000 },
  MVP:     { label: "Leyenda", xp: 5000 },
  Leyenda: { label: "MAX", xp: 9999 },
};

export default function ProfileModal({ inline = false }: { inline?: boolean } = {}) {
  const { isProfileOpen, closeProfile, openCarnet, openPersonalize, showToast } = useUIStore();
  const { name, avatar, city, credits, xp, level, xpProgress, tickets, streak, referralCode, isAuthenticated, isSocio, logout } = useUserStore();

  const [catalog, setCatalog] = useState<Badge[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [adminRole, setAdminRole] = useState<"admin" | "creator" | null>(null);

  const isActive = inline || isProfileOpen;

  useEffect(() => {
    if (!isActive) return;
    try {
      const token = localStorage.getItem("el_pacto_token");
      if (!token) { setAdminRole(null); return; }
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.role === "admin" || payload?.role === "creator") setAdminRole(payload.role);
      else setAdminRole(null);
    } catch { setAdminRole(null); }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    api.get("/badges")
      .then((r) => setCatalog(r.data.length > 0 ? r.data : STATIC_BADGES))
      .catch(() => setCatalog(STATIC_BADGES));
    if (isAuthenticated) {
      api.get("/badges/me")
        .then((r) => setUnlocked(new Set<string>((r.data as UserBadge[]).map((b) => b.badgeCode))))
        .catch(() => setUnlocked(STATIC_UNLOCKED));
    } else {
      setUnlocked(STATIC_UNLOCKED);
    }
  }, [isActive, isAuthenticated]);

  if (!inline && !isProfileOpen) return null;

  const openAuth = () => { useUIStore.setState({ isAuthOpen: true } as any); closeProfile(); };
  const handleLogout = () => { logout(); showToast("Sesión cerrada 🚪"); closeProfile(); };

  const handleCopyReferral = async () => {
    try { await navigator.clipboard.writeText(referralCode); showToast("¡Código copiado! 📋 " + referralCode); }
    catch { showToast(referralCode); }
  };
  const handleShareReferral = async () => {
    const text = `Únete a El Pacto BC con mi código ${referralCode} y los dos ganamos 50 créditos 🏀`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ title: "El Pacto BC", text }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(text); showToast("¡Enlace copiado! 📋"); } catch { showToast(text); }
  };

  const history = [
    { desc: "Votaste diseño camiseta", amount: -5 },
    { desc: "Recompensa diaria", amount: 20 },
    { desc: "Suscripción Socio El Pacto", amount: 200 },
  ];

  const next = LEVEL_NEXT[level] ?? { label: "MAX", xp: 9999 };
  const sinceDate = "Ene 2025";

  const content = (
    <>
      {/* Handle (solo modal) */}
      {!inline && <div style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "14px auto 20px" }} />}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "0 16px 16px" }}>
          {/* Avatar */}
          <button onClick={openPersonalize} style={{ position: "relative", flexShrink: 0, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FF6B1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{avatar}</div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, border: "2px solid #181818" }}>✎</div>
          </button>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 1, marginBottom: 3 }}>{name.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 7 }}>📍 {city || "Sin ciudad"} · Socio desde {sinceDate}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", color: "#aaa" }}>{level.toUpperCase()}</span>
              {isSocio && <span style={{ fontSize: 8, fontWeight: 900, padding: "3px 8px", borderRadius: 12, background: "var(--color-accent)", color: "#000" }}>SOCIO</span>}
              {streak > 0 && <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 8px", borderRadius: 12, background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }}>🔥 {streak} días</span>}
            </div>
          </div>

          {/* Close (solo modal) */}
          {!inline && (
            <button onClick={closeProfile} style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a2a", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
          )}
        </div>

        {/* Auth CTA */}
        {!isAuthenticated && (
          <div style={{ margin: "0 16px 12px", background: "#222", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 10 }}>Regístrate para guardar tu XP, competir en el ranking y votar decisiones oficiales.</p>
            <button onClick={openAuth} style={{ width: "100%", background: "var(--color-accent)", color: "#000", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              INICIAR SESIÓN / REGISTRARME ⚡
            </button>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, padding: "0 16px 12px" }}>
          {[
            { value: credits, label: "Créditos", color: "var(--color-accent)" },
            { value: xp.toLocaleString(), label: "XP", color: "#A78BFA" },
            { value: isAuthenticated ? "#1" : "#47", label: "Ranking", color: "#fff" },
            { value: tickets, label: "Sorteo", color: "#fff" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#222", borderRadius: 8, textAlign: "center", padding: "10px 4px" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP bar */}
        <div style={{ padding: "0 16px 4px" }}>
          <div style={{ height: 5, background: "#2a2a2a", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,var(--color-accent),#22C55E)", width: `${xpProgress}%`, borderRadius: 3, transition: "width 0.4s" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 16px 14px", fontSize: 9, color: "var(--color-muted)" }}>
          <span>{xp.toLocaleString()} XP · {level}</span>
          <span>{next.xp.toLocaleString()} → {next.label}</span>
        </div>

        {/* Carnet shortcut */}
        <button
          onClick={openCarnet}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", margin: "0 0 12px", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", boxSizing: "border-box" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "linear-gradient(135deg,#1a1a10,#252520)", border: "1px solid rgba(240,224,64,0.25)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ width: 36, height: 22, borderRadius: 5, background: "linear-gradient(135deg,var(--color-accent),#c8bc00)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Ver mi carnet de socio</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)" }}>Nº {isAuthenticated ? "#0001" : "#0047"} · {level} · Válido Dic 2025</div>
            </div>
            <div style={{ color: "var(--color-muted)", fontSize: 18 }}>›</div>
          </div>
        </button>

        {/* Admin shortcut — solo visible para admin/creator */}
        {/* Panel creator — visible para creator y admin */}
        {(adminRole === "creator" || adminRole === "admin") && (
          <a
            href="/creator/dashboard"
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", margin: "0 0 10px", padding: "0 16px", textDecoration: "none", boxSizing: "border-box" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "linear-gradient(135deg,#150d1f,#1a0f24)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#A78BFA,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎙</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Panel de creador</div>
                <div style={{ fontSize: 10, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Gestiona tu contenido</div>
              </div>
              <div style={{ color: "var(--color-muted)", fontSize: 18 }}>›</div>
            </div>
          </a>
        )}

        {/* Panel admin — solo visible para admin */}
        {adminRole === "admin" && (
          <a
            href="/admin/dashboard"
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", margin: "0 0 12px", padding: "0 16px", textDecoration: "none", boxSizing: "border-box" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "linear-gradient(135deg,#1a1a10,#211f0d)", border: "1px solid rgba(240,224,64,0.3)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#F0E040,#FF6B1A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🛡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Panel de administración</div>
                <div style={{ fontSize: 10, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Configuración del club</div>
              </div>
              <div style={{ color: "var(--color-muted)", fontSize: 18 }}>›</div>
            </div>
          </a>
        )}

        {/* Badges */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)" }}>MIS INSIGNIAS</span>
            <span style={{ fontSize: 10, color: "var(--color-muted)" }}>🔵 Algunas son secretas</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
            {catalog.map((b) => {
              const isUnlocked = unlocked.has(b.code);
              const isSecret = b.isSecret && !isUnlocked;
              const bgColor = BADGE_COLORS[b.code] ?? "rgba(255,255,255,0.08)";
              return (
                <button
                  key={b.code}
                  onClick={() => showToast(isSecret ? "Insignia secreta · sigue jugando" : `${b.emoji} ${b.name} — ${b.description}`)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: isSecret ? "rgba(255,255,255,0.04)" : isUnlocked ? (b.code === "llama_viva" ? "#FF6B1A22" : b.code === "fundador" ? "#F0E04022" : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)", border: isSecret ? "1.5px dashed rgba(255,255,255,0.15)" : isUnlocked ? `2px solid ${bgColor === "#fff" ? "rgba(255,255,255,0.5)" : bgColor}` : "1.5px solid rgba(255,255,255,0.1)", opacity: isUnlocked ? 1 : 0.5 }}>
                    {isSecret ? <span style={{ fontSize: 16, color: "#555", fontWeight: 700 }}>?</span> : b.emoji}
                  </div>
                  <div style={{ fontSize: 8, color: isUnlocked ? "#ccc" : "var(--color-muted)", textAlign: "center", lineHeight: 1.2, maxWidth: 56 }}>
                    {isSecret ? "Secreto" : b.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Referral */}
        <div style={{ margin: "0 16px 10px", background: "#222", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FF6B1A22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏀</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
              Invita · <span style={{ color: "var(--color-accent)" }}>{referralCode}</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--color-muted)" }}>Ambos ganáis +50 ⚡ al registrarse</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={handleCopyReferral}
              style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Copiar
            </button>
            <button
              onClick={handleShareReferral}
              style={{ background: "#2a2a2a", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              📤
            </button>
          </div>
        </div>

        {/* History */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10 }}>HISTORIAL RECIENTE</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ fontSize: 13, color: "#ddd" }}>{h.desc}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: h.amount > 0 ? "#22C55E" : "#ef4444" }}>
                {h.amount > 0 ? "+" : ""}{h.amount} ⚡
              </span>
            </div>
          ))}
        </div>

        {/* Logout */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            style={{ display: "block", width: "calc(100% - 32px)", margin: "20px 16px 0", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            CERRAR SESIÓN 🚪
          </button>
        )}
    </>
  );

  if (inline) {
    return <div style={{ width: "100%", paddingTop: 24, paddingBottom: 32 }}>{content}</div>;
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && closeProfile()}
    >
      <div
        style={{ background: "#181818", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", paddingBottom: 32 }}
        className="animate-slide-up"
      >
        {content}
      </div>
    </div>
  );
}
