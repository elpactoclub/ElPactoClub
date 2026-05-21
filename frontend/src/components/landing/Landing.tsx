"use client";

import { useUIStore } from "@/stores/uiStore";

export default function Landing() {
  const { closeLanding, openPayment } = useUIStore();

  const handleExplorar = () => {
    useUIStore.setState({ isOnboardingOpen: true, isLandingOpen: false });
  };

  const handleSocio = () => {
    openPayment();
  };

  return (
    <div className="h-full bg-black flex flex-col overflow-y-auto">
      {/* Top content */}
      <div className="px-[22px] pt-9 flex-1 flex flex-col justify-center">
        {/* Logo */}
        <div className="flex items-center gap-[9px] mb-7">
          <div className="w-[30px] h-[30px] bg-white rounded-[5px] flex items-center justify-center font-heading text-sm text-black">
            EP
          </div>
          <div className="font-heading text-lg tracking-[3px]">EL PACTO</div>
        </div>

        {/* Subtitle */}
        <div className="text-[10px] font-bold tracking-[2px] text-muted mb-[10px] uppercase">
          Club Nativo Digital
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl leading-[1.05] mb-3">
          VIENES POR
          <br />
          EL BASKET,
          <br />
          <span className="text-accent">
            TE QUEDAS
            <br />
            POR LO QUE
            <br />
            PASA.
          </span>
        </h1>

        {/* Description */}
        <p className="text-xs text-[#666] leading-relaxed mb-[22px]">
          Vota decisiones del club, habla con los jugadores, sube en el ranking
          de fans.
        </p>

        {/* Avatars */}
        <div className="flex items-center gap-1 mb-0">
          {["HE", "VI", "EL"].map((initials, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gray3 border-[2.5px] border-black flex items-center justify-center text-[10px] font-bold text-muted"
              style={{ marginLeft: i > 0 ? "-8px" : 0 }}
            >
              {initials}
            </div>
          ))}
          <span className="text-[10px] text-[#666] ml-[10px]">
            Elvis, Herson y Violeta te esperan
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex border-t border-b border-border">
        <div className="flex-1 py-3 px-[6px] text-center border-r border-border">
          <div className="font-heading text-[22px] text-accent">1,247</div>
          <div className="text-[8px] text-muted uppercase tracking-[0.5px]">
            Fans activos
          </div>
        </div>
        <div className="flex-1 py-3 px-[6px] text-center border-r border-border">
          <div className="font-heading text-[22px]">38</div>
          <div className="text-[8px] text-muted uppercase tracking-[0.5px]">
            Decisiones
          </div>
        </div>
        <div className="flex-1 py-3 px-[6px] text-center">
          <div className="font-heading text-[22px] text-green">5€</div>
          <div className="text-[8px] text-muted uppercase tracking-[0.5px]">
            Al mes
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-[22px] pt-[18px] pb-9 flex flex-col gap-[9px]">
        <button
          onClick={handleSocio}
          className="w-full bg-accent text-black border-none py-[11px] rounded-[9px] text-xs font-extrabold cursor-pointer font-sans"
        >
          Hacerme socio — 5€/mes
        </button>
        <button
          onClick={handleExplorar}
          className="w-full bg-transparent text-white border border-border2 py-[11px] rounded-[9px] text-[11px] font-semibold cursor-pointer font-sans"
        >
          Explorar gratis
        </button>
        <div className="text-center text-[10px] text-[#444]">
          Sin tarjeta de crédito · Cancela cuando quieras
        </div>
      </div>
    </div>
  );
}
