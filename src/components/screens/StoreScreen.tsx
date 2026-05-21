"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

export default function StoreScreen() {
  const [activeTab, setActiveTab] = useState<"sub" | "cred" | "merch">("sub");
  const { credits } = useUserStore();
  const { showToast, openPayment } = useUIStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
      {/* Credits header */}
      <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "16px 16px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", color: "var(--color-muted)", textTransform: "uppercase", lineHeight: 1.6 }}>TUS<br />CRÉDITOS</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 48, color: "var(--color-accent)", lineHeight: 1 }}>{credits}</div>
        </div>
        <button
          onClick={() => setActiveTab("cred")}
          style={{ flex: 1, background: "var(--color-accent)", color: "#000", border: "none", padding: "16px", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          + Comprar
        </button>
      </div>

      {/* Tab pills */}
      <div style={{ display: "flex", gap: 8 }}>
        {([["sub", "Suscripción"], ["cred", "Créditos"], ["merch", "Merch"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{ flex: 1, padding: "10px 8px", borderRadius: 20, fontSize: 13, fontWeight: activeTab === id ? 700 : 500, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s", background: activeTab === id ? "#fff" : "transparent", color: activeTab === id ? "#000" : "var(--color-muted)", border: activeTab === id ? "none" : "1px solid rgba(255,255,255,0.15)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SUBSCRIPTION TAB */}
      {activeTab === "sub" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Fan Libre — flat row */}
          <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Fan Libre</span>
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "1px", color: "var(--color-accent)" }}>GRATIS</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-muted)" }}>✓ Ver todo el contenido · ✓ 2 créditos/mes</div>
          </div>

          {/* Socio El Pacto */}
          <div style={{ background: "#111", borderRadius: 10, padding: "18px 18px", border: "1px solid rgba(240,224,64,0.35)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>Socio El Pacto</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Todo desbloqueado</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 40, color: "var(--color-accent)", lineHeight: 1 }}>5€</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>/mes</div>
              </div>
            </div>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {[
                ["200 créditos mensuales", true],
                ["Acceso a charlas exclusivas", false],
                ["Participación en sorteos", false],
                ["Voto en todas las decisiones", false],
                ["Carnet de socio digital", false],
              ].map(([text, bold]) => (
                <div key={text as string} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: bold ? "#fff" : "var(--color-muted)" }}>
                  <span style={{ color: "var(--color-accent)", fontWeight: 700, fontSize: 14 }}>✓</span>
                  {bold ? <strong style={{ color: "#fff" }}>{text}</strong> : <span>{text}</span>}
                </div>
              ))}
            </div>

            <button
              onClick={() => openPayment()}
              style={{ width: "100%", background: "var(--color-accent)", color: "#000", border: "none", padding: "16px", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Hacerme socio →
            </button>
          </div>

          {/* Benefits label */}
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", padding: "4px 2px" }}>
            BENEFICIOS EXCLUSIVOS PARA SOCIOS
          </div>

          {/* Basketball Emotion */}
          <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => showToast("Basketball Emotion · Muestra tu carnet")}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg,#FF6B1A,#FF8C42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🏀</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Basketball Emotion</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>La mayor tienda de basket de España</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-accent)", lineHeight: 1 }}>5%</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "var(--color-muted)", textTransform: "uppercase", marginTop: 2 }}>DESCUENTO</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)", marginTop: 4 }}>Ver carnet →</div>
            </div>
          </div>

          {/* Hoops */}
          <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => showToast("Hoops · Muestra tu carnet")}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg,#d4c800,#F0E040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>⚡</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Hoops</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Material deportivo oficial del club</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-accent)", lineHeight: 1 }}>10%</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "var(--color-muted)", textTransform: "uppercase", marginTop: 2 }}>DESCUENTO</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)", marginTop: 4 }}>Ver carnet →</div>
            </div>
          </div>
        </div>
      )}

      {/* CREDITS TAB */}
      {activeTab === "cred" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.6, padding: "0 2px" }}>
            Compra créditos para votar, participar en sorteos, charlas exclusivas y enviar mensajes a los creadores.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              onClick={() => showToast("Abriendo Stripe — 100 créditos · 3,5€")}
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer" }}
            >
              <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>⚡</span>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>100 créditos</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent)", lineHeight: 1 }}>3,5€</div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 8 }}>1 sorteo · 20 votos</div>
            </button>
            <button
              onClick={() => showToast("Abriendo Stripe — 200 créditos · 6€")}
              style={{ background: "#1a1a1a", border: "1px solid rgba(240,224,64,0.4)", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", position: "relative" }}
            >
              <div style={{ position: "absolute", top: 10, right: 10, background: "var(--color-accent)", color: "#000", fontSize: 8, fontWeight: 900, padding: "2px 7px", borderRadius: 10 }}>POPULAR</div>
              <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>⚡⚡</span>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>200 créditos</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent)", lineHeight: 1 }}>6€</div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 8 }}>2 sorteos · 4 charlas</div>
            </button>
          </div>

          <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "18px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>¿Para qué sirven los créditos?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                ["Votación del club", "5 ⚡"],
                ["Apuesta grupal", "20 ⚡"],
                ["Mensaje a creador", "50 ⚡"],
                ["Charla exclusiva", "50 ⚡"],
                ["Sorteo del mes", "75 ⚡"],
              ].map(([label, cost], i, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ color: "var(--color-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>{cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MERCH TAB */}
      {activeTab === "merch" && (
        <div style={{ background: "#1a1a1a", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "64px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏀</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, letterSpacing: 2, marginBottom: 8 }}>MERCH PRÓXIMAMENTE</div>
          <div style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.6 }}>
            La tienda oficial de El Pacto BC abre pronto.<br />
            Los socios tendrán acceso prioritario.
          </div>
        </div>
      )}
    </div>
  );
}
