"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

const AVATAR_OPTIONS = [
  "🏀", "⚡", "🔥", "🏆", "👑", "💪", "🎯", "🎤",
  "🌟", "🦁", "🐺", "🐉", "⭐", "🎸", "🕶", "🤙",
  "🏅", "🎽", "🥊", "🎮", "🦅", "🐝", "🦊", "🎭",
];

const CITIES = ["Barcelona", "Madrid", "Valencia", "Sevilla", "Bilbao", "Málaga", "Zaragoza", "Murcia", "Palma", "Otra"];

export default function PersonalizeModal() {
  const { isPersonalizeOpen, closePersonalize, showToast } = useUIStore();
  const { name, avatar, city, setName, setAvatar, setCity, isAuthenticated } = useUserStore();

  const [localName, setLocalName] = useState(name);
  const [localAvatar, setLocalAvatar] = useState(avatar);
  const [localCity, setLocalCity] = useState(city);
  const [saving, setSaving] = useState(false);

  if (!isPersonalizeOpen) return null;

  const handleSave = async () => {
    if (!localName.trim()) { showToast("Escribe tu nombre"); return; }
    setSaving(true);
    try {
      if (isAuthenticated) {
        await api.patch("/users/me", {
          name: localName.trim(),
          avatar: localAvatar,
          city: localCity || undefined,
        });
      }
      setName(localName.trim());
      setAvatar(localAvatar);
      setCity(localCity);
      showToast("¡Perfil actualizado! ✅");
      closePersonalize();
    } catch {
      showToast("Error al guardar, inténtalo de nuevo");
    } finally {
      setSaving(false);
    }
  };

  const inner = (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
      {/* Handle — mobile only */}
      <div className="sm:hidden" style={{ width: 36, height: 4, background: "var(--color-gray3)", borderRadius: 2, margin: "14px auto 18px" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 18px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 1 }}>PERSONALIZAR PERFIL</div>
        <button
          onClick={closePersonalize}
          style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-gray2)", border: "none", color: "var(--color-muted)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
        >✕</button>
      </div>

      {/* Avatar preview */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid var(--color-accent)", background: "var(--color-gray2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
          {localAvatar}
        </div>
      </div>

      {/* Avatar picker */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10 }}>
          ELIGE TU AVATAR
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setLocalAvatar(emoji)}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.15s, background 0.15s",
                background: localAvatar === emoji ? "rgba(240,224,64,0.18)" : "var(--color-gray2)",
                border: localAvatar === emoji ? "2px solid var(--color-accent)" : "1px solid rgba(255,255,255,0.08)",
                transform: localAvatar === emoji ? "scale(1.12)" : "scale(1)",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div style={{ padding: "0 20px 16px" }}>
        <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: 8 }}>
          TU NOMBRE
        </label>
        <input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          maxLength={24}
          placeholder="Tu nombre en el club"
          style={{ width: "100%", background: "var(--color-gray2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>

      {/* City */}
      <div style={{ padding: "0 20px 24px" }}>
        <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: 8 }}>
          TU CIUDAD
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => setLocalCity(c)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: localCity === c ? "var(--color-accent)" : "var(--color-gray2)",
                color: localCity === c ? "#000" : "var(--color-muted)",
                border: localCity === c ? "none" : "1px solid rgba(255,255,255,0.08)",
                transition: "background 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div style={{ padding: "0 20px 4px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-y"
          style={{ width: "100%", fontSize: 13, fontWeight: 800, padding: "13px", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Guardando…" : "GUARDAR CAMBIOS →"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 350, backdropFilter: "blur(2px)" }}
        onClick={closePersonalize}
      />

      {/* Mobile: bottom sheet */}
      <div
        className="sm:hidden animate-slide-up"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 351, background: "var(--color-gray)", borderRadius: "16px 16px 0 0", maxHeight: "90vh", overflowY: "auto", paddingBottom: 36 }}
      >
        {inner}
      </div>

      {/* Desktop: centered dialog */}
      <div
        className="hidden sm:block animate-dialog-in"
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 351, background: "var(--color-gray)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", paddingBottom: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {inner}
      </div>
    </>
  );
}
