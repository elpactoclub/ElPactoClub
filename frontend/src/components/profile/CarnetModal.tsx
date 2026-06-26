"use client";

// EN: Member carnet modal showing the digital membership card (front/back) and rendering it to a downloadable PNG via canvas.
// ES: Modal del carnet de socio que muestra la tarjeta de membresía digital (anverso/reverso) y la renderiza a un PNG descargable mediante canvas.

import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

// EN: Draws a rounded-rectangle path on the canvas context.
// ES: Dibuja una ruta de rectángulo redondeado en el contexto del canvas.
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// EN: Renders the full member carnet onto an off-screen canvas (logo, avatar, name, level, number, credits).
// ES: Renderiza el carnet de socio completo en un canvas fuera de pantalla (logo, avatar, nombre, nivel, número, créditos).
async function generateCarnetCanvas(name: string, avatar: string, level: string, credits: number, socioNumber: number | null, desde: string): Promise<HTMLCanvasElement> {
  const SCALE = 2;
  const W = 360, H = 230;
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // Card background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a1a10");
  grad.addColorStop(1, "#252520");
  rrect(ctx, 0, 0, W, H, 14);
  ctx.fillStyle = grad;
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(240,224,64,0.25)";
  ctx.lineWidth = 1;
  rrect(ctx, 0.5, 0.5, W - 1, H - 1, 14);
  ctx.stroke();

  // Decorative circle
  ctx.beginPath();
  ctx.arc(W + 10, -30, 110, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(240,224,64,0.05)";
  ctx.fill();

  // EP logo box
  rrect(ctx, 16, 16, 22, 22, 3);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.font = "bold 8px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EP", 27, 27);

  // "EL PACTO"
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("EL  PACTO", 44, 27);

  // "SOCIO OFICIAL" badge
  const bx = W - 106, by = 14, bw = 90, bh = 18;
  rrect(ctx, bx, by, bw, bh, 9);
  ctx.fillStyle = "rgba(240,224,64,0.1)";
  ctx.fill();
  ctx.strokeStyle = "rgba(240,224,64,0.35)";
  ctx.lineWidth = 1;
  rrect(ctx, bx + 0.5, by + 0.5, bw - 1, bh - 1, 9);
  ctx.stroke();
  ctx.fillStyle = "#F0E040";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SOCIO OFICIAL", bx + bw / 2, by + bh / 2);

  // Avatar circle
  const avX = 41, avY = 84;
  ctx.beginPath();
  ctx.arc(avX, avY, 26, 0, Math.PI * 2);
  ctx.strokeStyle = "#F0E040";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#333";
  ctx.fill();
  ctx.stroke();

  if (avatar?.startsWith("data:") || avatar?.startsWith("http")) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX, avY, 24, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avX - 24, avY - 24, 48, 48);
        ctx.restore();
        resolve();
      };
      img.onerror = () => {
        ctx.font = "22px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(avatar || "🏀", avX, avY);
        resolve();
      };
      img.src = avatar;
    });
  } else {
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(avatar || "🏀", avX, avY);
  }

  // Name
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(name.toUpperCase(), 78, 76);

  // Level badge
  const lvlText = level.toUpperCase();
  ctx.font = "bold 8px Arial";
  const lvlW = ctx.measureText(lvlText).width + 18;
  rrect(ctx, 78, 88, lvlW, 16, 8);
  ctx.fillStyle = "#F0E040";
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(lvlText, 78 + lvlW / 2, 96);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(16, 126);
  ctx.lineTo(W - 16, 126);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bottom row — Nº Socio
  ctx.fillStyle = "#777";
  ctx.font = "700 8px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Nº SOCIO", 16, 147);
  ctx.fillStyle = "#F0E040";
  ctx.font = "bold 24px Arial";
  ctx.fillText(socioNumber ? `#${String(socioNumber).padStart(4, "0")}` : "—", 16, 172);

  // Chip decoration
  const chipGrad = ctx.createLinearGradient(W / 2 - 14, 148, W / 2 + 14, 168);
  chipGrad.addColorStop(0, "#F0E040");
  chipGrad.addColorStop(1, "#c8bc00");
  rrect(ctx, W / 2 - 14, 148, 28, 20, 3);
  ctx.fillStyle = chipGrad;
  ctx.fill();

  // Créditos
  ctx.fillStyle = "#777";
  ctx.font = "700 8px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("CRÉDITOS", W / 2, 198);
  ctx.fillStyle = "#F0E040";
  ctx.font = "bold 14px Arial";
  ctx.fillText(`${credits} ⚡`, W / 2, 216);

  // "Desde"
  ctx.fillStyle = "#777";
  ctx.font = "700 8px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("DESDE", W - 16, 147);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px Arial";
  ctx.fillText(desde, W - 16, 163);

  return canvas;
}

