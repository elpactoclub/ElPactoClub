"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/services/api";

const tabs = [
  { id: "home" as const, icon: "🏠", label: "Inicio" },
  { id: "comunidad" as const, icon: "💬", label: "Comunidad" },
  { id: "eventos" as const, icon: "🏀", label: "Eventos" },
  { id: "store" as const, icon: "🛒", label: "Tienda" },
  { id: "about" as const, icon: "⚡", label: "El Pacto" },
];

export default function DesktopSidebar() {
  const { xp, credits, isAuthenticated } = useUserStore();
  const [dmUnread, setDmUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setDmUnread(0); return; }
    const fetchCount = () => api.get("/dm/unread-count").then((r) => setDmUnread(r.data?.count ?? 0)).catch(() => {});
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated]);
  const { activeTab, setTab, notifUnreadCount } = useUIStore();

  return (
    <aside
      className="hidden lg:flex"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 240,
        background: "var(--color-black)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        flexDirection: "column",
        padding: "20px 16px",
        zIndex: 90,
        gap: 16,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px", marginBottom: 4 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAACO0lEQVR4nO3XS6hNURzH8bMvysCACXkkrwwkjwEhA68RxcAjpJjoKqKYmhlwJ0wZUJIyMaCUQsoAA+UVV7jJRHlHiVzux2D/d3fdE0ndc/ZV6zs56/8/6/H7//f6r7V3o5HJZDKZTCaT+W8pWjUxBsxdFIVWrTXoNIsPX0cdWv6ZSig6cBKXMSZ8w+pV9xcqgRiNS/q5h2nx3/B6Vf6BShgm4U4I/4zn0X6JhWnfIUOS+XnoCcFvsRjjcDV8n7C5GvO7Wmk7SeY34kMI7cZUHMNtjMXpZEsdjDEdQyWICegMcTci62cTwd2Ygq7Ed7wSX0sQyWmzAx+xFQswE1dC5Bs8jfZrzMHeJIjzGNn2J5GIn2sgR3A/sV/EVroY9lcsx4akz/aYq32Frb9o16APvfFb8RDXo30LE5V3QsUWLMF3dNUZwLoQ1Nv0JB4q6+JM2D2YgUNJn31Yis50znYF0IEC0/AlBPUpL6+7YT9WFu7hsD9iPnYlQZxSHqftf83QXwer8S0EXVAemTfCrgp3T9g/sBJr8T6CG1FLACG+2krL8C5EXlMeo+fCrgp3fZL53Rhfi+hm9F9ks/EsBD7AZBxNRG/CCjzBtnRs7SRBTMDNEPwKs3AgCWI/RkTf+m/glGQ7jYpaoCzwRdipPE4XRZ+hkflmDPwWOJFkflXSZ1AzP6iZKIqirwqiKIpOvGk0GtMbjcaj8BdFUfwczDVbgvKOKJp9rVirpYWUnO/+q4/6TCaTyWQymUx7+AW0xYwoGY+mhwAAAABJRU5ErkJggg==" alt="El Pacto" style={{ width: 30, height: 30, objectFit: "contain" }} />
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 3, lineHeight: 1 }}>EL PACTO</div>
      </div>

      {/* Stats pill */}
      <button
        onClick={() => setTab("profile")}
        style={{
          background: "var(--color-gray2)",
          border: "1px solid rgba(255,255,255,0.12)",
          padding: "10px 14px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13, color: "#F0E040" }}>★</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{xp.toLocaleString()}</span>
        </div>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.16)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13, color: "var(--color-accent)" }}>⚡</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent)" }}>{credits}</span>
        </div>
      </button>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: active ? "rgba(240,224,64,0.08)" : "transparent",
                border: active ? "1px solid rgba(240,224,64,0.25)" : "1px solid transparent",
                color: active ? "var(--color-accent)" : "var(--color-white)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 800 : 600,
                fontFamily: "var(--font-sans)",
                position: "relative",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "comunidad" && (
                <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "var(--color-red)" }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />

      {/* Quick actions — abren como pantallas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {([
          { id: "notifications" as const, icon: "🔔", label: "Notificaciones", badge: notifUnreadCount > 0 ? (notifUnreadCount > 9 ? "9+" : String(notifUnreadCount)) : null, badgeBg: "#F59E0B", badgeColor: "#000" },
          { id: "messages" as const, icon: "✉️", label: "Mensajes", badge: dmUnread > 0 ? (dmUnread > 9 ? "9+" : String(dmUnread)) : null, badgeBg: "#EC4899", badgeColor: "#fff" },
        ]).map((q) => {
          const active = activeTab === q.id;
          return (
            <button
              key={q.id}
              onClick={() => setTab(q.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: active ? "rgba(240,224,64,0.08)" : "transparent",
                border: active ? "1px solid rgba(240,224,64,0.25)" : "1px solid transparent",
                color: active ? "var(--color-accent)" : "var(--color-white)",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                textAlign: "left",
                fontWeight: active ? 800 : 600,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{q.icon}</span>
              <span>{q.label}</span>
              {q.badge && (
                <div style={{ marginLeft: "auto", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: q.badgeBg, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", color: q.badgeColor }}>
                  {q.badge}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: profile */}
      <button
        onClick={() => setTab("profile")}
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          background: activeTab === "profile" ? "rgba(240,224,64,0.08)" : "var(--color-gray2)",
          border: activeTab === "profile" ? "1px solid rgba(240,224,64,0.25)" : "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          textAlign: "left",
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-gray3)", overflow: "hidden", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/imagenes/violeta.jpg" alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Mi perfil</div>
          <div style={{ fontSize: 10, color: "var(--color-muted)" }}>Ver carnet y stats</div>
        </div>
      </button>
    </aside>
  );
}
