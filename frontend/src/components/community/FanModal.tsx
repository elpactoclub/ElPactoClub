"use client";

import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

const FAN_DATA: Record<string, { city: string; level: string; xp: string; streak: number; badges: string[]; color: string }> = {
  BasketQueen:  { city: "Barcelona", level: "Leyenda", xp: "7,890", streak: 30, badges: ["🗳", "💬", "🔥", "👑", "🎟", "✉"], color: "#A78BFA" },
  MikelFan23:   { city: "Madrid",    level: "MVP",     xp: "5,240", streak: 14, badges: ["🗳", "💬", "🔥", "👑"],              color: "#60A5FA" },
  NachoBCN:     { city: "Barcelona", level: "MVP",     xp: "4,120", streak: 7,  badges: ["🗳", "💬", "🔥"],                    color: "#F59E0B" },
  Laura_BCN:    { city: "Valencia",  level: "Starter", xp: "3,890", streak: 5,  badges: ["🗳", "💬"],                          color: "#22C55E" },
  PactoForever: { city: "Sevilla",   level: "Starter", xp: "2,760", streak: 3,  badges: ["🗳"],                                color: "#EC4899" },
};

export default function FanModal() {
  const { isFanModalOpen, fanModalUser, closeFanModal, openDM, showToast } = useUIStore();
  const { isAuthenticated } = useUserStore();

  if (!isFanModalOpen || !fanModalUser) return null;

  const fan = FAN_DATA[fanModalUser] ?? { city: "Desconocida", level: "Rookie", xp: "0", streak: 0, badges: [], color: "#777" };

  const handleDM = () => {
    if (!isAuthenticated) { showToast("Inicia sesión para enviar mensajes"); return; }
    closeFanModal();
    openDM();
  };

  const levelColors: Record<string, string> = { Leyenda: "#FFD700", MVP: "#60A5FA", Starter: "#F59E0B", Rookie: "#777" };

  return (
    <div className="fixed inset-0 bg-[#000c] z-[310] flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && closeFanModal()}>
      <div className="bg-gray rounded-t-2xl w-full max-w-[480px] px-5 pb-10 animate-slide-up">
        <div className="w-9 h-1 bg-gray3 rounded-sm mx-auto mt-4 mb-5" />

        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-bold mb-2"
            style={{ background: fan.color + "22", border: `3px solid ${fan.color}`, color: fan.color }}
          >
            {fanModalUser[0]}
          </div>
          <div className="font-heading text-[22px] tracking-[1px]">{fanModalUser.toUpperCase()}</div>
          <div className="text-[11px] text-muted">📍 {fan.city}</div>
          <div className="mt-1 px-3 py-[3px] rounded-full text-[9px] font-extrabold" style={{ background: levelColors[fan.level] + "22", color: levelColors[fan.level], border: `1px solid ${levelColors[fan.level]}50` }}>
            {fan.level.toUpperCase()} · {fan.xp} XP
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray2 rounded-xl text-center py-3">
            <div className="font-heading text-[22px] text-accent">{fan.xp}</div>
            <div className="text-[9px] text-muted">XP Total</div>
          </div>
          <div className="bg-gray2 rounded-xl text-center py-3">
            <div className="font-heading text-[22px] text-green">🔥 {fan.streak}</div>
            <div className="text-[9px] text-muted">Días racha</div>
          </div>
          <div className="bg-gray2 rounded-xl text-center py-3">
            <div className="font-heading text-[22px] text-white">{fan.badges.length}</div>
            <div className="text-[9px] text-muted">Insignias</div>
          </div>
        </div>

        {/* Badges */}
        {fan.badges.length > 0 && (
          <div className="mb-4">
            <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2">Insignias</div>
            <div className="flex gap-2 flex-wrap">
              {fan.badges.map((b, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gray2 border border-border2 flex items-center justify-center text-[18px]">
                  {b}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleDM} className="flex-1 bg-gray2 border border-border text-white font-bold py-3 rounded-xl text-[12px] cursor-pointer hover:border-accent transition-colors">
            ✉ Enviar mensaje
          </button>
          <button onClick={() => { showToast(`${fanModalUser} añadido a favoritos ⭐`); closeFanModal(); }} className="flex-1 bg-accent text-black font-bold py-3 rounded-xl text-[12px] cursor-pointer">
            ⭐ Seguir fan
          </button>
        </div>

        <button onClick={closeFanModal} className="w-full mt-3 text-muted text-[11px] bg-transparent border-none cursor-pointer py-2">Cerrar</button>
      </div>
    </div>
  );
}
