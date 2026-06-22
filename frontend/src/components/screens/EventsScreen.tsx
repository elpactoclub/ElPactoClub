"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import Skel from "@/components/ui/Skel";
import { api } from "@/services/api";
import { setSelectedEvent } from "@/components/events/EventPageModal";

interface EventItem {
  id: string;
  title: string;
  description: string;
  type: "partido" | "charla" | "tour" | "sorteo" | "reto";
  date: string;
  location: string;
  city: string;
  creditsCost: number;
  maxAttendees?: number;
  attendeesCount: number;
  isActive: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  polls?: { question: string; options: string[] }[];
  // Extra display fields (static enrichment)
  speakerPhoto?: string;
  speakerName?: string;
  speakerRole?: string;
  speakerBadge?: string;
  speakerBadgeColor?: string;
  speakerInitials?: string;
  tourSubtitle?: string;
  hasBet?: boolean;
}

const STATIC_EVENTS: EventItem[] = [
  {
    id: "tour1", title: "MVP'S TOUR 3x3", description: "Q&A en directo", type: "tour",
    date: new Date("2025-07-01T18:00:00").toISOString(), location: "Vilanova", city: "Barcelona",
    creditsCost: 0, attendeesCount: 342, isActive: true,
    tourSubtitle: "4 paradas · Vilanova · Girona · Prat · Málaga", hasBet: true,
  },
  {
    id: "charla1", title: "Herson", description: "Q&A en directo · Pregúntale lo que quieras", type: "charla",
    date: new Date("2025-06-28T19:00:00").toISOString(), location: "Online", city: "Online",
    creditsCost: 50, maxAttendees: 50, attendeesCount: 36, isActive: true,
    speakerPhoto: "/imagenes/herson.jpg", speakerName: "Herson",
    speakerRole: "Q&A en directo · Pregúntale lo que quieras",
    speakerBadge: "CAPITÁN", speakerBadgeColor: "#22C55E",
  },
  {
    id: "charla2", title: "Imanol", description: '"La importancia de tecnificar"', type: "charla",
    date: new Date("2025-07-05T18:30:00").toISOString(), location: "Online", city: "Online",
    creditsCost: 50, maxAttendees: 60, attendeesCount: 29, isActive: true,
    speakerName: "Imanol", speakerInitials: "IM",
    speakerRole: '"La importancia de tecnificar"',
    speakerBadge: "ENTRENADOR", speakerBadgeColor: "#888",
  },
];

