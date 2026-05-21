"use client";

import { useUIStore } from "@/stores/uiStore";

const tabs = [
  { id: "home" as const, icon: "🏠", label: "Inicio" },
  { id: "comunidad" as const, icon: "💬", label: "Comunidad" },
  { id: "eventos" as const, icon: "🏀", label: "Eventos" },
  { id: "store" as const, icon: "🛒", label: "Tienda" },
  { id: "about" as const, icon: "⚡", label: "El Pacto" },
];

export default function BottomNav() {
  const { activeTab, setTab } = useUIStore();

  return (
    <nav
      style={{
        background: "var(--color-black)",
        borderTop: "1px solid rgba(255,255,255,0.16)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        flexShrink: 0,
        zIndex: 200,
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 4px 14px",
              cursor: "pointer",
              position: "relative",
              background: "transparent",
              border: "none",
            }}
          >
            <span
              style={{
                fontSize: "26px",
                marginBottom: "4px",
                lineHeight: 1,
                transition: "transform 0.2s",
                transform: active ? "scale(1.15)" : "scale(1)",
                display: "block",
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.3px",
                color: active ? "var(--color-accent)" : "var(--color-muted)",
                lineHeight: 1,
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </span>
            {tab.id === "comunidad" && (
              <div style={{ position: "absolute", top: "6px", right: "calc(50% - 14px)", width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-red)", border: "2px solid var(--color-black)" }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
