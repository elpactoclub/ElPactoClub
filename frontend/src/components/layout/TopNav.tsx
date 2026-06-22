"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import { api } from "@/services/api";

export default function TopNav() {
  const { xp, credits, isAuthenticated, avatar, xpMultiplier, xpMultiplierExpiresAt } = useUserStore();
  const multiplierActive = xpMultiplier > 1 && !!xpMultiplierExpiresAt && new Date(xpMultiplierExpiresAt) > new Date();
  const { openProfile, toggleNotif, openDM, notifUnreadCount } = useUIStore();
  const [dmUnread, setDmUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setDmUnread(0); return; }
    const fetchCount = () => api.get("/dm/unread-count").then((r) => setDmUnread(r.data?.count ?? 0)).catch(() => {});
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  return (
    <nav
      style={{
        background: "var(--color-black)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        gap: "8px",
      }}
    >
      {/* Left - Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAACO0lEQVR4nO3XS6hNURzH8bMvysCACXkkrwwkjwEhA68RxcAjpJjoKqKYmhlwJ0wZUJIyMaCUQsoAA+UVV7jJRHlHiVzux2D/d3fdE0ndc/ZV6zs56/8/6/H7//f6r7V3o5HJZDKZTCaT+W8pWjUxBsxdFIVWrTXoNIsPX0cdWv6ZSig6cBKXMSZ8w+pV9xcqgRiNS/q5h2nx3/B6Vf6BShgm4U4I/4zn0X6JhWnfIUOS+XnoCcFvsRjjcDV8n7C5GvO7Wmk7SeY34kMI7cZUHMNtjMXpZEsdjDEdQyWICegMcTci62cTwd2Ygq7Ed7wSX0sQyWmzAx+xFQswE1dC5Bs8jfZrzMHeJIjzGNn2J5GIn2sgR3A/sV/EVroY9lcsx4akz/aYq32Frb9o16APvfFb8RDXo30LE5V3QsUWLMF3dNUZwLoQ1Nv0JB4q6+JM2D2YgUNJn31Yis50znYF0IEC0/AlBPUpL6+7YT9WFu7hsD9iPnYlQZxSHqftf83QXwer8S0EXVAemTfCrgp3T9g/sBJr8T6CG1FLACG+2krL8C5EXlMeo+fCrgp3fZL53Rhfi+hm9F9ks/EsBD7AZBxNRG/CCjzBtnRs7SRBTMDNEPwKs3AgCWI/RkTf+m/glGQ7jYpaoCzwRdipPE4XRZ+hkflmDPwWOJFkflXSZ1AzP6iZKIqirwqiKIpOvGk0GtMbjcaj8BdFUfwczDVbgvKOKJp9rVirpYWUnO/+q4/6TCaTyWQymUx7+AW0xYwoGY+mhwAAAABJRU5ErkJggg==" alt="El Pacto" style={{ width: "26px", height: "26px", objectFit: "contain" }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "17px", letterSpacing: "3px", lineHeight: 1 }}>EL PACTO</div>
      </div>

      {/* Right - Stats pill + Actions + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        {/* Stats pill */}
        <button
          onClick={openProfile}
          style={{
            background: "var(--color-gray2)",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "4px 11px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#F0E040", lineHeight: 1, letterSpacing: "0.5px", textTransform: "uppercase" }}>exp:</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{xp.toLocaleString()}</span>
          {multiplierActive && (
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#A78BFA", background: "rgba(167,139,250,0.15)", borderRadius: 4, padding: "1px 4px", lineHeight: 1 }}>
              {xpMultiplier}x XP
            </span>
          )}
          <span style={{ fontSize: "11px", color: "var(--color-accent)", lineHeight: 1, marginLeft: 2 }}>⚡</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)" }}>{credits}</span>
        </button>
        {/* Notifications */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleNotif(); }}
          style={{ position: "relative", cursor: "pointer", fontSize: "17px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none" }}
        >
          🔔
          {isAuthenticated && notifUnreadCount > 0 && (
            <div style={{ position: "absolute", top: "-3px", right: "-3px", width: "14px", height: "14px", borderRadius: "50%", background: "#F59E0B", fontSize: "7px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--color-black)", color: "#000" }}>
              {notifUnreadCount > 9 ? "9+" : notifUnreadCount}
            </div>
          )}
        </button>

        {/* DMs */}
        <button
          onClick={openDM}
          style={{ position: "relative", cursor: "pointer", fontSize: "17px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none" }}
        >
          ✉️
          {dmUnread > 0 && (
            <div style={{ position: "absolute", top: "-3px", right: "-3px", width: "14px", height: "14px", borderRadius: "50%", background: "#EC4899", fontSize: "7px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--color-black)", color: "#fff" }}>{dmUnread > 9 ? "9+" : dmUnread}</div>
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={openProfile}
          style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-gray3)", border: "2px solid rgba(255,255,255,0.20)", cursor: "pointer", overflow: "hidden", padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}
        >
          {avatar && avatar.length <= 2
            ? avatar
            : /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatar || "/imagenes/violeta.jpg"} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
          }
        </button>
      </div>
    </nav>
  );
}
