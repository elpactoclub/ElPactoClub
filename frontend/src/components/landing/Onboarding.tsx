"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";

const steps = [
  {
    borderColor: "#22C55E",
    labelColor: "#22C55E",
    label: "Bienvenido al Pacto",
    title: <>HOLA, SOY<br />HERSON</>,
    description: (
      <>
        Llevo años jugando al basket y siempre quise una comunidad donde los
        fans de verdad tuvieran voz. Eso es El Pacto.
        <br /><br />
        Aquí <strong style={{ color: "#fff" }}>tú decides</strong> junto a nosotros.
      </>
    ),
    avatarImg: "/imagenes/herson.jpg",
    bgImg: "/imagenes/herson2.jpg",
  },
  {
    borderColor: "#F472B6",
    labelColor: "#F472B6",
    label: "Los créditos",
    title: <>¿PARA QUÉ<br />SIRVEN LOS<br /><span style={{ color: "var(--color-accent)" }}>CRÉDITOS?</span></>,
    features: [
      { icon: "🗳️", title: "Votar decisiones", desc: "Cada voto cuesta créditos y da XP" },
      { icon: "🎟️", title: "Entrar al sorteo", desc: "Más créditos = más entradas" },
      { icon: "✉️", title: "Mensajear creadores", desc: "Contacto directo con el equipo" },
    ],
    avatarImg: "/imagenes/violeta.jpg",
    bgImg: "/imagenes/violeta.jpg",
  },
  {
    borderColor: "#A78BFA",
    labelColor: "#A78BFA",
    label: "Sube de nivel",
    title: <>DE ROOKIE<br />A <span style={{ color: "var(--color-accent)" }}>LEYENDA</span></>,
    levels: [
      { icon: "🌱", name: "Rookie",  xp: "0 XP",     color: "#22C55E" },
      { icon: "⭐", name: "Starter", xp: "500 XP",   color: "#F0E040" },
      { icon: "🏆", name: "MVP",     xp: "2,000 XP", color: "#aaa" },
      { icon: "👑", name: "Leyenda", xp: "5,000 XP", color: "#aaa" },
    ],
    avatarImg: "/imagenes/imanol.png",
    bgImg: "/imagenes/imanol.png",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const { finishOnboarding, skipOnboarding } = useUIStore();
  const current = steps[step];

  const Dots = () => (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {steps.map((_, i) => (
        <div
          key={i}
          style={{
            height: 8,
            width: i === step ? 20 : 8,
            borderRadius: 4,
            background: i === step ? "var(--color-accent)" : "var(--color-gray3)",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );

  const StepContent = () => (
    <div key={step} className="animate-step-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
      {/* Avatar */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${current.borderColor}`,
          boxShadow: `0 0 24px ${current.borderColor}40`,
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.avatarImg} alt="" fetchPriority={step === 0 ? "high" : "auto"} loading={step === 0 ? "eager" : "lazy"} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
      </div>

      {/* Label */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: current.labelColor }}>
        {current.label}
      </div>

      {/* Title */}
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, lineHeight: 1.1, letterSpacing: 1 }}>
        {current.title}
      </div>

      {/* Description / Features / Levels */}
      {current.description && (
        <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, maxWidth: 340 }}>
          {current.description}
        </p>
      )}

      {current.features && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 380 }}>
          {current.features.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--color-gray2)",
                borderRadius: 10,
                padding: "10px 14px",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 20 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {current.levels && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 380 }}>
          {current.levels.map((l, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: i < 2 ? `${l.color}12` : "var(--color-gray2)",
                border: i < 2 ? `1px solid ${l.color}30` : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ fontSize: 18 }}>{l.icon}</div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{l.name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: l.color }}>{l.xp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const Buttons = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {step < steps.length - 1 ? (
        <>
          <button onClick={() => setStep(step + 1)} className="btn-y" style={{ fontSize: 13, fontWeight: 800, padding: "13px" }}>
            Siguiente →
          </button>
          {step === 0 ? (
            <button onClick={skipOnboarding} className="btn-o" style={{ fontSize: 12 }}>
              Saltar introducción
            </button>
          ) : (
            <button onClick={() => setStep(step - 1)} className="btn-o" style={{ fontSize: 12 }}>
              ← Atrás
            </button>
          )}
        </>
      ) : (
        <>
          <button onClick={finishOnboarding} className="btn-y" style={{ fontSize: 13, fontWeight: 800, padding: "13px" }}>
            ¡Empezar ahora! 🏀
          </button>
          <button onClick={() => setStep(step - 1)} className="btn-o" style={{ fontSize: 12 }}>
            ← Atrás
          </button>
        </>
      )}
    </div>
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#0A0A0A",
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 15% 15%, ${current.borderColor}08 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 85% 85%, rgba(240,224,64,0.04) 0%, transparent 60%)
        `,
      }}
    >

      {/* ── DESKTOP ≥ 640px ─────────────────────────────── */}
      <div
        className="hidden sm:flex flex-1"
        style={{ width: "100%", alignItems: "stretch" }}
      >
        {/* Left — imagen de fondo con overlay, ocupa 45% */}
        <div
          style={{
            flex: "0 0 45%",
            position: "relative",
            overflow: "hidden",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={step}
            src={current.bgImg}
            alt=""
            fetchPriority={step === 0 ? "high" : "auto"}
            loading={step === 0 ? "eager" : "lazy"}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
              opacity: 0.6,
              animation: "fadeIn 0.4s ease both",
            }}
          />
          {/* Gradiente lateral para fundir con el contenido */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, transparent 30%, transparent 70%, rgba(10,10,10,0.5) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, transparent 60%, #0A0A0A 100%)` }} />
          {/* Big text watermark */}
          <div
            style={{
              position: "absolute", bottom: 24, left: 20, right: 20,
              fontFamily: "var(--font-heading)", fontSize: 64, lineHeight: 1,
              color: "#fff", opacity: 0.06, letterSpacing: 2,
              userSelect: "none",
            }}
          >
            EL<br />PACTO
          </div>
        </div>

        {/* Right — content */}
        <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 60px 44px 56px" }}>
          <Dots />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StepContent />
          </div>
          <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
            <Buttons />
          </div>
        </div>
      </div>

      {/* ── MOBILE < 640px ───────────────────────────────── */}
      <div
        className="flex sm:hidden flex-col flex-1"
        style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}
      >
        {/* Dots */}
        <div style={{ paddingTop: 20, paddingBottom: 8 }}>
          <Dots />
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 24px" }}>
          <StepContent />
        </div>

        {/* Buttons */}
        <div style={{ padding: "16px 24px 36px" }}>
          <Buttons />
        </div>
      </div>

    </div>
  );
}
