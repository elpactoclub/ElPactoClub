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

export default function NotificationsScreen() {
  const { showToast, setNotifUnreadCount } = useUIStore();
  const { isAuthenticated } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get("/notifications/me")
      .then((r) => {
        const data: Notification[] = r.data ?? [];
        setNotifications(data);
        setNotifUnreadCount(data.filter((n) => !n.readAt).length);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, setNotifUnreadCount]);

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
    api.post("/notifications/read-all").catch(() => {});
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "var(--color-black)", zIndex: 5 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, letterSpacing: 2 }}>NOTIFICACIONES</div>
        {isAuthenticated && (
          <button onClick={markAllRead} style={{ background: "transparent", border: "none", color: "var(--color-accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Marcar todo leído
          </button>
        )}
      </div>

      {/* Unauthenticated — locked preview */}
      {!isAuthenticated && (
        <div style={{ position: "relative" }}>
          {STATIC_NOTIFS.map((n, i) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.new_vote;
            return (
              <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < STATIC_NOTIFS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", filter: "blur(3px)", pointerEvents: "none", userSelect: "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", flexShrink: 0 }} />
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: meta.initials ? 13 : 18, fontWeight: 900, color: meta.color, flexShrink: 0 }}>
                  {meta.initials ?? meta.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            );
          })}
          {/* Lock overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
            <div style={{ fontSize: 32 }}>🔔</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Activa tus notificaciones</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", textAlign: "center", maxWidth: 220 }}>Inicia sesión para recibir avisos de eventos, votos y más</div>
            <button
              onClick={() => useUIStore.setState({ isAuthOpen: true } as any)}
              style={{ marginTop: 4, background: "var(--color-accent)", color: "#000", border: "none", padding: "11px 28px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Iniciar sesión →
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && loading && (
        <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>Cargando...</div>
      )}
      {isAuthenticated && !loading && notifications.length === 0 && (
        <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>No hay notificaciones</div>
      )}

      {notifications.map((n, i) => {
        const meta = TYPE_META[n.type] ?? TYPE_META.new_vote;
        const isRead = !!n.readAt;
        return (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 20px", background: "transparent", border: "none", borderBottom: i < notifications.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isRead ? "transparent" : "var(--color-accent)", flexShrink: 0 }} />
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: meta.initials ? 13 : 18, fontWeight: 900, color: meta.color, flexShrink: 0 }}>
              {meta.initials ?? meta.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: isRead ? 400 : 600, color: "#fff", marginBottom: 2 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{n.body}</div>}
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
            </div>
          </button>
        );
      })}

      <div style={{ height: 32 }} />
    </div>
  );
}
