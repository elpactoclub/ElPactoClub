"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";

const steps = [
  {
    borderColor: "#22C55E",
    labelColor: "#22C55E",
    label: "Bienvenido al Pacto",
    title: (
      <>
        HOLA, SOY
        <br />
        HERSON
      </>
    ),
    description: (
      <>
        Llevo años jugando al basket y siempre quise una comunidad donde los
        fans de verdad tuvieran voz. Eso es El Pacto.
        <br />
        <br />
        Aquí <strong className="text-white">tú decides</strong> junto a
        nosotros.
      </>
    ),
    avatar: "HE",
  },
  {
    borderColor: "#F472B6",
    labelColor: "#F472B6",
    label: "Los créditos",
    title: (
      <>
        ¿PARA QUÉ
        <br />
        SIRVEN LOS
        <br />
        <span className="text-accent">CRÉDITOS?</span>
      </>
    ),
    features: [
      { icon: "🗳", title: "Votar decisiones", desc: "Cada voto cuesta créditos y da XP" },
      { icon: "🎟", title: "Entrar al sorteo", desc: "Más créditos = más entradas" },
      { icon: "✉️", title: "Mensajear creadores", desc: "Contacto directo con el equipo" },
    ],
    avatar: "VI",
  },
  {
    borderColor: "#A78BFA",
    labelColor: "#A78BFA",
    label: "Sube de nivel",
    title: (
      <>
        DE ROOKIE
        <br />A <span className="text-accent">LEYENDA</span>
      </>
    ),
    levels: [
      { icon: "🌱", name: "Rookie", xp: "0 XP", color: "#22C55E" },
      { icon: "⭐", name: "Starter", xp: "500 XP", color: "#F0E040" },
      { icon: "🏆", name: "MVP", xp: "2,000 XP", color: "#777" },
      { icon: "👑", name: "Leyenda", xp: "5,000 XP", color: "#777" },
    ],
    avatar: "EL",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const { finishOnboarding, skipOnboarding } = useUIStore();

  const current = steps[step];

  return (
    <div className="h-full bg-black flex flex-col overflow-y-auto">
      {/* Dots */}
      <div className="flex gap-[6px] justify-center pt-5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "w-5 bg-accent rounded-[4px]"
                : "w-2 bg-gray3"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent opacity-[0.06] pointer-events-none" />

        {/* Avatar */}
        <div
          className="w-[100px] h-[100px] rounded-full flex items-center justify-center text-5xl mb-5 border-[3px] bg-gray3"
          style={{ borderColor: current.borderColor }}
        >
          {current.avatar}
        </div>

        {/* Label */}
        <div
          className="text-[10px] font-bold tracking-[2px] mb-[10px] uppercase"
          style={{ color: current.labelColor }}
        >
          {current.label}
        </div>

        {/* Title */}
        <div className="font-heading text-[32px] tracking-[1px] leading-[1.1] mb-[14px]">
          {current.title}
        </div>

        {/* Step-specific content */}
        {current.description && (
          <div className="text-[13px] text-[#aaa] leading-[1.7]">
            {current.description}
          </div>
        )}

        {current.features && (
          <div className="w-full flex flex-col gap-[10px] text-left">
            {current.features.map((f, i) => (
              <div
                key={i}
                className="flex gap-[10px] items-center bg-gray2 rounded-[10px] px-3 py-[10px]"
              >
                <div className="text-xl">{f.icon}</div>
                <div>
                  <div className="text-xs font-bold mb-[1px]">{f.title}</div>
                  <div className="text-[11px] text-muted">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {current.levels && (
          <div className="w-full flex flex-col gap-2">
            {current.levels.map((l, i) => (
              <div
                key={i}
                className="flex items-center gap-[10px] px-3 py-2 rounded-lg"
                style={{
                  background:
                    i < 2
                      ? `${l.color}15`
                      : "var(--color-gray2)",
                  border:
                    i < 2
                      ? `1px solid ${l.color}30`
                      : "none",
                }}
              >
                <div className="text-base">{l.icon}</div>
                <div className="flex-1 text-[11px] font-semibold">{l.name}</div>
                <div
                  className="text-[9px]"
                  style={{ color: l.color }}
                >
                  {l.xp}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pt-4 pb-9 flex flex-col gap-[10px]">
        {step < 2 ? (
          <>
            <button
              onClick={() => setStep(step + 1)}
              className="w-full bg-accent text-black border-none py-[11px] rounded-[9px] text-xs font-extrabold cursor-pointer font-sans"
            >
              Siguiente →
            </button>
            {step === 0 ? (
              <button
                onClick={skipOnboarding}
                className="w-full bg-transparent text-white border border-border2 py-[11px] rounded-[9px] text-[11px] font-semibold cursor-pointer font-sans"
              >
                Saltar introducción
              </button>
            ) : (
              <button
                onClick={() => setStep(step - 1)}
                className="w-full bg-transparent text-white border border-border2 py-[11px] rounded-[9px] text-[11px] font-semibold cursor-pointer font-sans"
              >
                ← Atrás
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={finishOnboarding}
              className="w-full bg-accent text-black border-none py-[11px] rounded-[9px] text-xs font-extrabold cursor-pointer font-sans"
            >
              ¡Empezar ahora! 🏀
            </button>
            <button
              onClick={() => setStep(step - 1)}
              className="w-full bg-transparent text-white border border-border2 py-[11px] rounded-[9px] text-[11px] font-semibold cursor-pointer font-sans"
            >
              ← Atrás
            </button>
          </>
        )}
      </div>
    </div>
  );
}
