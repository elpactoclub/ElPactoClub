"use client";

// EN: Creator messages page showing the creator's DM inbox with fans and allowing replies from within the creator panel.
// ES: Página de mensajes del creador que muestra el buzón de DMs con fans y permite responder desde el panel del creador.

import { useEffect, useState, useCallback } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface Conversation {
  partnerId: string;
  name: string;
  avatar: string;
  role?: string;
  isCreator?: boolean;
  lastMsg?: string;
  lastMsgIsMe?: boolean;
  time?: string;
  unread?: boolean;
}

interface ThreadMsg {
  id: string;
  content: string;
  isMe: boolean;
  createdAt: string;
}

const COLORS = ["#22C55E", "#60A5FA", "#A78BFA", "#F472B6", "#F59E0B", "#34D399"];
function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "");
}
function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

// EN: Creator messages page component managing conversations list and individual thread views with send functionality.
// ES: Componente de página de mensajes del creador que gestiona la lista de conversaciones y vistas de hilos individuales con funcionalidad de envío.
export default function CreatorMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/dm/conversations`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        // Solo mostrar fans (no otros creadores ni admins)
        const fans = (Array.isArray(data) ? data : []).filter(
          (c) => c.role !== "creator" && c.role !== "admin"
        );
        setConversations(fans);
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openThread = async (c: Conversation) => {
    setActiveId(c.partnerId);
    setPartner(c);
    try {
      const r = await fetch(`${API}/dm/thread/${c.partnerId}`, { headers: authHeader() });
      const data = await r.json();
      setThread(data.messages ?? []);
    } catch {
      setThread([]);
    }
  };

  const send = async () => {
    const content = reply.trim();
    if (!content || !partner) return;
    setReply("");
    try {
      const r = await fetch(`${API}/dm/send`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: partner.partnerId, content }),
      });
      const msg = await r.json();
      if (r.ok) setThread((prev) => [...prev, msg]);
    } catch { /* noop */ }
  };

  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">MENSAJES DE FANS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({conversations.length})</span></h1>
        {unreadCount > 0 && <span className="admin-badge admin-badge-purple" style={{ fontSize: 11 }}>{unreadCount} sin leer</span>}
      </div>

      <div className="admin-card creator-dm-grid" style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 480 }}>
        {/* Lista */}
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto" }}>
          {loading && <div style={{ padding: 24, textAlign: "center", color: "#666", fontSize: 13 }}>Cargando...</div>}
          {!loading && conversations.length === 0 && (
            <div style={{ padding: 28, textAlign: "center", color: "#666", fontSize: 13 }}>Aún no has recibido mensajes de fans.</div>
          )}
          {conversations.map((c) => {
            const isActive = activeId === c.partnerId;
            return (
              <button
                key={c.partnerId}
                onClick={() => openThread(c)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", background: isActive ? "rgba(167,139,250,0.08)" : "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: colorFor(c.partnerId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: c.unread ? 700 : 500, color: "#fff" }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: "#666" }}>{timeAgo(c.time)}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                    {c.lastMsgIsMe && <span style={{ color: "#777" }}>Tú: </span>}{c.lastMsg}
                  </div>
                </div>
                {c.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#A78BFA", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {/* Thread */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!partner ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 13.5, padding: 40, textAlign: "center" }}>
              Selecciona una conversación para verla
            </div>
          ) : (
            <>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: colorFor(partner.partnerId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {initials(partner.name)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{partner.name}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>Fan · Mensaje privado</div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {thread.length === 0 && <div style={{ textAlign: "center", color: "#666", fontSize: 12, marginTop: 20 }}>Sin mensajes aún</div>}
                {thread.map((m) => (
                  <div key={m.id} style={{ display: "flex", flexDirection: m.isMe ? "row-reverse" : "row", gap: 8 }}>
                    <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.4, background: m.isMe ? "linear-gradient(135deg, #A78BFA, #EC4899)" : "#1a1a1a", color: "#fff" }}>
                      {m.content}
                      <div style={{ fontSize: 9, marginTop: 4, color: m.isMe ? "rgba(255,255,255,0.6)" : "#666" }}>{timeAgo(m.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 20px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={`Responder a ${partner.name}...`}
                  className="admin-input"
                  style={{ flex: 1 }}
                />
                <button onClick={send} className="admin-btn-primary" style={{ background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "#fff" }} disabled={!reply.trim()}>
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .creator-dm-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