export default function EventsScreen() {
  const { showToast, openEventPage, openAuth, setTab } = useUIStore();
  const { isAuthenticated, addXP, spendCredits } = useUserStore();
  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">(
    () => (typeof Notification !== "undefined" && Notification.permission === "granted" ? "granted" : "idle")
  );
  const [notifEnabled, setNotifEnabled] = useState(() => {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem("el_pacto_notif_disabled") !== "true";
  });

  const handleActivateNotifications = async () => {
    if (typeof Notification === "undefined") {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone = (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
      if (isIOS && !isStandalone) {
        showToast("En iPhone: toca Compartir → 'Añadir a pantalla de inicio' y abre la app desde ahí para activar notificaciones 📲");
      } else {
        showToast("Tu navegador no soporta notificaciones");
      }
      return;
    }
    if (notifState === "denied") {
      showToast("Notificaciones bloqueadas — actívalas en ajustes del navegador");
      return;
    }
    if (notifState === "granted" && notifEnabled) {
      setNotifEnabled(false);
      localStorage.setItem("el_pacto_notif_disabled", "true");
      showToast("Notificaciones desactivadas 🔕");
      return;
    }
    if (notifState === "granted" && !notifEnabled) {
      setNotifEnabled(true);
      localStorage.setItem("el_pacto_notif_disabled", "false");
      showToast("Notificaciones activadas 🔔");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifState("granted");
      setNotifEnabled(true);
      localStorage.setItem("el_pacto_notif_disabled", "false");
      new Notification("El Pacto BC 🏀", {
        body: "Recibirás alertas de nuevos eventos antes que nadie.",
        icon: "/favicon.ico",
      });
      showToast("Notificaciones activadas 🔔");
    } else {
      setNotifState("denied");
      showToast("Notificaciones bloqueadas — actívalas en ajustes del navegador");
    }
  };
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"todos" | "partidos" | "charlas">("todos");

  useEffect(() => {
    api.get("/events")
      .then((res) => setEvents(res.data.length > 0 ? res.data : STATIC_EVENTS))
      .catch(() => setEvents(STATIC_EVENTS))
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (evt: EventItem) => {
    if (!isAuthenticated) { openAuth(); return; }
    try {
      await api.post(`/events/${evt.id}/register`);
      if (evt.creditsCost > 0) spendCredits(evt.creditsCost);
      addXP(25);
      showToast("¡Plaza reservada! 🏀 · +25 XP");
      const updated = await api.get("/events");
      setEvents(updated.data.length > 0 ? updated.data : STATIC_EVENTS);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 409) showToast("Ya estás inscrito en este evento ✓");
      else if (status === 400 && typeof msg === "string" && msg.includes("plazas")) showToast("No quedan plazas ❌");
      else if (status === 400) { showToast("Necesitas más créditos ⚡"); setTab("store"); }
      else showToast("Error al reservar plaza ❌");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
        {/* Header */}
        <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Skel w={220} h={22} style={{ marginBottom: 8 }} />
          <Skel w={180} h={12} r={4} />
        </div>
        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8 }}>
          <Skel w={64} h={36} r={20} />
          <Skel w={104} h={36} r={20} />
          <Skel w={90} h={36} r={20} />
        </div>
        {/* Featured tour card */}
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#111" }}>
          <div style={{ padding: "20px 20px 20px", minHeight: 155, background: "linear-gradient(135deg,#0d0d06,#141408)" }}>
            <Skel w={155} h={26} r={20} style={{ marginBottom: 22 }} />
            <Skel w={220} h={40} r={6} style={{ marginBottom: 8 }} />
            <Skel w={200} h={12} r={4} />
          </div>
          <div style={{ background: "#161610", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Skel w={72} h={28} r={20} />
            <Skel w={110} h={36} r={10} style={{ marginLeft: "auto" }} />
          </div>
        </div>
        {/* Charla cards */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "#1a1a1a", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Top */}
            <div style={{ display: "flex", gap: 14, padding: "16px 16px 14px", alignItems: "flex-start" }}>
              <Skel w={60} h={60} r={30} />
              <div style={{ flex: 1 }}>
                <Skel w="55%" h={15} style={{ marginBottom: 7 }} />
                <Skel w="40%" h={12} r={4} />
              </div>
              <div style={{ textAlign: "right" }}>
                <Skel w={44} h={18} r={4} style={{ marginBottom: 5 }} />
                <Skel w={60} h={12} r={4} />
              </div>
            </div>
            {/* Bottom */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Skel w={72} h={28} r={20} />
                <Skel w={72} h={28} r={20} />
              </div>
              <Skel w={110} h={36} r={10} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tourEvents = events.filter((e) => e.type === "tour");
  const charlaEvents = events.filter((e) => e.type === "charla");

  const fmt = (iso: string, part: "date" | "time") => {
    const d = new Date(iso);
    if (part === "date") return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + "h";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
      {/* Header */}
      <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, letterSpacing: 2, marginBottom: 4 }}>EVENTOS DEL CLUB</div>
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>Todo lo que pasa en El Pacto</div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto" }} className="hide-scrollbar">
        {([["todos", "Todos"], ["partidos", "🏀 Partidos"], ["charlas", "🎙 Charlas"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveFilter(id)}
            style={{ flexShrink: 0, padding: "9px 20px", borderRadius: 20, fontSize: 13, fontWeight: activeFilter === id ? 700 : 600, cursor: "pointer", fontFamily: "var(--font-body)", background: activeFilter === id ? "#fff" : "transparent", color: activeFilter === id ? "#000" : "var(--color-muted)", border: activeFilter === id ? "none" : "1px solid rgba(255,255,255,0.15)", transition: "all 0.15s" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PRÓXIMO — Tour */}
      {tourEvents.length > 0 && (activeFilter === "todos" || activeFilter === "partidos") && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 10, paddingLeft: 2 }}>● PRÓXIMO</div>

          {tourEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => { setSelectedEvent(evt); openEventPage(); }}
              style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "#111" }}
            >
              {/* Hero area */}
              <div style={{ position: "relative", padding: "20px 20px 16px", minHeight: 160, background: "linear-gradient(135deg, #0d0d06 0%, #141408 100%)", overflow: "hidden" }}>
                {/* Decorative blob */}
                <div style={{ position: "absolute", top: -20, right: -20, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, #2a2a10 0%, #1a1a08 50%, transparent 80%)", opacity: 0.9 }} />
                <div style={{ position: "absolute", top: 10, right: 20, width: 80, height: 80, borderRadius: "50%", background: "rgba(240,224,64,0.04)" }} />

                {/* Badge pill */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 12px", marginBottom: 24 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF6B1A", display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1px", color: "var(--color-accent)" }}>TOUR 3x3 · JUN-AGO 2025</span>
                </div>

                {/* Title */}
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 42, letterSpacing: 2, lineHeight: 1, color: "#fff", marginBottom: 6, position: "relative", zIndex: 1 }}>{evt.title}</div>
                <div style={{ fontSize: 12, color: "#888", position: "relative", zIndex: 1 }}>
                  {(evt as EventItem).tourSubtitle || evt.description}
                </div>
              </div>

              {/* Action row */}
              <div style={{ background: "#161610", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 11, color: "var(--color-muted)", background: "rgba(255,255,255,0.06)", padding: "5px 12px", borderRadius: 20, flexShrink: 0 }}>🕕 18:00h</span>
                {evt.hasBet && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", padding: "5px 12px", borderRadius: 20, flexShrink: 0 }}>Apuesta activa 🎲</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); openEventPage(); }}
                  style={{ marginLeft: "auto", background: "var(--color-accent)", color: "#000", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}
                >
                  Ver evento →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHARLAS EXCLUSIVAS */}
      {charlaEvents.length > 0 && (activeFilter === "todos" || activeFilter === "charlas") && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10, paddingLeft: 2 }}>CHARLAS EXCLUSIVAS</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {charlaEvents.map((evt) => {
              const spots = evt.maxAttendees ? evt.maxAttendees - evt.attendeesCount : null;
              const badgeColor = evt.speakerBadgeColor ?? "#888";
              return (
                <div
                  key={evt.id}
                  onClick={() => { setSelectedEvent(evt); openEventPage(); }}
                  style={{ background: "#1a1a1a", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
                >
                  {/* Top section */}
                  <div style={{ display: "flex", gap: 14, padding: "16px 16px 14px", alignItems: "flex-start" }}>
                    {/* Avatar — imagen subida por el admin tiene prioridad */}
                    {(evt.imageUrl || evt.speakerPhoto) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={evt.imageUrl || evt.speakerPhoto} alt={evt.speakerName ?? evt.title} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid rgba(240,224,64,0.3)", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#2a2a2a", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#aaa", flexShrink: 0 }}>
                        {evt.speakerInitials ?? (evt.speakerName ?? evt.title).slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{evt.speakerName ?? evt.title}</span>
                        {evt.speakerBadge && (
                          <span style={{ fontSize: 8, fontWeight: 900, background: badgeColor + "22", color: badgeColor, border: `1px solid ${badgeColor}44`, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.5px", flexShrink: 0 }}>
                            {evt.speakerBadge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#aaa", fontStyle: evt.speakerRole?.startsWith('"') ? "italic" : "normal" }}>
                        {evt.speakerRole ?? evt.description}
                      </div>
                    </div>

                    {/* Cost + spots */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-accent)" }}>⚡ {evt.creditsCost}</div>
                      {spots !== null && (
                        <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 3 }}>{spots} plazas</div>
                      )}
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--color-muted)", background: "#111", padding: "5px 12px", borderRadius: 20 }}>📅 {fmt(evt.date, "date")}</span>
                      <span style={{ fontSize: 11, color: "var(--color-muted)", background: "#111", padding: "5px 12px", borderRadius: 20 }}>🕕 {fmt(evt.date, "time")}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRegister(evt); }}
                      style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
                    >
                      Reservar plaza
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coming soon */}
      <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "32px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Más eventos en camino</div>
        <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 20, lineHeight: 1.5 }}>Activa las notificaciones para ser el primero en enterarte</div>
        <button
          onClick={handleActivateNotifications}
          style={{
            background: notifState === "granted" && notifEnabled ? "rgba(34,197,94,0.15)" : "transparent",
            border: `1px solid ${notifState === "granted" && notifEnabled ? "#22C55E" : notifState === "denied" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)"}`,
            color: notifState === "granted" && notifEnabled ? "#22C55E" : notifState === "denied" ? "var(--color-muted)" : "#fff",
            padding: "11px 24px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            cursor: notifState === "denied" ? "default" : "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          {notifState === "granted" && notifEnabled ? "Notificaciones activadas 🔔" : notifState === "denied" ? "Notificaciones bloqueadas" : "Activar notificaciones"}
        </button>
      </div>
    </div>
  );
}
