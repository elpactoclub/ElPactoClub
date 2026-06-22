"use client";

import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { useRef, useState, useEffect } from "react";
import { api } from "@/services/api";
import { setSelectedEvent } from "@/components/events/EventPageModal";
import AnimatedBar from "@/components/ui/AnimatedBar";
import Skel from "@/components/ui/Skel";
import { useAuthLoading } from "@/hooks/useAuthLoading";

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
  const authLoading = useAuthLoading();
  const { streak, xp, level, nextLevel, xpProgress } = useUserStore();
  const xpMax = nextLevel === "MVP" ? 2000 : nextLevel === "Leyenda" ? 5000 : 500;

  if (authLoading) {
    return (
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Skel w={70} h={30} />
          <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.16)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <Skel w={90} h={11} r={4} />
              <Skel w={60} h={11} r={4} />
            </div>
            <Skel h={6} r={3} style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  const dots = Array.from({ length: 7 }, (_, i) => ({
    on: i < streak,
    today: i === Math.min(streak, 6),
  }));

  return (
    <div className="card" style={{ padding: "16px" }}>
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
            <AnimatedBar pct={xpProgress} background="linear-gradient(90deg, var(--color-accent), var(--color-green))" />
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
  const { xp } = useUserStore();
  const SEASON_GOAL = 1000;
  const pct = Math.min(100, Math.round((xp / SEASON_GOAL) * 100));

  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "var(--color-muted)" }}>TEMPORADA VERANO 2026</div>
        <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-purple)" }}>{Math.max(0, Math.ceil((new Date("2026-09-22T00:00:00+02:00").getTime() - Date.now()) / 86400000))} DÍAS RESTANTES</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
        <span style={{ fontSize: "22px" }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "2px" }}>Badge exclusivo de Verano</div>
          <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>Consigue 1000 XP este verano para ganarlo</div>
        </div>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg,#6d28d9,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900, letterSpacing: "0.5px", color: "#fff", textTransform: "uppercase", flexShrink: 0 }}>exp</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div style={{ fontSize: "10px", color: "var(--color-muted)" }}>Tu progreso este mes</div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-purple)" }}>{xp.toLocaleString()} / {SEASON_GOAL.toLocaleString()} XP</div>
      </div>
      <div style={{ height: "5px", background: "var(--color-gray3)", borderRadius: "3px", overflow: "hidden" }}>
        <AnimatedBar pct={pct} background="linear-gradient(90deg,var(--color-purple),#7c3aed)" />
      </div>
    </div>
  );
}

// ==========================================
// DAILY REWARD (ROULETTE) — v2 premium
// ==========================================
const SPIN_DURATION = 3200;
const WHEEL_SIZE = 248;

const SEGMENTS = [
  { label: "+10 ⚡",      color: "#F0E040", tc: "#000", key: "+10 ⚡" },
  { label: "2x XP",      color: "#60A5FA", tc: "#000", key: "2x XP" },
  { label: "+20 ⚡",      color: "#22C55E", tc: "#000", key: "+20 ⚡" },
  { label: "1 Ticket",   color: "#A78BFA", tc: "#fff", key: "1 Ticket" },
  { label: "+50 ⚡",      color: "#F59E0B", tc: "#000", key: "+50 ⚡" },
  { label: "Voto gratis",color: "#EC4899", tc: "#fff", key: "Voto gratis" },
  { label: "+5 ⚡",       color: "#6366F1", tc: "#fff", key: "+5 ⚡" },
  { label: "🎁 Sorpresa", color: "#EF4444", tc: "#fff", key: "🎁 Sorpresa" },
];