const MESES_ABBR = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
// EN: Formats a date as an abbreviated month + year string in Spanish (e.g. "JUN 2026").
// ES: Formatea una fecha como mes abreviado + año en español (p.ej. "JUN 2026").
function fmtMesAnio(d: Date): string {
  return `${MESES_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

// EN: Carnet modal component rendering the membership card and handling PNG download.
// ES: Componente de modal de carnet que renderiza la tarjeta de socio y gestiona la descarga en PNG.
export default function CarnetModal() {
  const { isCarnetOpen, closeCarnet, openShareCarnet, showToast } = useUIStore();
  const { name, avatar, credits, level, socioNumber, socioSince } = useUserStore();

  // DESDE = fecha en que se hizo socio · VÁLIDO HASTA = fin del período mensual (socioSince + 1 mes)
  const desdeDate = socioSince ? new Date(socioSince) : null;
  const hastaDate = desdeDate ? new Date(desdeDate.getFullYear(), desdeDate.getMonth() + 1, desdeDate.getDate()) : null;
  const desdeLabel = desdeDate ? fmtMesAnio(desdeDate) : "—";
  const hastaLabel = hastaDate ? fmtMesAnio(hastaDate) : "—";

  async function handleDownload() {
    try {
      const canvas = await generateCarnetCanvas(name, avatar, level, credits, socioNumber, desdeLabel);
      canvas.toBlob((blob) => {
        if (!blob) { showToast("Error al generar imagen"); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `carnet-elpacto-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      showToast("Error al generar imagen");
    }
  }

  if (!isCarnetOpen) return null;

  const cardFront = (
    <div style={{ background: "linear-gradient(135deg, #1a1a10, #252520)", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 14, padding: 16, marginBottom: 10, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "var(--color-accent)", opacity: 0.05 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 16, height: 16, background: "#fff", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontSize: 8, color: "#000", fontWeight: 900 }}>EP</div>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, letterSpacing: 3 }}>EL PACTO</span>
        </div>
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: "var(--color-accent)", background: "rgba(240,224,64,0.1)", border: "1px solid rgba(240,224,64,0.3)", padding: "2px 8px", borderRadius: 20 }}>SOCIO OFICIAL</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, position: "relative", zIndex: 1 }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid var(--color-accent)", background: "var(--color-gray3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, overflow: "hidden" }}>
          {avatar?.startsWith("http") || avatar?.startsWith("data:")
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            : avatar}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, letterSpacing: 1, marginBottom: 4 }}>{name.toUpperCase()}</div>
          <span style={{ fontSize: 8, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "var(--color-accent)", color: "#000" }}>{level.toUpperCase()}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 8, color: "#777", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Nº Socio</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, letterSpacing: 3, color: "var(--color-accent)", lineHeight: 1 }}>{socioNumber ? `#${String(socioNumber).padStart(4, "0")}` : "—"}</div>
        </div>
        <div style={{ width: 28, height: 20, borderRadius: 3, background: "linear-gradient(135deg, var(--color-accent), #c8bc00)", opacity: 0.8 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, color: "#777", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Desde</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>{desdeLabel}</div>
        </div>
      </div>
    </div>
  );

  const cardBack = (
    <div style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 11, letterSpacing: 2, color: "#000", marginBottom: 9 }}>EL PACTO · DATOS DEL SOCIO</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[{ label: "Nº Socio", value: socioNumber ? `#${String(socioNumber).padStart(4, "0")}` : "—" }, { label: "Nivel", value: level.toUpperCase() }, { label: "Créditos", value: `${credits} ⚡` }, { label: "Válido hasta", value: hastaLabel }].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: 8, color: "#666", textTransform: "uppercase", fontWeight: 700 }}>{item.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const actions = (
    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={() => { closeCarnet(); setTimeout(() => openShareCarnet(), 200); }}
        style={{ flex: 1, background: "var(--color-accent)", color: "#000", border: "none", padding: "12px 0", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
      >
        📤 Compartir
      </button>
      <button
        onClick={handleDownload}
        style={{ flex: 1, background: "var(--color-gray2)", color: "#fff", border: "1px solid var(--color-border2)", padding: "12px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}
      >
        ⬇ Guardar
      </button>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400]"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={closeCarnet}
      />

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[401] animate-slide-up">
        <div style={{ background: "var(--color-gray)", borderRadius: "20px 20px 0 0", padding: "0 20px 40px" }}>
          <div style={{ width: 36, height: 4, background: "var(--color-gray3)", borderRadius: 2, margin: "14px auto 20px" }} />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 1, marginBottom: 16 }}>Carnet de Socio</div>
          {cardFront}
          {cardBack}
          {actions}
        </div>
      </div>

      {/* Desktop: centered modal */}
      <div className="hidden sm:flex fixed inset-0 z-[401] items-center justify-center p-6">
        <div
          className="animate-fade-in"
          style={{
            background: "var(--color-gray)",
            borderRadius: 20,
            padding: "36px 40px 40px",
            width: "100%",
            maxWidth: 480,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 1 }}>Carnet de Socio</div>
            <button onClick={closeCarnet} style={{ background: "var(--color-gray2)", border: "none", color: "var(--color-muted)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          {cardFront}
          {cardBack}
          {actions}
        </div>
      </div>
    </>
  );
}
