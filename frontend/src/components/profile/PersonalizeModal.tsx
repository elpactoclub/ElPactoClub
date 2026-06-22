"use client";

import { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";
import { CITIES_BY_COUNTRY, COUNTRIES } from "@/data/locations";

const AVATAR_OPTIONS = [
  "🏀", "⚡", "🔥", "🏆", "👑", "💪", "🎯", "🎤",
  "🌟", "🦁", "🐺", "🐉", "⭐", "🎸", "🕶", "🤙",
  "🏅", "🎽", "🥊", "🎮", "🦅", "🐝", "🦊", "🎭",
];

function resizeImageToBase64(file: File, maxPx = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function PersonalizeModal() {
  const { isPersonalizeOpen, closePersonalize, showToast } = useUIStore();
  const { name, avatar, city, country, email, setName, setAvatar, setCity, setCountry, fetchProfile, isAuthenticated } = useUserStore();

  const [localName, setLocalName] = useState(name);
  const [localAvatar, setLocalAvatar] = useState(avatar);
  const [localCountry, setLocalCountry] = useState(country || "España");
  const [localCity, setLocalCity] = useState(city);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Cuenta: email + contraseña ──
  const [localEmail, setLocalEmail] = useState(email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  // ── Crop / reposition ──
  const FRAME = 240;
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropDims, setCropDims] = useState({ nw: 1, nh: 1 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const cover = Math.max(FRAME / cropDims.nw, FRAME / cropDims.nh);
  const dispW = cropDims.nw * cover * zoom;
  const dispH = cropDims.nh * cover * zoom;
  const clampOffset = (x: number, y: number) => ({
    x: Math.min(0, Math.max(FRAME - dispW, x)),
    y: Math.min(0, Math.max(FRAME - dispH, y)),
  });

  useEffect(() => {
    if (isPersonalizeOpen) {
      setLocalName(name === "Tu Nombre" ? "" : name);
      setLocalAvatar(avatar);
      setLocalCountry(country || "España");
      setLocalCity(city);
      setLocalEmail(email ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setCropSrc(null);
    }
  }, [isPersonalizeOpen]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToBase64(file, 700);
      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth, nh = img.naturalHeight;
        const c = Math.max(FRAME / nw, FRAME / nh);
        setCropDims({ nw, nh });
        setZoom(1);
        setOffset({ x: (FRAME - nw * c) / 2, y: (FRAME - nh * c) / 2 });
        setCropSrc(dataUrl);
      };
      img.src = dataUrl;
    } catch { showToast("Error al procesar la imagen"); }
    e.target.value = "";
  };

  const onZoomChange = (z: number) => {
    const w = cropDims.nw * cover * z, h = cropDims.nh * cover * z;
    setZoom(z);
    setOffset({ x: (FRAME - w) / 2, y: (FRAME - h) / 2 });
  };

  const onCropPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onCropPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { sx, sy, ox, oy } = dragRef.current;
    setOffset(clampOffset(ox + (e.clientX - sx), oy + (e.clientY - sy)));
  };
  const onCropPointerUp = () => { dragRef.current = null; };

  const confirmCrop = () => {
    if (!cropSrc) return;
    const O = 320;
    const ratio = O / FRAME;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = O; canvas.height = O;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, O, O);
      ctx.drawImage(img, offset.x * ratio, offset.y * ratio, dispW * ratio, dispH * ratio);
      setLocalAvatar(canvas.toDataURL("image/jpeg", 0.82));
      setCropSrc(null);
    };
    img.src = cropSrc;
  };

  if (!isPersonalizeOpen || !isAuthenticated) return null;

  const handleCountryChange = (c: string) => {
    setLocalCountry(c);
    setLocalCity(CITIES_BY_COUNTRY[c]?.[0] ?? "Otra");
  };

  const handleSave = async () => {
    if (!localName.trim()) { showToast("Escribe tu nombre"); return; }
    setSaving(true);
    try {
      if (isAuthenticated) {
        await api.patch("/users/me", {
          name: localName.trim(),
          avatar: localAvatar,
          city: localCity || undefined,
          country: localCountry || undefined,
        });
      }
      setName(localName.trim());
      setAvatar(localAvatar);
      setCity(localCity);
      setCountry(localCountry);
      showToast("¡Perfil actualizado! ✅");
      closePersonalize();
    } catch {
      showToast("Error al guardar, inténtalo de nuevo");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async () => {
    const emailChanged = localEmail.trim() && localEmail.trim().toLowerCase() !== (email ?? "").toLowerCase();
    const wantsPassword = !!newPassword;
    if (!emailChanged && !wantsPassword) { showToast("No hay cambios en tu cuenta"); return; }
    if (wantsPassword && newPassword.length < 8) { showToast("La nueva contraseña debe tener al menos 8 caracteres"); return; }
    if (wantsPassword && !currentPassword) { showToast("Introduce tu contraseña actual"); return; }
    setSavingAccount(true);
    try {
      const payload: { email?: string; currentPassword?: string; newPassword?: string } = {};
      if (emailChanged) payload.email = localEmail.trim();
      if (wantsPassword) { payload.currentPassword = currentPassword; payload.newPassword = newPassword; }
      await api.patch("/users/me/credentials", payload);
      await fetchProfile();
      setCurrentPassword("");
      setNewPassword("");
      showToast("Cuenta actualizada ✅");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "No se pudo actualizar la cuenta ❌");
    } finally {
      setSavingAccount(false);
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

      {/* Avatar preview / crop editor */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
      {cropSrc ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 12, padding: "0 20px" }}>
          <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Arrastra para acomodar · usa el zoom</div>
          <div
            onPointerDown={onCropPointerDown}
            onPointerMove={onCropPointerMove}
            onPointerUp={onCropPointerUp}
            onPointerCancel={onCropPointerUp}
            style={{ width: FRAME, height: FRAME, maxWidth: "100%", borderRadius: "50%", overflow: "hidden", position: "relative", border: "2px solid var(--color-accent)", background: "#1a1a1a", cursor: "grab", touchAction: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cropSrc} alt="" draggable={false} style={{ position: "absolute", left: offset.x, top: offset.y, width: dispW, height: dispH, maxWidth: "none", pointerEvents: "none", userSelect: "none" }} />
          </div>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => onZoomChange(Number(e.target.value))} style={{ width: FRAME, maxWidth: "100%", accentColor: "var(--color-accent)" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setCropSrc(null)} style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted)", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-body)" }}>Cancelar</button>
            <button onClick={confirmCrop} className="btn-y" style={{ fontSize: 12, fontWeight: 800, padding: "8px 18px" }}>Usar foto ✓</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 10 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid var(--color-accent)", background: "var(--color-gray2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, overflow: "hidden", flexShrink: 0 }}>
            {localAvatar?.startsWith("data:") || localAvatar?.startsWith("http")
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={localAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
              : localAvatar}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            {(localAvatar?.startsWith("data:") || localAvatar?.startsWith("http")) ? "📷 Cambiar / acomodar foto" : "📷 Subir foto"}
          </button>
          {(localAvatar?.startsWith("data:") || localAvatar?.startsWith("http")) && (
            <button
              onClick={() => setLocalAvatar("🏀")}
              style={{ fontSize: 10, fontWeight: 600, color: "var(--color-muted)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Quitar foto
            </button>
          )}
        </div>
      )}

      {/* Avatar picker */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10 }}>
          O ELIGE UN EMOJI
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

      {/* Country */}
      <div style={{ padding: "0 20px 16px" }}>
        <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: 8 }}>
          TU PAÍS
        </label>
        <select
          value={localCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          style={{ width: "100%", background: "var(--color-gray2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)", cursor: "pointer" }}
        >
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* City */}
      <div style={{ padding: "0 20px 24px" }}>
        <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: 8 }}>
          TU PROVINCIA / REGIÓN
        </label>
        <select
          value={localCity}
          onChange={(e) => setLocalCity(e.target.value)}
          style={{ width: "100%", background: "var(--color-gray2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)", cursor: "pointer" }}
        >
          {(CITIES_BY_COUNTRY[localCountry] ?? ["Otra"]).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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

      {/* ── Cuenta: email + contraseña ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "22px 0 0", padding: "20px 20px 4px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, letterSpacing: 1, marginBottom: 4 }}>CUENTA</div>
        <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 16 }}>Cambia tu correo o contraseña de acceso.</div>

        <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: 8 }}>CORREO</label>
        <input
          type="email"
          value={localEmail}
          onChange={(e) => setLocalEmail(e.target.value)}
          autoComplete="email"
          placeholder="tu@email.com"
          style={{ width: "100%", background: "var(--color-gray2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)", marginBottom: 14 }}
        />

        <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: 8 }}>CONTRASEÑA ACTUAL</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Solo si cambias la contraseña"
          style={{ width: "100%", background: "var(--color-gray2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)", marginBottom: 14 }}
        />

        <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", display: "block", marginBottom: 8 }}>NUEVA CONTRASEÑA</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres (déjalo vacío para no cambiar)"
          style={{ width: "100%", background: "var(--color-gray2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)", marginBottom: 16 }}
        />

        <button
          onClick={handleSaveAccount}
          disabled={savingAccount}
          style={{ width: "100%", fontSize: 13, fontWeight: 800, padding: "13px", borderRadius: 10, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", background: "var(--color-gray2)", color: "#fff", fontFamily: "var(--font-body)", opacity: savingAccount ? 0.6 : 1 }}
        >
          {savingAccount ? "Actualizando…" : "Actualizar cuenta"}
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
