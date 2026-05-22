"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

export default function PaymentModal() {
  const { isPaymentOpen, closePayment, showToast } = useUIStore();
  const { isAuthenticated } = useUserStore();
  const [loading, setLoading] = useState(false);

  if (!isPaymentOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/store/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error();
      }
    } catch {
      showToast("Error al conectar con el servidor de pago");
      setLoading(false);
    }
  };

  const benefits = [
    "200 créditos mensuales",
    "Acceso a charlas exclusivas",
    "Participación en sorteos",
    "Voto en todas las decisiones del club",
    "Carnet digital de socio",
    "5% dto Basketball Emotion",
    "10% dto Hoops",
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[350]"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={closePayment}
      />

      {/* Mobile: slide-up sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[351] animate-slide-up">
        <div
          style={{
            background: "var(--color-gray)",
            borderRadius: "20px 20px 0 0",
            padding: "0 20px 40px",
          }}
        >
          <div style={{ width: 36, height: 4, background: "var(--color-gray3)", borderRadius: 2, margin: "14px auto 20px" }} />
          <ModalContent
            benefits={benefits}
            loading={loading}
            isAuthenticated={isAuthenticated}
            onCheckout={handleCheckout}
            onClose={closePayment}
          />
        </div>
      </div>

      {/* Desktop: centered dialog */}
      <div className="hidden sm:flex fixed inset-0 z-[351] items-center justify-center p-6">
        <div
          className="animate-fade-in"
          style={{
            background: "var(--color-gray)",
            borderRadius: 20,
            padding: "36px 40px 40px",
            width: "100%",
            maxWidth: 480,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          <ModalContent
            benefits={benefits}
            loading={loading}
            isAuthenticated={isAuthenticated}
            onCheckout={handleCheckout}
            onClose={closePayment}
            desktop
          />
        </div>
      </div>
    </>
  );
}

function ModalContent({
  benefits,
  loading,
  isAuthenticated,
  onCheckout,
  onClose,
  desktop = false,
}: {
  benefits: string[];
  loading: boolean;
  isAuthenticated: boolean;
  onCheckout: () => void;
  onClose: () => void;
  desktop?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        {desktop && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16, right: 16,
              background: "none",
              border: "none",
              color: "var(--color-muted)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        )}
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4 }}>
          HAZTE SOCIO
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, letterSpacing: 1 }}>
          SOCIO EL PACTO
        </div>
        <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>
          Acceso completo · Sin permanencia
        </div>
      </div>

      {/* Plan card */}
      <div
        style={{
          background: "var(--color-gray2)",
          border: "1px solid rgba(240,224,64,0.25)",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 12,
        }}
      >
        {/* Price row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Plan Socio</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-accent)", lineHeight: 1 }}>
              5€
            </span>
            <span style={{ fontSize: 10, color: "var(--color-muted)" }}>/mes</span>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {benefits.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#ccc" }}>
              <span style={{ color: "var(--color-green)", fontSize: 10, flexShrink: 0 }}>✓</span>
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div
        style={{
          background: "var(--color-gray3)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 10,
          color: "var(--color-muted)",
          textAlign: "center",
        }}
      >
        🔒 Pago seguro con Stripe · Cancela cuando quieras
      </div>

      {/* CTA */}
      <button
        onClick={onCheckout}
        disabled={loading}
        className="btn-y"
        style={{ fontSize: 13, fontWeight: 800, padding: "14px", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Redirigiendo a Stripe…" : "PAGAR CON STRIPE — 5€/mes"}
      </button>
      <button
        onClick={onClose}
        style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--color-muted)", padding: "8px" }}
      >
        Cancelar
      </button>

      {!isAuthenticated && (
        <p style={{ textAlign: "center", fontSize: 10, color: "#444", margin: "6px 0 0" }}>
          Inicia sesión para vincular la suscripción a tu cuenta
        </p>
      )}
    </div>
  );
}
