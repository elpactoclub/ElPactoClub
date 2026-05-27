"use client";

import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

export default function CarnetModal() {
  const { isCarnetOpen, closeCarnet, openShareCarnet, showToast } = useUIStore();
  const { name, avatar, credits, level, city } = useUserStore();

  if (!isCarnetOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[400] flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && closeCarnet()}
    >
      <div className="bg-gray rounded-t-2xl w-full max-w-[480px] px-4 pb-8 animate-slide-up">
        {/* Handle */}
        <div className="w-9 h-1 bg-gray3 rounded-sm mx-auto mt-[14px] mb-[16px]" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="font-heading text-lg tracking-[1px]">Carnet de Socio</div>
          <button
            onClick={closeCarnet}
            className="bg-gray2 border-none text-muted w-7 h-7 rounded-full cursor-pointer text-sm flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* FRONT */}
        <div className="bg-gradient-to-br from-[#1a1a10] to-[#252520] border border-[#F0E04035] rounded-[14px] p-[16px] mb-3 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-accent opacity-[0.06] pointer-events-none" />

          {/* Card Header */}
          <div className="flex justify-between items-center mb-[15px] relative z-[1]">
            <div className="flex items-center gap-[7px]">
              <div className="w-4 h-4 bg-white rounded-[3px] flex items-center justify-center font-heading text-[8px] text-black">EP</div>
              <span className="font-heading text-[13px] tracking-[3px]">EL PACTO</span>
            </div>
            <span className="text-[7px] font-bold tracking-[2px] text-accent bg-[#F0E04020] px-2 py-[2px] rounded-[20px] border border-[#F0E04040]">
              SOCIO OFICIAL
            </span>
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-3 mb-[15px] relative z-[1]">
            <div className="w-[50px] h-[50px] rounded-full border-2 border-accent bg-gray3 flex items-center justify-center text-[22px] flex-shrink-0">
              {avatar}
            </div>
            <div>
              <div className="font-heading text-[19px] tracking-[1px] mb-1">
                {name.toUpperCase()}
              </div>
              <span className="text-[8px] font-bold px-[9px] py-[3px] rounded-[20px] bg-accent text-black">
                {level.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="flex justify-between items-end relative z-[1]">
            <div>
              <div className="text-[8px] text-[#777] uppercase tracking-[1px] mb-[2px]">Nº Socio</div>
              <div className="font-heading text-[26px] tracking-[3px] text-accent leading-none">#0047</div>
            </div>
            <div className="w-7 h-5 rounded-[3px] bg-gradient-to-br from-accent to-[#c8bc00] opacity-80" />
            <div className="text-right">
              <div className="text-[8px] text-[#777] uppercase tracking-[1px] mb-[2px]">Desde</div>
              <div className="text-[11px] font-semibold">ENE 2025</div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="bg-white rounded-[14px] p-[14px] mb-4">
          <div className="font-heading text-[11px] tracking-[2px] text-black mb-[9px]">EL PACTO · DATOS DEL SOCIO</div>
          <div className="grid grid-cols-2 gap-[7px]">
            {[
              { label: "Nº Socio", value: "#0047" },
              { label: "Nivel", value: level.toUpperCase() },
              { label: "Créditos", value: `${credits} ⚡` },
              { label: "Válido hasta", value: "DIC 2025" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[8px] text-[#666] uppercase font-bold">{item.label}</div>
                <div className="text-[12px] font-bold text-black">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => { closeCarnet(); setTimeout(() => openShareCarnet(), 200); }}
            className="flex-1 bg-accent text-black border-none py-[11px] rounded-[9px] text-[11px] font-extrabold cursor-pointer font-sans"
          >
            📤 Compartir
          </button>
          <button
            onClick={() => showToast("Guardando imagen... 💾")}
            className="flex-1 bg-gray2 text-white border border-border2 py-[11px] rounded-[9px] text-[11px] font-bold cursor-pointer font-sans"
          >
            ⬇ Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
