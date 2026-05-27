"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

const CREDIT_PACKS = {
  "100": { credits: 100, price: "3,5€", label: "1 sorteo · 20 votos", emoji: "⚡", popular: false },
  "200": { credits: 200, price: "6€", label: "2 sorteos · 4 charlas", emoji: "⚡⚡", popular: true },
} as const;

type PackId = keyof typeof CREDIT_PACKS;

export default function StoreScreen() {
  const [activeTab, setActiveTab] = useState<"sub" | "cred" | "merch">("sub");
  const [selectedPack, setSelectedPack] = useState<PackId | null>(null);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const { credits } = useUserStore();
  const { showToast, openPayment } = useUIStore();

  const handleBuyCredits = async () => {
    if (!selectedPack) return;
    setBuyingCredits(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("el_pacto_token") : null;
      const res = await fetch(`${API}/store/checkout-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ pack: selectedPack }),
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      if (url) window.location.href = url;
      else throw new Error();
    } catch {
      showToast("Error al conectar con el servidor de pago");
      setBuyingCredits(false);
    }
  };

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
            {(Object.entries(CREDIT_PACKS) as [PackId, typeof CREDIT_PACKS[PackId]][]).map(([id, pkg]) => {
              const isSelected = selectedPack === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedPack(isSelected ? null : id)}
                  style={{
                    background: isSelected ? "linear-gradient(135deg,#1a1a08,#252508)" : "#1a1a1a",
                    border: isSelected ? "2px solid var(--color-accent)" : pkg.popular ? "1px solid rgba(240,224,64,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "20px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                    transition: "border 0.15s, background 0.15s",
                  }}
                >
                  {pkg.popular && !isSelected && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "var(--color-accent)", color: "#000", fontSize: 8, fontWeight: 900, padding: "2px 7px", borderRadius: 10 }}>POPULAR</div>
                  )}
                  {isSelected && (
                    <div style={{ position: "absolute", top: 10, right: 10, background: "var(--color-accent)", color: "#000", fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 10 }}>✓</div>
                  )}
                  <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{pkg.emoji}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{pkg.credits} créditos</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent)", lineHeight: 1 }}>{pkg.price}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 8 }}>{pkg.label}</div>
                </button>
              );
            })}
          </div>

          {/* Buy bar — appears when a pack is selected */}
          {selectedPack && (
            <button
              onClick={handleBuyCredits}
              disabled={buyingCredits}
              className="btn-y"
              style={{ width: "100%", fontSize: 14, fontWeight: 800, padding: "15px", opacity: buyingCredits ? 0.6 : 1, marginTop: 2 }}
            >
              {buyingCredits
                ? "Abriendo Stripe…"
                : `Comprar — ${CREDIT_PACKS[selectedPack].credits} créditos · ${CREDIT_PACKS[selectedPack].price}`}
            </button>
          )}

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
