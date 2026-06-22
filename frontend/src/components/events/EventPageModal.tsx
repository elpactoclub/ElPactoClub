"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

interface EventData {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  location: string;
  city: string;
  creditsCost: number;
  maxAttendees?: number;
  attendeesCount: number;
  imageUrl?: string;
  bannerUrl?: string;
  polls?: { question: string; options: string[] }[];
}

// Global event data shared from EventsScreen
let selectedEvent: EventData | null = null;
export function setSelectedEvent(e: EventData | null) { selectedEvent = e; }
export function getSelectedEvent() { return selectedEvent; }

type EventTab = "info" | "chat" | "votar";

export default function EventPageModal() {
  const { isEventPageOpen, closeEventPage, showToast, openAuth, setTab } = useUIStore();
  const { isAuthenticated, addXP, spendCredits } = useUserStore();
  const [activeTab, setActiveTab] = useState<EventTab>("info");
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { user: "Herson", text: "¡Os esperamos a todos en Vilanova! 🏀", creator: true },
    { user: "BasketQueen", text: "¡Cuento los días! 🔥", creator: false },
    { user: "MikelFan23", text: "¿Hay parking cerca del recinto?", creator: false },
  ]);
  const [registered, setRegistered] = useState(false);
  const [pollVotes, setPollVotes] = useState<Record<number, { counts: Record<string, number>; myVote?: string }>>({});

  useEffect(() => {
    if (!isEventPageOpen) { setPollVotes({}); return; }
    const e = getSelectedEvent();
    if (!e || !isAuthenticated) { setRegistered(false); return; }
    api.get(`/events/${e.id}/registered`)
      .then((r) => setRegistered(!!r.data?.registered))
      .catch(() => setRegistered(false));
  }, [isEventPageOpen, isAuthenticated]);

  useEffect(() => {
    if (activeTab !== "votar" || !isEventPageOpen) return;
    const e = getSelectedEvent();
    if (!e) return;
    api.get(`/events/${e.id}/votes`)
      .then((r) => setPollVotes(r.data ?? {}))
      .catch(() => {});
  }, [activeTab, isEventPageOpen]);

  if (!isEventPageOpen) return null;

  const ev = selectedEvent;
  if (!ev) return null;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    if (!isAuthenticated) { openAuth(); return; }
    if (selectedEvent?.type === "charla" && !registered) { showToast("Reserva tu plaza para participar en la charla"); return; }
    setChatMsgs([...chatMsgs, { user: "Tú", text: chatInput.trim(), creator: false }]);
    addXP(1);
    setChatInput("");
  };

  const handleRegister = async () => {
    if (!isAuthenticated) { openAuth(); return; }
    try {
      await api.post(`/events/${ev.id}/register`);
      if (ev.creditsCost > 0) spendCredits(ev.creditsCost);
      addXP(25);
      setRegistered(true);
      showToast("¡Plaza reservada! 🏀 · +25 XP");
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 409) { setRegistered(true); showToast("Ya estás inscrito en este evento ✓"); }
      else if (status === 400 && typeof msg === "string" && msg.includes("plazas")) showToast("No quedan plazas ❌");
      else if (status === 400) { showToast("Necesitas más créditos ⚡"); closeEventPage(); setTab("store"); }
      else showToast("Error al reservar plaza ❌");
    }
  };

  const castVote = async (pollIndex: number, option: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    try {
      await api.post(`/events/${ev.id}/vote`, { pollIndex, option });
      showToast(`¡Votaste: ${option}! +5 XP`);
      addXP(5);
      setPollVotes((prev) => {
        const poll = prev[pollIndex] ?? { counts: {} };
        const newCounts = { ...poll.counts };
        if (poll.myVote) newCounts[poll.myVote] = Math.max(0, (newCounts[poll.myVote] ?? 0) - 1);
        newCounts[option] = (newCounts[option] ?? 0) + 1;
        return { ...prev, [pollIndex]: { counts: newCounts, myVote: option } };
      });
    } catch { showToast("Error al votar ❌"); }
  };

  // En charlas solo participan (chat/voto) quienes reservaron plaza
  const locked = ev.type === "charla" && !registered;

  const eventDate = ev.date ? new Date(ev.date) : null;
  const dateStr = eventDate
    ? eventDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const timeStr = eventDate
    ? eventDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    /* Overlay — full screen, centrado en desktop */
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center lg:items-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && closeEventPage()}
    >
      {/* Modal */}
      <div
        className="flex flex-col w-full lg:rounded-2xl overflow-hidden"
        style={{
          maxWidth: 680,
          height: "92vh",
          background: "#1a1a1a",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Hero Banner */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 180, background: "linear-gradient(135deg, #0d0d08, #1a1a10)" }}>
          {/* Imagen de portada (banner) — o la pequeña como respaldo */}
          {(ev.bannerUrl || ev.imageUrl) && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ev.bannerUrl || ev.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)" }} />
            </>
          )}
          {/* Decorations — clipped inside */}
          <div className="absolute top-[-30px] right-[-30px] w-[160px] h-[160px] rounded-full" style={{ background: "var(--color-accent)", opacity: 0.06 }} />
          <div className="absolute bottom-[-20px] left-[-20px] w-[100px] h-[100px] rounded-full" style={{ background: "var(--color-accent)", opacity: 0.04 }} />

          <div className="absolute inset-0 flex flex-col justify-end p-5">
            <div className="text-[8px] font-bold tracking-[2px] w-fit mb-2 px-2 py-[2px] rounded-xl" style={{ color: "var(--color-accent)", background: "rgba(240,224,64,0.1)", border: "1px solid rgba(240,224,64,0.3)" }}>
              {ev.type === "tour" ? "🏀 TOUR 3x3" : ev.type === "charla" ? "🎙 CHARLA EXCLUSIVA" : "📅 EVENTO"}
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, letterSpacing: 2, lineHeight: 1.1 }}>{ev.title}</div>
            <div className="text-[11px] mt-1" style={{ color: "var(--color-muted)" }}>📍 {ev.location} · {ev.city}</div>
          </div>
          <button
            onClick={closeEventPage}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white border-none cursor-pointer text-sm"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-gray)" }}>
          {(["info", "chat", "votar"] as EventTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1, padding: "13px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: "transparent", border: "none", fontFamily: "inherit",
                borderBottom: `2px solid ${activeTab === t ? "var(--color-accent)" : "transparent"}`,
                color: activeTab === t ? "#fff" : "var(--color-muted)",
                transition: "color 0.15s",
              }}
            >
              {t === "info" ? "Info" : t === "chat" ? "💬 Chat" : "🗳 Votar"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ background: "var(--color-gray)" }}>
          {activeTab === "info" && (
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "var(--color-gray2)", borderRadius: 12, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {dateStr && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span>📅</span>
                    <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{dateStr}</span>
                    {timeStr && <span style={{ color: "var(--color-muted)" }}>· {timeStr}h</span>}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span>📍</span><span>{ev.location}</span><span style={{ color: "var(--color-muted)" }}>· {ev.city}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span>👥</span>
                  <span>{ev.attendeesCount} inscritos</span>
                  {ev.maxAttendees && <span style={{ color: "var(--color-muted)" }}>· {ev.maxAttendees - ev.attendeesCount} plazas disponibles</span>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 6 }}>Sobre el evento</div>
                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{ev.description || "Únete al club en este evento especial."}</div>
              </div>

              {ev.type === "charla" && (
                <div style={{ background: "var(--color-gray2)", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 10 }}>Presentado por</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(240,224,64,0.15)", border: "2px solid var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--color-accent)" }}>H</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Herson</div>
                      <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Capitán · Creador</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, padding: "12px 20px" }}>
                {chatMsgs.map((m, i) => {
                  const isMe = m.user === "Tú";
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: m.creator ? "#22C55E22" : "#60A5FA22", color: m.creator ? "#22C55E" : "#60A5FA" }}>
                        {m.user[0]}
                      </div>
                      <div style={{ maxWidth: "75%", borderRadius: 10, padding: "7px 10px", fontSize: 12, background: isMe ? "var(--color-accent)" : "var(--color-gray2)", color: isMe ? "#000" : "#ddd", ...(m.creator && !isMe ? { borderLeft: "2px solid #22C55E" } : {}) }}>
                        {!isMe && <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, color: m.creator ? "#22C55E" : "#aaa" }}>{m.user}{m.creator && " · CREADOR"}</div>}
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>
              {locked ? (
                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10, justifyContent: "center", color: "var(--color-muted)", fontSize: 12 }}>
                  🔒 Reserva tu plaza para escribir en el chat
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, padding: "12px 20px", borderTop: "1px solid var(--color-border)" }}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Escribe algo..."
                    style={{ flex: 1, background: "var(--color-gray2)", border: "1px solid var(--color-border2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fff", fontFamily: "inherit", outline: "none" }}
                  />
                  <button onClick={sendChat} style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Enviar</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "votar" && locked && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#888", marginBottom: 6 }}>Solo para inscritos</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>Reserva tu plaza para votar las decisiones de esta charla.</div>
            </div>
          )}

          {activeTab === "votar" && !locked && (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 14 }}>Decisiones del evento</div>
              {(!ev.polls || ev.polls.length === 0) && (
                <div style={{ padding: "32px 8px", textAlign: "center", color: "var(--color-muted)", fontSize: 12.5 }}>
                  Este evento todavía no tiene votaciones.
                </div>
              )}
              {(ev.polls ?? []).map((poll, pi) => {
                const pv = pollVotes[pi] ?? { counts: {} };
                const total = Object.values(pv.counts).reduce((s, n) => s + n, 0);
                return (
                  <div key={pi} style={{ background: "var(--color-gray2)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{poll.question}</div>
                    {poll.options.map((opt) => {
                      const count = pv.counts[opt] ?? 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const isMyVote = pv.myVote === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => castVote(pi, opt)}
                          style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: isMyVote ? "rgba(240,224,64,0.08)" : "var(--color-gray3)", border: `1px solid ${isMyVote ? "var(--color-accent)" : "var(--color-border)"}`, borderRadius: 9, fontSize: 12, marginBottom: 6, cursor: "pointer", color: isMyVote ? "var(--color-accent)" : "#ddd", fontFamily: "inherit", position: "relative", overflow: "hidden", transition: "all 0.15s" }}
                        >
                          {total > 0 && (
                            <div style={{ position: "absolute", inset: 0, background: isMyVote ? "rgba(240,224,64,0.07)" : "rgba(255,255,255,0.03)", width: `${pct}%`, transition: "width 0.4s" }} />
                          )}
                          <span style={{ position: "relative", zIndex: 1 }}>{opt}</span>
                          {total > 0 && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: isMyVote ? "var(--color-accent)" : "#666", fontWeight: 600 }}>{pct}%</span>}
                        </button>
                      );
                    })}
                    {total > 0 && <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 4 }}>{total} {total === 1 ? "voto" : "votos"}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--color-border)", background: "var(--color-gray)", flexShrink: 0 }}>
          <button
            onClick={registered ? undefined : handleRegister}
            disabled={registered}
            style={{ width: "100%", background: registered ? "rgba(34,197,94,0.15)" : "var(--color-accent)", color: registered ? "#22C55E" : "#000", fontFamily: "var(--font-heading)", fontSize: 14, padding: "14px", borderRadius: 12, border: registered ? "1px solid rgba(34,197,94,0.4)" : "none", cursor: registered ? "default" : "pointer", letterSpacing: 1 }}
          >
            {registered ? "✓ YA TIENES TU PLAZA" : ev.creditsCost > 0 ? `RESERVAR PLAZA · ⚡${ev.creditsCost}` : "APUNTARME AL EVENTO →"}
          </button>
        </div>
      </div>
    </div>
  );
}
