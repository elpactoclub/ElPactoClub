"use client";

import { useState } from "react";
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
}

// Global event data shared from EventsScreen
let selectedEvent: EventData | null = null;
export function setSelectedEvent(e: EventData | null) { selectedEvent = e; }
export function getSelectedEvent() { return selectedEvent; }

type EventTab = "info" | "chat" | "votar";

export default function EventPageModal() {
  const { isEventPageOpen, closeEventPage, showToast } = useUIStore();
  const { isAuthenticated, addXP, spendCredits } = useUserStore();
  const [tab, setTab] = useState<EventTab>("info");
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { user: "Herson", text: "¡Os esperamos a todos en Vilanova! 🏀", creator: true },
    { user: "BasketQueen", text: "¡Cuento los días! 🔥", creator: false },
    { user: "MikelFan23", text: "¿Hay parking cerca del recinto?", creator: false },
  ]);

  if (!isEventPageOpen) return null;

  const ev = selectedEvent;
  if (!ev) return null;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    if (!isAuthenticated) { showToast("Inicia sesión para chatear ⚡"); return; }
    setChatMsgs([...chatMsgs, { user: "Tú", text: chatInput.trim(), creator: false }]);
    addXP(1);
    setChatInput("");
  };

  const handleRegister = async () => {
    if (isAuthenticated) {
      try {
        if (ev.creditsCost > 0 && !spendCredits(ev.creditsCost)) {
          showToast("Necesitas más créditos ⚡"); return;
        }
        await api.post(`/events/${ev.id}/register`);
        addXP(25);
        showToast("¡Plaza reservada! 🏀 · +25 XP");
        closeEventPage();
      } catch {
        showToast("Error al reservar plaza ❌");
      }
    } else {
      if (ev.creditsCost > 0 && !spendCredits(ev.creditsCost)) {
        showToast(`Necesitas ${ev.creditsCost} créditos ⚡`); return;
      }
      addXP(25);
      showToast("¡Plaza reservada! 🏀 · +25 XP");
      closeEventPage();
    }
  };

  const eventDate = ev.date ? new Date(ev.date) : null;
  const dateStr = eventDate
    ? eventDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const timeStr = eventDate
    ? eventDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="fixed inset-0 bg-[#000c] z-[300] flex flex-col" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Hero Banner */}
      <div className="relative h-[200px] bg-gradient-to-br from-black to-[#1a1a10] flex-shrink-0">
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="absolute -top-10 -right-10 w-[180px] h-[180px] rounded-full bg-accent opacity-[0.07]" />
          <div className="text-[8px] font-bold tracking-[2px] text-accent bg-accent/10 border border-accent/30 px-2 py-[2px] rounded-xl w-fit mb-2">
            {ev.type === "tour" ? "🏀 TOUR 3x3" : ev.type === "charla" ? "🎙 CHARLA EXCLUSIVA" : "📅 EVENTO"}
          </div>
          <div className="font-heading text-[28px] tracking-[2px] text-white leading-tight">{ev.title}</div>
          <div className="text-[11px] text-muted mt-1">📍 {ev.location} · {ev.city}</div>
        </div>
        <button
          onClick={closeEventPage}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white border-none cursor-pointer text-sm"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0 bg-gray">
        {(["info", "chat", "votar"] as EventTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[11px] font-semibold cursor-pointer border-b-2 transition-colors bg-transparent capitalize ${
              tab === t ? "text-white border-accent" : "text-muted border-transparent"
            }`}
          >
            {t === "info" ? "Info" : t === "chat" ? "💬 Chat" : "🗳 Votar"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray">
        {tab === "info" && (
          <div className="p-4 flex flex-col gap-3">
            {/* Date & location */}
            <div className="bg-gray2 rounded-xl p-3 flex flex-col gap-2">
              {dateStr && (
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="text-base">📅</span>
                  <span className="font-bold capitalize">{dateStr}</span>
                  {timeStr && <span className="text-muted">· {timeStr}h</span>}
                </div>
              )}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-base">📍</span>
                <span>{ev.location}</span>
                <span className="text-muted">· {ev.city}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-base">👥</span>
                <span>{ev.attendeesCount} inscritos</span>
                {ev.maxAttendees && <span className="text-muted">· {ev.maxAttendees - ev.attendeesCount} plazas disponibles</span>}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-1">Sobre el evento</div>
              <div className="text-[12px] text-[#ccc] leading-relaxed">{ev.description || "Únete al club en este evento especial."}</div>
            </div>

            {/* Creators */}
            {ev.type === "charla" && (
              <div className="bg-gray2 rounded-xl p-3">
                <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2">Presentado por</div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-sm font-bold text-accent">H</div>
                  <div>
                    <div className="text-[12px] font-bold">Herson</div>
                    <div className="text-[10px] text-muted">Capitán · Creador</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto flex flex-col gap-[6px] px-4 py-3">
              {chatMsgs.map((m, i) => {
                const isMe = m.user === "Tú";
                return (
                  <div key={i} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className="w-[22px] h-[22px] rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: m.creator ? "#22C55E22" : "#60A5FA22", color: m.creator ? "#22C55E" : "#60A5FA" }}>
                      {m.user[0]}
                    </div>
                    <div className={`max-w-[75%] rounded-lg px-[9px] py-[6px] text-[11px] ${isMe ? "bg-accent text-black" : "bg-gray2"}`} style={m.creator && !isMe ? { borderLeft: "2px solid #22C55E", paddingLeft: "7px" } : {}}>
                      {!isMe && <div className="text-[9px] font-bold mb-[2px]" style={{ color: m.creator ? "#22C55E" : "#aaa" }}>{m.user}{m.creator && " · CREADOR"}</div>}
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-border">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Escribe algo..." className="flex-1 bg-gray2 border border-border2 rounded-lg px-3 py-2 text-[11px] text-white font-sans outline-none" />
              <button onClick={sendChat} className="bg-accent text-black border-none px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer">Enviar</button>
            </div>
          </div>
        )}

        {tab === "votar" && (
          <div className="p-4">
            <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-3">Decisiones del evento</div>
            {[
              { q: "¿Qué música quieres en el evento?", opts: ["Reggaeton 🎵", "Hip-Hop 🎤", "Electrónica ⚡"] },
              { q: "¿Formato preferido de competición?", opts: ["3x3 rápido", "5x5 clásico", "Skills challenge"] },
            ].map((poll, pi) => (
              <div key={pi} className="bg-gray2 rounded-xl p-3 mb-3">
                <div className="text-[12px] font-bold mb-2">{poll.q}</div>
                {poll.opts.map((opt) => (
                  <button key={opt} onClick={() => showToast(`¡Votaste: ${opt}! +5 XP`)} className="w-full text-left px-3 py-2 bg-gray3 border border-border rounded-lg text-[11px] mb-1 cursor-pointer hover:border-accent transition-colors">{opt}</button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-3 border-t border-border bg-gray flex-shrink-0">
        <button onClick={handleRegister} className="w-full bg-accent text-black font-heading text-sm py-3 rounded-xl tracking-[1px]">
          {ev.creditsCost > 0 ? `RESERVAR PLAZA · ⚡${ev.creditsCost}` : "APUNTARME AL EVENTO →"}
        </button>
      </div>
    </div>
  );
}
