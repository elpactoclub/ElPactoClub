"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

interface Notification {
  id: string;
  type: "post_creator" | "new_vote" | "bet_result" | "badge_unlock" | "mission_complete";
  title: string;
  body?: string;
  readAt: string | null;
  createdAt: string;
}

const TYPE_META: Record<string, { initials?: string; icon: string; bg: string; color: string }> = {
  post_creator:     { initials: "HE", icon: "",   bg: "#22C55E", color: "#fff" },
  new_vote:         { icon: "⚡",                  bg: "#F0E040", color: "#000" },
  bet_result:       { icon: "🎲",                  bg: "#A78BFA22", color: "#A78BFA" },
  badge_unlock:     { icon: "🏅",                  bg: "#60A5FA22", color: "#60A5FA" },
  mission_complete: { icon: "🎯",                  bg: "#F59E0B22", color: "#F59E0B" },
};

const STATIC_NOTIFS: Notification[] = [
  { id: "1", type: "post_creator", title: "Herson publicó en el feed",   readAt: null,   createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", type: "new_vote",     title: "Nueva decisión disponible",   readAt: null,   createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", type: "bet_result",   title: "Apuesta grupal activa",       readAt: null,   createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: "4", type: "badge_unlock", title: "Badge desbloqueado 👑",       readAt: "past", createdAt: new Date(Date.now() - 86400000).toISOString() },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return "Ayer";
}

export default function NotificationPanel() {
  const { isNotifOpen, closeNotif, showToast, setNotifUnreadCount } = useUIStore();
  const { isAuthenticated } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!isNotifOpen) return;
    if (!isAuthenticated) {
      setNotifications(STATIC_NOTIFS);
      setNotifUnreadCount(STATIC_NOTIFS.filter((n) => !n.readAt).length);
      return;
    }
    api.get("/notifications/me")
      .then((r) => {
        const data = r.data.length > 0 ? r.data : STATIC_NOTIFS;
        setNotifications(data);
        setNotifUnreadCount(data.filter((n: Notification) => !n.readAt).length);
      })
      .catch(() => { setNotifications(STATIC_NOTIFS); });
  }, [isNotifOpen, isAuthenticated]);

  if (!isNotifOpen) return null;

  const markRead = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n);
      setNotifUnreadCount(updated.filter((n) => !n.readAt).length);
      return updated;
    });
    try { await api.post(`/notifications/${id}/read`); } catch {}
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setNotifUnreadCount(0);
    showToast("Todas las notificaciones leídas ✓");
    closeNotif();
  };

  return (
    <div
      className="notif-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && closeNotif()}
    >
      <div className="notif-panel animate-slide-up" style={{ background: "#1c1c1c", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "75vh", overflowY: "auto" }}>
        {/* Handle (solo móvil) */}
        <div className="notif-handle" style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "14px auto 0" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Notificaciones</span>
          <button onClick={markAllRead} style={{ background: "transparent", border: "none", color: "var(--color-accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Marcar todo leído
          </button>
        </div>

        {/* Items */}
        {notifications.length === 0 && (
          <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>No hay notificaciones</div>
        )}

        {notifications.map((n, i) => {
          const meta = TYPE_META[n.type] ?? TYPE_META.new_vote;
          const isRead = !!n.readAt;
          return (
            <button
              key={n.id}
              onClick={() => { markRead(n.id); closeNotif(); }}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < notifications.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer", textAlign: "left" }}
            >
              {/* Unread dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: isRead ? "transparent" : "var(--color-accent)", flexShrink: 0 }} />

              {/* Icon circle */}
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: meta.initials ? 13 : 18, fontWeight: 900, color: meta.color, flexShrink: 0 }}>
                {meta.initials ?? meta.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: isRead ? 400 : 600, color: "#fff", marginBottom: 2 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{n.body}</div>}
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
              </div>
            </button>
          );
        })}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
