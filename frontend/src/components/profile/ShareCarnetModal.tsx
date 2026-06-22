"use client";

import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

export default function ShareCarnetModal() {
  const { isShareCarnetOpen, closeShareCarnet, showToast } = useUIStore();
  const { name, level, credits, avatar, socioNumber } = useUserStore();

  if (!isShareCarnetOpen) return null;

  const handleShare = (platform: string) => {
    const text = `¡Soy socio oficial de El Pacto BC! Únete al club 🏀 ${level} · ${credits} créditos`;
    if (platform === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    else if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + " #ElPactoBC")}`, "_blank");
    else if (platform === "copy") navigator.clipboard.writeText(text).then(() => showToast("¡Enlace copiado! 📋"));
    else if (platform === "instagram") showToast("Descarga la imagen y súbela a tu story 📸");
    else if (platform === "download") showToast("Guardando carnet como imagen... 💾");
  };

  const miniCard = (
    <div style={{ background: "linear-gradient(135deg, #1a1a10, #252520)", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 14, padding: 16, marginBottom: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "var(--color-accent)", opacity: 0.05 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, background: "#fff", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontSize: 7, color: "#000", fontWeight: 900 }}>EP</div>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 11, letterSpacing: 3 }}>EL PACTO</span>
        </div>
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: "var(--color-accent)", background: "rgba(240,224,64,0.1)", border: "1px solid rgba(240,224,64,0.3)", padding: "2px 7px", borderRadius: 20 }}>SOCIO</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--color-accent)", background: "var(--color-gray3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
          {avatar?.startsWith("http") || avatar?.startsWith("data:")
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            : avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, letterSpacing: 1 }}>{name.toUpperCase()}</div>
          <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "var(--color-accent)", color: "#000" }}>{level.toUpperCase()}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-accent)", lineHeight: 1 }}>{socioNumber ? `#${String(socioNumber).padStart(4, "0")}` : "—"}</div>
          <div style={{ fontSize: 8, color: "var(--color-muted)", marginTop: 2 }}>Nº Socio</div>
        </div>
      </div>
    </div>
  );

  const shareOptions = (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {[
          { platform: "whatsapp", emoji: "💬", label: "WhatsApp" },
          { platform: "twitter", emoji: "𝕏", label: "Twitter / X" },
          { platform: "copy", emoji: "🔗", label: "Copiar enlace" },
          { platform: "instagram", emoji: "📸", label: "Instagram Story" },
        ].map((s) => (
          <button
            key={s.platform}
            onClick={() => handleShare(s.platform)}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--color-gray2)", border: "1px solid var(--color-border2)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", fontFamily: "var(--font-body)", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border2)")}
          >
            <span style={{ fontSize: 18 }}>{s.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{s.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => handleShare("download")}
        style={{ width: "100%", background: "var(--color-accent)", color: "#000", border: "none", padding: "13px 0", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-heading)", letterSpacing: 1, marginBottom: 10 }}
      >
        ⬇ DESCARGAR IMAGEN
      </button>
      <button
        onClick={closeShareCarnet}
        style={{ width: "100%", background: "transparent", border: "none", color: "var(--color-muted)", fontSize: 12, cursor: "pointer", padding: "6px 0", fontFamily: "var(--font-body)" }}
      >
        Cerrar
      </button>
    </>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[420]"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={closeShareCarnet}
      />

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[421] animate-slide-up">
        <div style={{ background: "var(--color-gray)", borderRadius: "20px 20px 0 0", padding: "0 20px 36px" }}>
          <div style={{ width: 36, height: 4, background: "var(--color-gray3)", borderRadius: 2, margin: "14px auto 20px" }} />
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "var(--color-muted)", marginBottom: 4 }}>COMPARTIR</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 1 }}>CARNET DE SOCIO</div>
          </div>
          {miniCard}
          {shareOptions}
        </div>
      </div>

      {/* Desktop: centered modal */}
      <div className="hidden sm:flex fixed inset-0 z-[421] items-center justify-center p-6">
        <div
          className="animate-fade-in"
          style={{
            background: "var(--color-gray)",
            borderRadius: 20,
            padding: "36px 40px 40px",
            width: "100%",
            maxWidth: 460,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "var(--color-muted)", marginBottom: 3 }}>COMPARTIR</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 1 }}>CARNET DE SOCIO</div>
            </div>
            <button onClick={closeShareCarnet} style={{ background: "var(--color-gray2)", border: "none", color: "var(--color-muted)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          {miniCard}
          {shareOptions}
        </div>
      </div>
    </>
  );
}
