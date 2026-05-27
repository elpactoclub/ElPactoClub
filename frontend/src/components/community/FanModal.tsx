"use client";

import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

const LEVEL_COLORS: Record<string, string> = {
  Leyenda: "#A78BFA",
  MVP: "#60A5FA",
  Starter: "#22C55E",
  Rookie: "#777",
};

function colorFor(name: string) {
  const palette = ["#22C55E", "#60A5FA", "#A78BFA", "#F472B6", "#F59E0B", "#34D399", "#F97316"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export default function FanModal() {
  const { isFanModalOpen, fanModalUser, fanModalData, closeFanModal, openDM, showToast } = useUIStore();
  const { isAuthenticated } = useUserStore();

  if (!isFanModalOpen || !fanModalUser) return null;

  const city  = fanModalData?.city  || "—";
  const level = fanModalData?.level || "Rookie";
  const xp    = fanModalData?.xp    ?? 0;
  const color = LEVEL_COLORS[level] || colorFor(fanModalUser);
  const initials = fanModalUser.slice(0, 2).toUpperCase();

  const handleDM = () => {
    if (!isAuthenticated) { showToast("Inicia sesión para enviar mensajes ⚡"); return; }
    closeFanModal();
    openDM();
  };

  const content = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Handle — mobile only */}
      <div className="lg:hidden" style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "14px auto 0", flexShrink: 0 }} />

      {/* Header gradient band */}
      <div style={{ background: `linear-gradient(135deg, ${color}18 0%, #111 100%)`, borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "28px 24px 24px", display: "flex", alignItems: "center", gap: 18 }}>
        {/* Avatar */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: color + "22", border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontSize: 24, color, flexShrink: 0 }}>
          {initials}
        </div>
        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 1, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fanModalUser.toUpperCase()}
          </div>
          {city !== "—" && (
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 6 }}>📍 {city}</div>
          )}
          <span style={{ fontSize: 9, fontWeight: 900, padding: "3px 10px", borderRadius: 20, background: color + "22", color, border: `1px solid ${color}44` }}>
            {level.toUpperCase()} · {xp.toLocaleString("es")} XP
          </span>
        </div>
        {/* Close — desktop */}
        <button
          onClick={closeFanModal}
          className="hidden lg:flex"
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >✕</button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "16px 20px 0" }}>
        {[
          { val: xp.toLocaleString("es"), label: "XP Total",  color: "var(--color-accent)" },
          { val: "—",                     label: "Días racha", color: "var(--color-green)"  },
          { val: "—",                     label: "Insignias",  color: "#fff"                },
        ].map((s) => (
          <div key={s.label} style={{ background: "#222", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "var(--color-muted)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, padding: "16px 20px 24px" }}>
        <button
          onClick={handleDM}
          style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 12, padding: "13px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          ✉ Enviar mensaje
        </button>
        <button
          onClick={() => { showToast(`${fanModalUser} añadido a seguidos ⭐`); closeFanModal(); }}
          style={{ flex: 1, background: "var(--color-accent)", color: "#000", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          ⭐ Seguir fan
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 310, backdropFilter: "blur(2px)" }}
        onClick={closeFanModal}
      />

      {/* Mobile: bottom sheet */}
      <div
        className="lg:hidden animate-slide-up"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 311, background: "#181818", borderRadius: "16px 16px 0 0", overflow: "hidden" }}
      >
        {content}
      </div>

      {/* Desktop: centered dialog */}
      <div
        className="hidden lg:block"
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 311, background: "#181818", borderRadius: 16, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {content}
      </div>
    </>
  );
}
