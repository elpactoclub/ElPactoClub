"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

const AVATAR_OPTIONS = [
  "🏀", "⚡", "🔥", "🏆", "👑", "💪", "🎯", "🎤",
  "🌟", "🦁", "🐺", "🐉", "⭐", "🎸", "🕶", "🤙",
  "🏅", "🎽", "🥊", "🎮", "🦅", "🐝", "🦊", "🎭",
];

const CITIES = ["Barcelona", "Madrid", "Valencia", "Sevilla", "Bilbao", "Málaga", "Zaragoza", "Murcia", "Palma", "Otra"];

export default function PersonalizeModal() {
  const { isPersonalizeOpen, closePersonalize, showToast } = useUIStore();
  const { name, avatar, city, setName, setAvatar, setCity } = useUserStore();

  const [localName, setLocalName] = useState(name);
  const [localAvatar, setLocalAvatar] = useState(avatar);
  const [localCity, setLocalCity] = useState(city);

  if (!isPersonalizeOpen) return null;

  const handleSave = () => {
    if (!localName.trim()) { showToast("Escribe tu nombre"); return; }
    setName(localName.trim());
    setAvatar(localAvatar);
    setCity(localCity);
    showToast("¡Perfil actualizado! ✅");
    closePersonalize();
  };

  return (
    <div
      className="fixed inset-0 bg-[#000c] z-[350] flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && closePersonalize()}
    >
      <div className="bg-gray rounded-t-2xl w-full max-w-[480px] px-5 pb-10 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="w-9 h-1 bg-gray3 rounded-sm mx-auto mt-4 mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="font-heading text-xl tracking-[1px]">PERSONALIZAR PERFIL</div>
          <button onClick={closePersonalize} className="bg-gray2 border-none text-muted w-7 h-7 rounded-full cursor-pointer text-sm flex items-center justify-center">✕</button>
        </div>

        {/* Avatar preview */}
        <div className="flex justify-center mb-4">
          <div className="w-[72px] h-[72px] rounded-full border-2 border-accent bg-gray2 flex items-center justify-center text-[32px]">
            {localAvatar}
          </div>
        </div>

        {/* Avatar picker */}
        <div className="mb-5">
          <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2">Elige tu avatar</div>
          <div className="grid grid-cols-8 gap-[6px]">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setLocalAvatar(emoji)}
                className={`w-full aspect-square rounded-lg text-xl flex items-center justify-center cursor-pointer transition-all ${localAvatar === emoji ? "bg-accent/20 border-2 border-accent scale-110" : "bg-gray2 border border-border2"}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2 block">Tu nombre</label>
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            maxLength={24}
            placeholder="Tu nombre en el club"
            className="w-full bg-gray2 border border-border2 rounded-lg px-3 py-[10px] text-[13px] font-sans text-white outline-none focus:border-accent"
          />
        </div>

        {/* City */}
        <div className="mb-6">
          <label className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2 block">Tu ciudad</label>
          <div className="flex flex-wrap gap-[6px]">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setLocalCity(c)}
                className={`px-3 py-[5px] rounded-[20px] text-[10px] font-semibold cursor-pointer ${localCity === c ? "bg-accent text-black" : "bg-gray2 text-muted border border-border2"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-accent text-black font-heading text-sm py-3 rounded-xl tracking-[1px]"
        >
          GUARDAR CAMBIOS →
        </button>
      </div>
    </div>
  );
}
