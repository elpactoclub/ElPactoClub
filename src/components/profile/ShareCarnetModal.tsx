"use client";

import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

export default function ShareCarnetModal() {
  const { isShareCarnetOpen, closeShareCarnet, showToast } = useUIStore();
  const { name, level, credits, avatar } = useUserStore();

  if (!isShareCarnetOpen) return null;

  const handleShare = (platform: string) => {
    const text = `¡Soy socio oficial de El Pacto BC! Únete al club 🏀 ${level} · ${credits} créditos`;
    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + " #ElPactoBC")}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(text).then(() => showToast("¡Enlace copiado! 📋"));
    } else if (platform === "instagram") {
      showToast("Descarga la imagen y súbela a tu story 📸");
    } else if (platform === "download") {
      showToast("Guardando carnet como imagen... 💾");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#000c] z-[420] flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && closeShareCarnet()}
    >
      <div className="bg-gray rounded-t-2xl w-full max-w-[480px] px-5 pb-10 animate-slide-up">
        <div className="w-9 h-1 bg-gray3 rounded-sm mx-auto mt-4 mb-5" />

        <div className="text-center mb-5">
          <div className="text-[9px] font-bold tracking-[2px] text-muted mb-1">COMPARTIR</div>
          <div className="font-heading text-xl tracking-[1px]">CARNET DE SOCIO</div>
        </div>

        {/* Mini carnet preview */}
        <div className="bg-gradient-to-br from-[#1a1a10] to-[#252520] border border-[#F0E04035] rounded-[14px] p-4 mb-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-accent opacity-[0.06]" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white rounded-[3px] flex items-center justify-center font-heading text-[8px] text-black">EP</div>
              <span className="font-heading text-[11px] tracking-[3px]">EL PACTO</span>
            </div>
            <span className="text-[7px] font-bold tracking-[2px] text-accent bg-accent/10 px-2 py-[2px] rounded-[20px] border border-accent/30">SOCIO</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-accent bg-gray3 flex items-center justify-center text-lg">{avatar}</div>
            <div>
              <div className="font-heading text-[15px] tracking-[1px]">{name.toUpperCase()}</div>
              <span className="text-[8px] font-bold px-2 py-[2px] rounded-[20px] bg-accent text-black">{level.toUpperCase()}</span>
            </div>
            <div className="ml-auto text-right">
              <div className="font-heading text-[22px] text-accent leading-none">#0047</div>
              <div className="text-[8px] text-muted">Nº Socio</div>
            </div>
          </div>
        </div>

        {/* Share options */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { platform: "whatsapp", emoji: "💬", label: "WhatsApp", color: "#25D366" },
            { platform: "twitter", emoji: "𝕏", label: "Twitter / X", color: "#1DA1F2" },
            { platform: "copy", emoji: "🔗", label: "Copiar enlace", color: "#A78BFA" },
            { platform: "instagram", emoji: "📸", label: "Instagram Story", color: "#E1306C" },
          ].map((s) => (
            <button
              key={s.platform}
              onClick={() => handleShare(s.platform)}
              className="flex items-center gap-2 bg-gray2 border border-border2 rounded-xl px-3 py-3 cursor-pointer hover:border-accent transition-colors text-left"
            >
              <span className="text-[18px]">{s.emoji}</span>
              <span className="text-[11px] font-semibold">{s.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => handleShare("download")}
          className="w-full bg-accent text-black font-heading text-sm py-3 rounded-xl tracking-[1px]"
        >
          ⬇ DESCARGAR IMAGEN
        </button>

        <button onClick={closeShareCarnet} className="w-full mt-3 text-muted text-[11px] bg-transparent border-none cursor-pointer py-2">
          Cerrar
        </button>
      </div>
    </div>
  );
}
