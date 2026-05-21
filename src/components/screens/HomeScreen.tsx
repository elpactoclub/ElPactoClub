"use client";

import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { useRef, useState, useEffect } from "react";

// .sec equivalent
function Sec({ left, right, rightGreen }: { left: string; right?: string; rightGreen?: boolean }) {
  return (
    <div
      style={{
        fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px",
        color: "var(--color-muted)", textTransform: "uppercase", marginBottom: "8px",
        display: right ? "flex" : undefined, justifyContent: right ? "space-between" : undefined,
      }}
    >
      <span>{left}</span>
      {right && <span style={{ color: rightGreen ? "var(--color-green)" : "var(--color-accent)" }}>{right}</span>}
    </div>
  );
}

// ==========================================
// STREAK + XP CARD
// ==========================================
function StreakXPCard() {
  const { streak, xp, level, nextLevel, xpProgress } = useUserStore();
  const xpMax = nextLevel === "MVP" ? 2000 : nextLevel === "Leyenda" ? 5000 : 500;

  const dots = Array.from({ length: 7 }, (_, i) => ({
    on: i < streak,
    today: i === Math.min(streak, 6),
  }));

  return (
    <div className="card" style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Flame + streak */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
          <span style={{ fontSize: "20px" }}>🔥</span>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-accent)", lineHeight: 1.05 }}>{streak} días</div>
            <div style={{ fontSize: "9px", color: "var(--color-muted)" }}>x1.5 XP activo</div>
          </div>
        </div>
        {/* Vertical divider */}
        <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.16)", flexShrink: 0 }} />
        {/* XP progress (flex:1) — nivel/XP en 2 líneas apiladas (sin choque) + barra */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px", gap: 8 }}>
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{level} <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>→</span></div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--color-muted)" }}>{nextLevel || "MAX"}</div>
            </div>
            <div style={{ lineHeight: 1.25, textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{xp.toLocaleString()} / {xpMax.toLocaleString()}</div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-accent)" }}>XP</div>
            </div>
          </div>
          <div style={{ height: "6px", background: "var(--color-gray3)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, xpProgress))}%`, background: "linear-gradient(90deg, var(--color-accent), var(--color-green))", borderRadius: "3px" }} />
          </div>
        </div>
        {/* Week dots */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "3px" }}>
            {dots.map((d, i) => (
              <div key={i} style={{ width: "17px", height: "4px", borderRadius: "2px", background: d.today ? "var(--color-green)" : d.on ? "var(--color-accent)" : "var(--color-gray3)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SEASON CARD
// ==========================================
function SeasonCard() {
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "var(--color-muted)" }}>TEMPORADA VERANO 2026</div>
        <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-purple)" }}>89 DÍAS RESTANTES</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
        <span style={{ fontSize: "22px" }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "2px" }}>Badge exclusivo de Verano</div>
          <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>Consigue 1000 XP este verano para ganarlo</div>
        </div>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg,#6d28d9,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>⭐</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div style={{ fontSize: "10px", color: "var(--color-muted)" }}>Tu progreso este mes</div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-purple)" }}>340 / 1000 XP</div>
      </div>
      <div style={{ height: "5px", background: "var(--color-gray3)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: "34%", height: "100%", background: "linear-gradient(90deg,var(--color-purple),#7c3aed)", borderRadius: "3px" }} />
      </div>
    </div>
  );
}

// ==========================================
// DAILY REWARD (ROULETTE)
// ==========================================
function DailyReward() {
  const { ruletaSpun, spinRuleta, spinRuletaApi, isAuthenticated, addCredits, addXP } = useUserStore();
  const { showToast } = useUIStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const todayName = DAYS[new Date().getDay()];

  const segments = [
    { label: "+10 ⚡", color: "#F0E040", key: "+10 ⚡" },
    { label: "2x XP",  color: "#A78BFA", key: "2x XP" },
    { label: "+20 ⚡", color: "#22C55E", key: "+20 ⚡" },
    { label: "1 ticket", color: "#60A5FA", key: "1 Ticket" },
    { label: "+50 ⚡", color: "#EF4444", key: "+50 ⚡" },
    { label: "Voto gratis", color: "#F472B6", key: "Voto gratis" },
    { label: "+5 ⚡",  color: "#F59E0B", key: "+5 ⚡" },
    { label: "Sorteo", color: "#06B6D4", key: "🎁 Sorpresa" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const cx = w / 2, cy = w / 2, r = w / 2 - 4;
    const n = segments.length;
    const arc = (2 * Math.PI) / n;
    ctx.clearRect(0, 0, w, w);
    segments.forEach((seg, i) => {
      const start = i * arc - Math.PI / 2;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 6;
      ctx.fillText(seg.label, r * 0.62, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
    ctx.fillStyle = "#111111";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const handleSpin = async () => {
    if (ruletaSpun || spinning) return;
    setSpinning(true);
    if (isAuthenticated) {
      const prize = await spinRuletaApi();
      if (!prize) { setSpinning(false); showToast("Error al conectar con la ruleta real ❌"); return; }
      const winIdx = segments.findIndex((s) => s.key === prize.prize);
      const targetSeg = segments[winIdx >= 0 ? winIdx : 0];
      setTimeout(() => {
        setSpinning(false);
        setResult(targetSeg.label);
        showToast(`Premio: ${targetSeg.label} · Reclamado ✓`);
      }, 2000);
    } else {
      const winIdx = Math.floor(Math.random() * segments.length);
      const prize = segments[winIdx];
      setTimeout(() => {
        setSpinning(false);
        spinRuleta();
        addCredits(10);
        addXP(25);
        setResult(prize.label);
        showToast(`+10 créditos · ¡Recompensa diaria! 🎁`);
      }, 2000);
    }
  };

  return (
    <div>
      <Sec left="Recompensa diaria" right="🎁 Gira la ruleta cada día" rightGreen />
      <div className="card" style={{ padding: "14px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "14px" }}>
          Hoy · {todayName} · Gira y descubre tu premio
        </div>
        <div style={{ position: "relative", display: "inline-block", marginBottom: "14px" }}>
          <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", fontSize: "20px", zIndex: 10, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.5))" }}>▼</div>
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className={spinning ? "animate-spin-slow" : ""}
            style={{ borderRadius: "50%", boxShadow: "0 4px 20px rgba(0,0,0,.4)" }}
          />
        </div>
        {ruletaSpun ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ width: "100%", background: "var(--color-gray2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-muted)", padding: "13px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
              ✓ Vuelve mañana
            </div>
            {result && (
              <div style={{ width: "100%", background: "var(--color-accent)", color: "var(--color-black)", padding: "13px", borderRadius: "9px", fontSize: "13px", fontWeight: 800, textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
                🎟 {result}{result.includes("ticket") ? " de sorteo" : ""}!
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSpin}
            disabled={spinning}
            style={{ width: "100%", background: "var(--color-accent)", color: "var(--color-black)", border: "none", padding: "13px 32px", borderRadius: "9px", fontSize: "13px", fontWeight: 800, cursor: spinning ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >
            🎰 Girar ruleta
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// NEXT EVENT
// ==========================================
function NextEvent() {
  const { setTab } = useUIStore();

  return (
    <button
      onClick={() => setTab("eventos")}
      style={{
        background: "linear-gradient(135deg,#0a0a0a,#1a1a10)",
        border: "1px solid #F0E04030",
        borderRadius: "10px",
        padding: "12px 14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "relative",
        overflow: "hidden",
        textAlign: "left",
        width: "100%",
      }}
    >
      <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-accent)", opacity: 0.06, pointerEvents: "none" }} />
      <div style={{ width: "52px", height: "52px", borderRadius: "10px", background: "#FF6B1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🏀</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "1.5px", color: "var(--color-accent)", marginBottom: "3px", textTransform: "uppercase" }}>PRÓXIMO EVENTO</div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 800, marginBottom: "2px" }}>MVP&apos;S TOUR 3x3</div>
        <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>📍 Vilanova · 28 de Junio</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--color-accent)", lineHeight: 1 }}>12</div>
        <div style={{ fontSize: "9px", color: "var(--color-muted)" }}>días</div>
      </div>
    </button>
  );
}

// ==========================================
// TEAM MISSION
// ==========================================
interface MissionData {
  code: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  isComplete: boolean;
}

function TeamMission() {
  const [mission, setMission] = useState<MissionData | null>(null);

  useEffect(() => {
    import("@/services/api").then(({ api }) => {
      api.get("/missions")
        .then((r) => {
          const list: MissionData[] = r.data || [];
          const active = list.find((m) => !m.isComplete) || list[0];
          if (active) setMission(active);
        })
        .catch(() => {});
    });
  }, []);

  const fallback: MissionData = {
    code: "weekly_votes_500",
    title: "Entre todos: 500 votos esta semana",
    description: "Si lo conseguimos, el viernes el club lanza contenido exclusivo del MVP’S TOUR 3x3.",
    target: 500,
    current: 342,
    reward: "Contenido exclusivo del MVP'S TOUR 3x3",
    isComplete: false,
  };

  const m = mission || fallback;
  const pct = Math.min(100, Math.round((m.current / m.target) * 100));

  return (
    <div className="card" style={{ background: "linear-gradient(135deg,#0a0a1a,#14141e)", borderColor: "#60A5FA30" }}>
      <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "2px", color: "var(--color-blue)", marginBottom: "7px" }}>⚡ MISIÓN DE EQUIPO</div>
      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "3px" }}>{m.title}</div>
      <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "8px" }}>{m.description}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
        <span style={{ color: "var(--color-muted)" }}>Progreso</span>
        <span style={{ color: "var(--color-blue)", fontWeight: 700 }}>{m.current.toLocaleString()} / {m.target.toLocaleString()}</span>
      </div>
      <div style={{ height: "5px", background: "var(--color-gray3)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,var(--color-blue),var(--color-green))", borderRadius: "3px" }} />
      </div>
      {m.isComplete && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--color-green)", fontWeight: 700 }}>🎉 ¡Completada! Recompensa: {m.reward}</div>
      )}
    </div>
  );
}

// ==========================================
// MY CONTRIBUTION
// ==========================================
function MyContribution() {
  return (
    <div>
      <Sec left="Mi contribución al equipo" />
      <div className="card" style={{ padding: "10px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          <div className="card2" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--color-blue)" }}>3</div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>Votos esta semana</div>
          </div>
          <div className="card2" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--color-green)" }}>0.6%</div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>Del total del club</div>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
          <span>Tu aportación a la misión</span>
          <span style={{ color: "var(--color-blue)", fontWeight: 700 }}>3 / 10 votos</span>
        </div>
        <div style={{ height: "6px", background: "var(--color-gray3)", borderRadius: "3px", overflow: "hidden", margin: "4px 0" }}>
          <div style={{ width: "30%", height: "100%", background: "linear-gradient(90deg,var(--color-blue),var(--color-green))", borderRadius: "3px" }} />
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "6px" }}>
          🏆 Si llegas a 10 votos esta semana → badge <strong style={{ color: "var(--color-white)" }}>Fan Comprometido</strong>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MONTHLY RAFFLE
// ==========================================
function MonthlyRaffle() {
  const { spendCredits, addTicket, addXP, isAuthenticated } = useUserStore();
  const { showToast } = useUIStore();
  const [participants, setParticipants] = useState(247);

  const handleJoin = async () => {
    if (isAuthenticated) {
      try {
        const { api } = await import("@/services/api");
        const raffles = await api.get("/gamification/raffles");
        if (raffles.data && raffles.data.length > 0) {
          const activeRaffle = raffles.data[0];
          await api.post(`/gamification/raffles/${activeRaffle.id}/enter`);
          addTicket(); addXP(50); setParticipants((p) => p + 1);
          showToast("🎟 Entrada añadida · +50 XP ✓");
        } else { showToast("No hay sorteos activos en este momento."); }
      } catch { showToast("Necesitas 75 ⚡ para participar ❌"); }
    } else {
      if (!spendCredits(75)) { showToast("Sin créditos suficientes"); return; }
      addTicket(); addXP(50); setParticipants((p) => p + 1);
      showToast("🎟 Entrada añadida · +50 XP");
    }
  };

  return (
    <div>
      <Sec left="Sorteo del mes" />
      <div style={{ background: "linear-gradient(135deg,#1a1a10,#252515)", border: "1px solid #F0E04030", borderRadius: "10px", padding: "14px" }}>
        <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "2px", color: "var(--color-accent)", marginBottom: "10px" }}>🎁 SORTEO DE JUNIO</div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ width: "52px", height: "52px", background: "#2a2a20", border: "1px solid #F0E04030", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🏀</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 900, marginBottom: "2px" }}>PRODUCTO HOOPS</div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "4px" }}>📍 Valorado en 200€</div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>⚡ 75 · {participants} participantes</div>
          </div>
        </div>
        <button
          onClick={handleJoin}
          style={{ width: "100%", background: "var(--color-accent)", color: "var(--color-black)", border: "none", padding: "11px", borderRadius: "9px", fontSize: "11px", fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        >
          🎟 Participar — ⚡ 75 créditos
        </button>
      </div>
    </div>
  );
}

// ==========================================
// HOME SCREEN
// ==========================================
export default function HomeScreen() {
  return (
    <div className="home-screen" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", paddingBottom: "16px" }}>
      <div className="home-full"><StreakXPCard /></div>
      <div className="home-full"><SeasonCard /></div>
      <div className="home-full"><DailyReward /></div>
      <NextEvent />
      <TeamMission />
      <MyContribution />
      <MonthlyRaffle />
    </div>
  );
}