function drawWheel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  // Reset any prior transform, clear physical pixels, then scale to draw in logical (CSS) px.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);
  const size = canvas.width / dpr; // logical size (= WHEEL_SIZE)
  const cx = size / 2, cy = size / 2;
  const r = cx - 4;
  const n = SEGMENTS.length;
  const arc = (2 * Math.PI) / n;

  // Outer border
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();

  SEGMENTS.forEach((seg, i) => {
    const start = i * arc - Math.PI / 2;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text — radial, right-aligned at outer edge (like the HTML original)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = seg.tc;
    ctx.font = "bold 12px 'DM Sans', sans-serif";
    ctx.shadowColor = seg.tc === "#000" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(seg.label, r - 8, 0);
    ctx.restore();
  });

  // Center circle with 🏀
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, 2 * Math.PI);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "14px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 0;
  ctx.fillText("🏀", cx, cy);
}

function DailyReward() {
  const { ruletaSpun, spinRuletaApi, isAuthenticated } = useUserStore();
  const { showToast, openAuth } = useUIStore();
  const authLoading = useAuthLoading();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ label: string; color: string; emoji: string } | null>(null);
  const [wheelDeg, setWheelDeg] = useState(22.5); // start aligned so pointer hits center of first segment

  const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const todayName = DAYS[new Date().getDay()];

  useEffect(() => {
    if (!canvasRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = WHEEL_SIZE * dpr;
    canvasRef.current.height = WHEEL_SIZE * dpr;
    (canvasRef.current as any).style.width = `${WHEEL_SIZE}px`;
    (canvasRef.current as any).style.height = `${WHEEL_SIZE}px`;
    drawWheel(canvasRef.current);
  }, []);

  const spinToIndex = (idx: number) => {
    const segAngle = 360 / SEGMENTS.length;
    const targetAngle = (360 - ((idx + 0.5) * segAngle % 360)) % 360;
    const finalDeg = wheelDeg + 4 * 360 + ((targetAngle - wheelDeg % 360) + 360) % 360;
    setWheelDeg(finalDeg);
  };

  const handleSpin = async () => {
    if (!isAuthenticated) { openAuth(); return; }
    if (ruletaSpun || spinning) return;
    setSpinning(true);
    setResult(null);

    // Start spinning IMMEDIATELY with a random visual target — no API delay
    const dummyIdx = Math.floor(Math.random() * SEGMENTS.length);
    spinToIndex(dummyIdx);

    // Call API in parallel while wheel is already spinning
    const prizePromise = spinRuletaApi();

    // Wait for animation to finish
    await new Promise((r) => setTimeout(r, SPIN_DURATION));

    // Now get the real server result
    const prize = await prizePromise;
    setSpinning(false);
    if (!prize) { showToast("Error al conectar con la ruleta ❌"); return; }
    const winIdx = SEGMENTS.findIndex((s) => s.key === prize.prize);
    const idx = winIdx >= 0 ? winIdx : dummyIdx;
    setResult({ label: SEGMENTS[idx].label, color: SEGMENTS[idx].color, emoji: "🎁" });
  };

  const alreadySpun = ruletaSpun && isAuthenticated;
  const ctaLoading = authLoading && !spinning;

  return (
    <div>
      <Sec left="Recompensa diaria" right="🎁 Gira la ruleta cada día" rightGreen />
      <div className="card" style={{ padding: "20px 16px", background: "linear-gradient(160deg,#0d0d0d,#141410)", border: "1px solid rgba(240,224,64,0.12)" }}>

        {/* Wheel + pointer */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16, paddingTop: 12 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            {!alreadySpun && !spinning && (
              <div style={{ position: "absolute", inset: -5, borderRadius: "50%", boxShadow: "0 0 22px 5px rgba(240,224,64,0.22)", animation: "pulseGlow 2.2s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
            )}
            {/* Pointer */}
            <div style={{
              position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "11px solid transparent", borderRight: "11px solid transparent",
              borderTop: "24px solid #F0E040",
              filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.9))",
              zIndex: 10,
            }} />
            <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: "#fff", zIndex: 11 }} />
            <canvas
              ref={canvasRef}
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
              style={{
                borderRadius: "50%",
                display: "block",
                position: "relative",
                zIndex: 1,
                boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.04)",
                transform: `rotate(${wheelDeg}deg)`,
                transition: spinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.25,0.1,0.2,1)` : "none",
              }}
            />
          </div>
        </div>

        {/* Result reveal */}
        {result && (
          <div style={{ margin: "0 0 12px", padding: "10px 12px", borderRadius: 10, background: result.color + "22", border: `1px solid ${result.color}55`, display: "flex", alignItems: "center", gap: 8, animation: "dialogPopIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: result.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{result.emoji}</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: result.color, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 1 }}>¡Premio!</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{result.label}</div>
            </div>
          </div>
        )}

        {/* Info + CTA */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Hoy · {todayName}</div>
          <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 14, lineHeight: 1.5 }}>
            {alreadySpun ? "¡Ya reclamaste tu recompensa de hoy!" : "Gira y descubre tu recompensa diaria."}
          </div>

          {ctaLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "14px 40px" }}>
              <span style={{ display: "inline-block", width: 22, height: 22, border: "3px solid rgba(240,224,64,0.3)", borderTopColor: "#F0E040", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : alreadySpun ? (
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-muted)", padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
              ✓ Vuelve mañana
            </div>
          ) : (
            <button
              onClick={handleSpin}
              disabled={spinning}
              style={{
                background: spinning ? "rgba(240,224,64,0.4)" : "linear-gradient(135deg,#F0E040,#f5c518)",
                color: "#000",
                border: "none",
                padding: "14px 40px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 900,
                cursor: spinning ? "default" : "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.5px",
                boxShadow: spinning ? "none" : "0 4px 20px rgba(240,224,64,0.35)",
                transition: "all 0.2s",
              }}
            >
              {spinning ? "✨ Girando..." : "🎰 Girar ruleta"}
            </button>
          )}
        </div>

        <style>{`
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 16px 3px rgba(240,224,64,0.15); }
            50% { box-shadow: 0 0 28px 8px rgba(240,224,64,0.3); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ==========================================
// NEXT EVENT
// ==========================================
interface UpcomingEvent {
  id: string; title: string; description?: string; type: string; date: string;
  location?: string; city?: string; creditsCost: number; maxAttendees?: number;
  attendeesCount: number; imageUrl?: string; showOnHome?: boolean; polls?: { question: string; options: string[] }[];
}

function NextEventCard({ event, onOpen }: { event: UpcomingEvent | null; onOpen: () => void }) {
  const days = event ? Math.max(0, Math.ceil((new Date(event.date).getTime() - Date.now()) / 86400000)) : 0;
  const dateLabel = event
    ? new Date(event.date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    : "";
  return (
    <button
      onClick={onOpen}
      style={{
        background: "linear-gradient(135deg,#0a0a0a,#1a1a10)",
        border: "1px solid #F0E04030",
        borderRadius: "10px",
        padding: "16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "relative",
        overflow: "hidden",
        textAlign: "left",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-accent)", opacity: 0.06, pointerEvents: "none" }} />
      <div style={{ width: "52px", height: "52px", borderRadius: "10px", background: event?.imageUrl ? "#222" : "#FF6B1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0, overflow: "hidden" }}>
        {event?.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={event.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "🏀"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {event ? (
          <>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 800, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>📍 {event.city || event.location || "—"} · {dateLabel}</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 800, marginBottom: "2px" }}>Sin eventos próximos</div>
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>Toca para ver todos los eventos</div>
          </>
        )}
      </div>
      {event && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--color-accent)", lineHeight: 1 }}>{days === 0 ? "Hoy" : days}</div>
          {days > 0 && <div style={{ fontSize: "9px", color: "var(--color-muted)" }}>{days === 1 ? "día" : "días"}</div>}
        </div>
      )}
    </button>
  );
}

function NextEvent() {
  const { setTab, openEventPage } = useUIStore();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/events")
      .then((r) => {
        const list: UpcomingEvent[] = Array.isArray(r.data) ? r.data : [];
        const now = Date.now();
        const upcoming = list
          .filter((e) => new Date(e.date).getTime() >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Mostrar solo los eventos que el admin marcó para el inicio
        setEvents(upcoming.filter((e) => e.showOnHome === true));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotación cada 5s (se reinicia con el swipe manual)
  useEffect(() => {
    if (events.length <= 1) return;
    const t = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const next = (activeIdx + 1) % events.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearTimeout(t);
  }, [activeIdx, events.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setActiveIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  const open = (e: UpcomingEvent) => { setSelectedEvent(e as any); openEventPage(); };

  let body: React.ReactNode;
  if (loading) body = (
    <div style={{ background: "linear-gradient(135deg,#0a0a0a,#1a1a10)", border: "1px solid #F0E04030", borderRadius: "10px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
      <Skel w={52} h={52} r={10} />
      <div style={{ flex: 1 }}>
        <Skel w="55%" h={16} style={{ marginBottom: 6 }} />
        <Skel w="40%" h={11} />
      </div>
      <Skel w={34} h={26} />
    </div>
  );
  else if (events.length === 0) body = <NextEventCard event={null} onOpen={() => setTab("eventos")} />;
  else if (events.length === 1) body = <NextEventCard event={events[0]} onOpen={() => open(events[0])} />;
  else body = (
    <div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="hide-scrollbar"
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {events.map((e) => (
          <div key={e.id} style={{ flex: "0 0 100%", minWidth: "100%", scrollSnapAlign: "start", boxSizing: "border-box" }}>
            <NextEventCard event={e} onOpen={() => open(e)} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Evento ${i + 1}`}
            style={{ width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? "var(--color-accent)" : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", transition: "width 0.2s", padding: 0 }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Sec left="Próximos eventos" />
      {body}
    </div>
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

function MissionCard({ m }: { m: MissionData }) {
  const pct = Math.min(100, Math.round((m.current / m.target) * 100));
  return (
    <div className="card" style={{ background: "linear-gradient(135deg,#0a0a1a,#14141e)", borderColor: "#60A5FA30", height: "100%", boxSizing: "border-box" }}>
      <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "2px", color: "var(--color-blue)", marginBottom: "7px" }}>⚡ MISIÓN DE EQUIPO</div>
      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "3px" }}>{m.title}</div>
      <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "8px" }}>{m.description}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
        <span style={{ color: "var(--color-muted)" }}>Progreso</span>
        <span style={{ color: "var(--color-blue)", fontWeight: 700 }}>{m.current.toLocaleString()} / {m.target.toLocaleString()}</span>
      </div>
      <div style={{ height: "5px", background: "var(--color-gray3)", borderRadius: "3px", overflow: "hidden" }}>
        <AnimatedBar pct={pct} background="linear-gradient(90deg,var(--color-blue),var(--color-green))" />
      </div>
      {m.isComplete && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--color-green)", fontWeight: 700 }}>🎉 ¡Completada! Recompensa: {m.reward}</div>
      )}
    </div>
  );
}

function TeamMission() {
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@/services/api").then(({ api }) => {
      api.get("/missions")
        .then((r) => {
          const list: MissionData[] = r.data || [];
          // Las no completadas primero
          setMissions([...list].sort((a, b) => Number(a.isComplete) - Number(b.isComplete)));
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

  const items = missions.length ? missions : [fallback];

  // Auto-rotación cada 5s. Se reinicia con cada cambio (incluido el swipe manual).
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const next = (activeIdx + 1) % items.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearTimeout(t);
  }, [activeIdx, items.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setActiveIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Single mission → no carousel
  if (items.length === 1) return <MissionCard m={items[0]} />;

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="hide-scrollbar"
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((m) => (
          <div key={m.code} style={{ flex: "0 0 100%", minWidth: "100%", scrollSnapAlign: "start", boxSizing: "border-box" }}>
            <MissionCard m={m} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Misión ${i + 1}`}
            style={{ width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? "var(--color-blue)" : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", transition: "width 0.2s", padding: 0 }}
          />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// MY CONTRIBUTION
// ==========================================
function MyContribution() {
  const [weekVotes, setWeekVotes] = useState(0);
  const [clubPct, setClubPct] = useState("0.0");
  const { isAuthenticated } = useUserStore();
  const authLoading = useAuthLoading();

  useEffect(() => {
    if (!isAuthenticated) return;
    import("@/services/api").then(({ api }) => {
      api.get("/users/me/weekly-votes")
        .then((r) => {
          setWeekVotes(r.data?.votes ?? 0);
          setClubPct(r.data?.clubPct ?? "0.0");
        })
        .catch(() => {});
    });
  }, [isAuthenticated]);

  const GOAL = 10;
  const pct = Math.min(100, Math.round((weekVotes / GOAL) * 100));

  return (
    <div>
      <Sec left="Mi contribución al equipo" />
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          <div className="card2" style={{ textAlign: "center" }}>
            {authLoading
              ? <Skel w={40} h={22} style={{ margin: "0 auto" }} />
              : <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--color-blue)" }}>{weekVotes}</div>}
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>Votos esta semana</div>
          </div>
          <div className="card2" style={{ textAlign: "center" }}>
            {authLoading
              ? <Skel w={48} h={22} style={{ margin: "0 auto" }} />
              : <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "var(--color-green)" }}>{clubPct}%</div>}
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>Del total del club</div>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
          <span>Tu aportación a la misión</span>
          <span style={{ color: "var(--color-blue)", fontWeight: 700 }}>{weekVotes} / {GOAL} votos</span>
        </div>
        <div style={{ height: "6px", background: "var(--color-gray3)", borderRadius: "3px", overflow: "hidden", margin: "4px 0" }}>
          <AnimatedBar pct={pct} background="linear-gradient(90deg,var(--color-blue),var(--color-green))" />
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
interface ActiveRaffle {
  id: string;
  title: string;
  description?: string;
  prizeImageUrl?: string;
  prizeValue: number;
  ticketCost: number;
  participantCount: number;
  drawDate?: string;
  hasEntered?: boolean;
  isFinished?: boolean;
  winnerName?: string | null;
  audience?: string;
}

function MonthlyRaffle() {
  const { addTicket, addXP, spendCredits, credits, isAuthenticated, role, isSocio } = useUserStore();
  const { showToast, openAuth, setTab } = useUIStore();
  const authLoading = useAuthLoading();
  const [raffle, setRaffle] = useState<ActiveRaffle | null>(null);
  const [participants, setParticipants] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [joining, setJoining] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { api } = await import("@/services/api");
        const raffles = await api.get("/gamification/raffles");
        if (raffles.data?.length > 0) {
          const r = raffles.data[0] as ActiveRaffle;
          setRaffle(r);
          if (typeof r.participantCount === "number") setParticipants(r.participantCount);
          setHasEntered(!!r.hasEntered);
        }
      } catch { /* ignore */ }
    })();
  }, [isAuthenticated]);

  const ticketCost = raffle?.ticketCost ?? 75;
  const title = raffle?.title ?? "Sorteo del mes";
  const prizeValue = raffle?.prizeValue;
  const drawDateLabel = raffle?.drawDate
    ? new Date(raffle.drawDate).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const handleJoin = async () => {
    if (!isAuthenticated) { openAuth(); return; }
    if (hasEntered || joining) return;
    if (credits < ticketCost) { showToast("Necesitas más créditos ⚡"); setTab("store"); return; }
    setJoining(true);
    try {
      const { api } = await import("@/services/api");
      let target = raffle;
      if (!target) {
        const raffles = await api.get("/gamification/raffles");
        target = raffles.data?.[0] ?? null;
      }
      if (target) {
        if (target.hasEntered) {
          setHasEntered(true);
          showToast("Ya participas en este sorteo ✓");
          return;
        }
        await api.post(`/gamification/raffles/${target.id}/enter`);
        spendCredits(target.ticketCost ?? ticketCost); addTicket(); addXP(50);
        setHasEntered(true);
        setParticipants((p) => p + 1);
        showToast("🎟 Entrada añadida · +50 XP ✓");
        setDetailOpen(false);
      } else {
        showToast("No hay sorteos activos en este momento.");
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setHasEntered(true);
        showToast("Ya participas en este sorteo ✓");
      } else {
        showToast("Necesitas más créditos ⚡"); setTab("store");
      }
    } finally {
      setJoining(false);
    }
  };

  const PrizeImage = ({ size }: { size: number }) => (
    <div style={{ width: size, height: size, background: "#2a2a20", border: "1px solid #F0E04030", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.46, flexShrink: 0, overflow: "hidden" }}>
      {raffle?.prizeImageUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={raffle.prizeImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : "🏀"}
    </div>
  );

  const finished = !!raffle?.isFinished;
  const audience = raffle?.audience ?? "all";
  // Non-authenticated users see the normal button (tap → login). Eligibility applies once logged in.
  const eligible = !isAuthenticated || audience === "all"
    || (audience === "socios" && isSocio)
    || (audience === "fans" && role !== "creator" && role !== "admin");
  const audienceLabel = audience === "socios" ? "Solo para socios" : audience === "fans" ? "Solo para fans" : "";
  const blocked = finished || (!eligible);
  const joinLabel = finished
    ? (raffle?.winnerName ? `🏆 Ganó: ${raffle.winnerName}` : "🏁 Sorteo finalizado")
    : !eligible ? `🔒 ${audienceLabel}`
    : hasEntered ? "✓ Ya participas en este sorteo" : joining ? "Participando..." : `🎟 Participar — ⚡ ${ticketCost} créditos`;
  const joinBtnStyle: React.CSSProperties = blocked
    ? { width: "100%", background: "rgba(255,255,255,0.06)", color: "var(--color-muted)", border: "1px solid rgba(255,255,255,0.12)", padding: "12px", borderRadius: "9px", fontSize: "12px", fontWeight: 800, cursor: "default", fontFamily: "'DM Sans', sans-serif" }
    : { width: "100%", background: hasEntered ? "rgba(34,197,94,0.15)" : "var(--color-accent)", color: hasEntered ? "#22C55E" : "var(--color-black)", border: hasEntered ? "1px solid rgba(34,197,94,0.4)" : "none", padding: "12px", borderRadius: "9px", fontSize: "12px", fontWeight: 800, cursor: hasEntered || joining ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: joining ? 0.7 : 1 };
  const badgeLabel = finished ? "🏁 SORTEO FINALIZADO" : "🎁 SORTEO ACTIVO";
  const badgeColor = finished ? "#22C55E" : "var(--color-accent)";

  if (authLoading || (isAuthenticated && !raffle)) {
    return (
      <div>
        <Sec left="Sorteo del mes" />
        <div style={{ background: "linear-gradient(135deg,#1a1a10,#252515)", border: "1px solid #F0E04030", borderRadius: "10px", padding: "14px" }}>
          <Skel w={90} h={9} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <Skel w={52} h={52} r={10} />
            <div style={{ flex: 1 }}>
              <Skel w="60%" h={14} style={{ marginBottom: 6 }} />
              <Skel w="40%" h={11} />
            </div>
          </div>
          <Skel h={40} r={9} style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Sec left="Sorteo del mes" />
      <div style={{ background: "linear-gradient(135deg,#1a1a10,#252515)", border: "1px solid #F0E04030", borderRadius: "10px", padding: "14px" }}>
        <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "2px", color: badgeColor, marginBottom: "10px" }}>{badgeLabel}</div>
        {/* Clickable info area → opens detail */}
        <div
          onClick={() => raffle && setDetailOpen(true)}
          style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px", cursor: raffle ? "pointer" : "default" }}
        >
          <PrizeImage size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 900, marginBottom: "2px" }}>{title}</div>
            {typeof prizeValue === "number" && <div style={{ fontSize: "11px", color: "var(--color-muted)", marginBottom: "4px" }}>🏆 Valorado en {Number(prizeValue).toLocaleString("es")}€</div>}
            <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>⚡ {ticketCost} · {participants} participantes</div>
          </div>
          {raffle && <span style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>Ver detalle ›</span>}
        </div>
        <button onClick={handleJoin} disabled={hasEntered || joining || blocked} style={joinBtnStyle}>{joinLabel}</button>
      </div>

      {/* Detail modal */}
      {detailOpen && raffle && (
        <div
          onClick={(e) => e.target === e.currentTarget && setDetailOpen(false)}
          className="fixed inset-0 z-[200] flex items-end justify-center lg:items-center"
          style={{ background: "rgba(0,0,0,0.8)", padding: 0 }}
        >
          <div className="w-full rounded-t-2xl lg:rounded-2xl" style={{ background: "#161611", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", border: "1px solid #F0E04030" }}>
            <div className="lg:hidden" style={{ width: 36, height: 4, background: "#444", borderRadius: 2, margin: "12px auto 0" }} />
            {/* Prize image — large */}
            <div style={{ padding: "14px 16px 0" }}>
              <div style={{ width: "100%", height: 200, borderRadius: 12, background: "#2a2a20", border: "1px solid #F0E04030", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>
                {raffle.prizeImageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={raffle.prizeImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : "🏀"}
              </div>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, color: badgeColor, marginBottom: 8 }}>{badgeLabel}</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{title}</div>
              {raffle.description && <p style={{ fontSize: 13, lineHeight: 1.6, color: "#bbb", margin: "0 0 16px" }}>{raffle.description}</p>}
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {typeof prizeValue === "number" && (
                  <div style={{ background: "#221", borderRadius: 10, padding: "12px" }}>
                    <div style={{ fontSize: 10, color: "var(--color-muted)", marginBottom: 3 }}>🏆 Valor del premio</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{Number(prizeValue).toLocaleString("es")}€</div>
                  </div>
                )}
                <div style={{ background: "#221", borderRadius: 10, padding: "12px" }}>
                  <div style={{ fontSize: 10, color: "var(--color-muted)", marginBottom: 3 }}>⚡ Coste de entrada</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{ticketCost} créditos</div>
                </div>
                <div style={{ background: "#221", borderRadius: 10, padding: "12px" }}>
                  <div style={{ fontSize: 10, color: "var(--color-muted)", marginBottom: 3 }}>👥 Participantes</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{participants}</div>
                </div>
                {drawDateLabel && (
                  <div style={{ background: "#221", borderRadius: 10, padding: "12px" }}>
                    <div style={{ fontSize: 10, color: "var(--color-muted)", marginBottom: 3 }}>📅 Fecha del sorteo</div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{drawDateLabel}</div>
                  </div>
                )}
              </div>
              <button onClick={handleJoin} disabled={hasEntered || joining || blocked} style={joinBtnStyle}>{joinLabel}</button>
              <button onClick={() => setDetailOpen(false)} style={{ width: "100%", background: "transparent", border: "none", color: "var(--color-muted)", padding: "12px", fontSize: 12, cursor: "pointer", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// HOME SCREEN
// ==========================================
export default function HomeScreen() {
  return (
    <div className="home-screen" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px", paddingBottom: "20px" }}>
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
