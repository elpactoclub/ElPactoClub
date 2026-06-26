"use client";

// EN: Global toast notification that reads the current message from the UI store and styles it by variant.
// ES: Notificación toast global que lee el mensaje actual del store de UI y lo estiliza según la variante.

import { useUIStore } from "@/stores/uiStore";

// EN: Picks accent color, background and icon based on the message content (error/success/neutral).
// ES: Elige color de acento, fondo e icono según el contenido del mensaje (error/éxito/neutral).
function variantOf(msg: string): { accent: string; bg: string; icon: string | null } {
  const m = msg.toLowerCase();
  if (msg.includes("❌") || m.includes("error") || m.includes("insuficient") || m.includes("sin créditos") || m.includes("necesitas")) {
    return { accent: "#ef4444", bg: "#1c1110", icon: "✕" };
  }
  if (msg.includes("✓") || msg.includes("✅") || msg.includes("🎟") || msg.includes("📩") || m.includes("enviado") || m.includes("añadid") || m.includes("copiad") || m.includes("leíd")) {
    return { accent: "#22C55E", bg: "#0f1a12", icon: "✓" };
  }
  return { accent: "var(--color-accent)", bg: "#1a1a14", icon: null };
}

// EN: Toast component that displays the active UI-store message as a floating banner.
// ES: Componente toast que muestra el mensaje activo del store de UI como banner flotante.
export default function Toast() {
  const toastMessage = useUIStore((s) => s.toastMessage);
  const v = variantOf(toastMessage ?? "");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 22,
        left: "50%",
        transform: toastMessage ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(8px)",
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: v.bg,
        color: "#fff",
        padding: "11px 18px",
        borderRadius: 12,
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: "var(--font-body)",
        zIndex: 9999,
        opacity: toastMessage ? 1 : 0,
        transition: "opacity 0.25s, transform 0.25s",
        pointerEvents: "none",
        maxWidth: "min(90vw, 420px)",
        border: `1px solid ${v.accent}`,
        borderLeft: `4px solid ${v.accent}`,
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
      }}
    >
      {v.icon && (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: v.accent, color: "#000", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
          {v.icon}
        </span>
      )}
      <span>{toastMessage || ""}</span>
    </div>
  );
}
