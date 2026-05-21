"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

type Step = "plan" | "card" | "processing" | "welcome";

export default function PaymentModal() {
  const { isPaymentOpen, closePayment, showToast } = useUIStore();
  const { addCredits, becomeSocio, becomeSocioApi, isAuthenticated, name } = useUserStore();
  const [step, setStep] = useState<Step>("plan");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  if (!isPaymentOpen) return null;

  const handleClose = () => {
    setStep("plan");
    setCardNum("");
    setExpiry("");
    setCvv("");
    closePayment();
  };

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const handlePay = () => {
    if (cardNum.replace(/\s/g, "").length < 16 || expiry.length < 5 || cvv.length < 3) {
      showToast("Completa los datos de la tarjeta");
      return;
    }
    setStep("processing");
    setTimeout(async () => {
      if (isAuthenticated) {
        await becomeSocioApi();
      } else {
        addCredits(200);
        becomeSocio();
      }
      setStep("welcome");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#000e] z-[350] flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="bg-gray rounded-t-2xl w-full max-w-[480px] px-5 pb-10 animate-slide-up">
        <div className="w-9 h-1 bg-gray3 rounded-sm mx-auto mt-4 mb-5" />

        {/* STEP: PLAN */}
        {step === "plan" && (
          <>
            <div className="text-center mb-5">
              <div className="text-[9px] font-bold tracking-[2px] text-muted mb-1">HAZTE SOCIO</div>
              <div className="font-heading text-[28px] tracking-[1px]">SOCIO EL PACTO</div>
              <div className="text-[11px] text-muted">Acceso completo · Sin permanencia</div>
            </div>

            <div className="bg-gray2 border border-accent/30 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-bold">Plan Socio</div>
                <div className="text-right">
                  <div className="font-heading text-[26px] text-accent leading-none">5€</div>
                  <div className="text-[9px] text-muted">/mes</div>
                </div>
              </div>
              {[
                "✅ 200 créditos mensuales",
                "✅ Acceso a charlas exclusivas",
                "✅ Participación en sorteos",
                "✅ Voto en todas las decisiones del club",
                "✅ Carnet digital de socio",
                "✅ 5% dto Basketball Emotion",
                "✅ 10% dto Hoops",
              ].map((b) => (
                <div key={b} className="text-[11px] text-[#ccc] mb-1">{b}</div>
              ))}
            </div>

            <div className="bg-gray3 rounded-xl p-3 mb-4 text-[10px] text-muted text-center">
              🔒 Pago seguro con Stripe · Cancela cuando quieras
            </div>

            <button onClick={() => setStep("card")} className="w-full bg-accent text-black font-heading text-sm py-3 rounded-xl tracking-[1px]">
              CONTINUAR → DATOS DE PAGO
            </button>
            <button onClick={handleClose} className="w-full mt-2 text-muted text-[11px] font-sans bg-transparent border-none cursor-pointer py-2">Cancelar</button>
          </>
        )}

        {/* STEP: CARD */}
        {step === "card" && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep("plan")} className="text-muted bg-transparent border-none cursor-pointer text-sm">‹</button>
              <div className="font-heading text-[20px] tracking-[1px]">DATOS DE PAGO</div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a10] to-[#252515] border border-accent/30 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-[9px] font-bold tracking-[2px] text-accent">EL PACTO · SOCIO</div>
                <div className="font-heading text-[17px] text-accent">5€/mes</div>
              </div>
              <div className="font-heading text-[18px] tracking-[3px] text-white/70">
                {cardNum || "•••• •••• •••• ••••"}
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Número de tarjeta</label>
                <input
                  value={cardNum}
                  onChange={(e) => setCardNum(formatCard(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  className="w-full bg-gray2 border border-border2 rounded-lg px-3 py-[10px] text-[13px] font-sans text-white outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">Caducidad</label>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/AA"
                    className="w-full bg-gray2 border border-border2 rounded-lg px-3 py-[10px] text-[13px] font-sans text-white outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 block">CVV</label>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    className="w-full bg-gray2 border border-border2 rounded-lg px-3 py-[10px] text-[13px] font-sans text-white outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <button onClick={handlePay} className="w-full bg-accent text-black font-heading text-sm py-3 rounded-xl tracking-[1px]">
              🔒 PAGAR 5€/MES
            </button>
            <div className="text-center text-[9px] text-muted mt-2">Stripe · Encriptación SSL · Sin permanencia</div>
          </>
        )}

        {/* STEP: PROCESSING */}
        {step === "processing" && (
          <div className="text-center py-10">
            <div className="text-[40px] mb-4 animate-pulse">⚡</div>
            <div className="font-heading text-[22px] tracking-[1px] mb-2">PROCESANDO PAGO</div>
            <div className="text-[11px] text-muted">Conectando con Stripe...</div>
            <div className="flex justify-center gap-1 mt-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* STEP: WELCOME */}
        {step === "welcome" && (
          <div className="text-center py-6">
            <div className="text-[50px] mb-3">🏀</div>
            <div className="font-heading text-[26px] tracking-[1px] mb-1">¡BIENVENIDO AL PACTO!</div>
            <div className="text-[13px] text-accent font-bold mb-1">{name || "Fan"} · Socio Oficial</div>
            <div className="text-[11px] text-muted mb-5">Ya eres parte del club. 200 créditos añadidos a tu cuenta.</div>

            <div className="bg-gray2 border border-accent/30 rounded-xl p-4 mb-5">
              <div className="text-[9px] font-bold text-accent tracking-[2px] mb-2">TUS BENEFICIOS ACTIVOS</div>
              {["✅ 200 créditos añadidos", "✅ Acceso a charlas desbloqueado", "✅ Participación en sorteos", "✅ Voto en decisiones oficiales"].map((b) => (
                <div key={b} className="text-[11px] text-[#ccc] mb-1">{b}</div>
              ))}
            </div>

            <button onClick={handleClose} className="w-full bg-accent text-black font-heading text-sm py-3 rounded-xl tracking-[1px]">
              ¡EMPEZAR A DISFRUTAR! →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
