"use client";

import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

interface Conversation {
  partnerId: string;
  name: string;
  avatar: string;
  role: string;
  isCreator: boolean;
  lastMsg?: string;
  lastMsgIsMe?: boolean;
  time?: string;
  unread?: boolean;
  costPerMsg?: number;
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
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
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

export default function DMModal() {
  const { isDMOpen, closeDM, showToast, dmOpenWithCreator } = useUIStore();
  const { isAuthenticated, credits } = useUserStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const [convRes, creatorsRes] = await Promise.all([
        api.get("/dm/conversations"),
        api.get("/dm/creators"),
      ]);
      const convs: Conversation[] = convRes.data ?? [];
      const creators: Conversation[] = creatorsRes.data ?? [];
      const existingIds = new Set(convs.map((c) => c.partnerId));
      const extraCreators = creators.filter((c) => !existingIds.has(c.partnerId));
      const merged = [...convs, ...extraCreators];
      setConversations(merged);
      return merged;
    } catch {
      setConversations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDMOpen || !isAuthenticated) return;
    loadConversations().then((convs) => {
      if (dmOpenWithCreator) {
        const target = convs.find((c) => c.name.toLowerCase() === dmOpenWithCreator.toLowerCase());
        if (target) openThread(target);
        useUIStore.setState({ dmOpenWithCreator: null });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDMOpen, isAuthenticated]);

  const openThread = async (conv: Conversation) => {
    setActiveId(conv.partnerId);
    setPartner(conv);
    try {
      const r = await api.get(`/dm/thread/${conv.partnerId}`);
      setPartner({ ...conv, ...r.data.partner, partnerId: conv.partnerId });
      setThread(r.data.messages ?? []);
    } catch {
      setThread([]);
    }
  };

  const backToList = () => {
    setActiveId(null);
    setPartner(null);
    setThread([]);
    loadConversations();
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !partner) return;
    setInput("");
    try {
      const r = await api.post("/dm/send", { recipientId: partner.partnerId, content });
      setThread((prev) => [...prev, r.data]);
      if (r.data.chargedCredits) {
        useUserStore.setState((s) => ({ credits: s.credits - r.data.chargedCredits, xp: s.xp + (r.data.xpGained ?? 0) }));
        showToast(`−${r.data.chargedCredits} ⚡ · +${r.data.xpGained} XP · Mensaje enviado 📩`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      if (msg?.includes("credits") || msg?.includes("Insufficient")) showToast("Créditos insuficientes ❌");
      else if (msg?.includes("caracteres")) showToast(`Máximo 100 caracteres ❌`);
      else showToast("No se pudo enviar el mensaje ❌");
      setInput(content);
    }
  };

  if (!isDMOpen) return null;

  const isCreatorChat = !!partner?.isCreator;

  return (
    <div
      className="dm-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && (activeId ? backToList() : closeDM())}
    >
      <div className="dm-panel animate-slide-up" style={{ background: "#1c1c1c", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div className="dm-handle" style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "14px auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          {activeId && (
            <button onClick={backToList} style={{ width: 30, height: 30, borderRadius: "50%", background: "#2a2a2a", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0 }}>‹</button>
          )}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.5px", textTransform: partner ? "none" : "uppercase" }}>
              {partner ? partner.name : "Mensajes"}
            </div>
            {partner?.isCreator && (
              <div style={{ fontSize: 10, fontWeight: 700, color: colorFor(partner.partnerId) }}>CREADOR · ⚡{partner.costPerMsg ?? 50} por mensaje</div>
            )}
          </div>
          <button onClick={closeDM} style={{ width: 30, height: 30, borderRadius: "50%", background: "#2a2a2a", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>

        {/* No auth */}
        {!isAuthenticated && (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--color-muted)", fontSize: 13 }}>
            Inicia sesión para ver y enviar mensajes ⚡
          </div>
        )}

        {/* Conversation list */}
        {isAuthenticated && !activeId && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>Cargando...</div>}
            {!loading && conversations.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>No tienes conversaciones todavía.</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.partnerId}
                onClick={() => openThread(c)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: colorFor(c.partnerId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{c.name}{c.isCreator && <span style={{ fontSize: 9, color: colorFor(c.partnerId), marginLeft: 6 }}>CREADOR</span>}</span>
                    <span style={{ fontSize: 11, color: "var(--color-muted)", flexShrink: 0 }}>{timeAgo(c.time)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.lastMsg ? (<>{c.lastMsgIsMe && <span style={{ color: "#aaa" }}>Tú: </span>}{c.lastMsg}</>) : (c.isCreator ? `Escríbele · ⚡${c.costPerMsg ?? 50}/mensaje` : "Inicia la conversación")}
                  </div>
                </div>
                {c.unread && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-accent)", flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}

        {/* Thread */}
        {isAuthenticated && activeId && partner && (
          <>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "16px" }}>
              {thread.length === 0 && (
                <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-muted)", marginTop: 20 }}>No hay mensajes aún. ¡Escribe el primero!</div>
              )}
              {thread.map((m) => (
                <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: m.isMe ? "row-reverse" : "row" }}>
                  {!m.isMe && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: colorFor(partner.partnerId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                      {initials(partner.name)}
                    </div>
                  )}
                  <div style={{ maxWidth: "75%", borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.4, background: m.isMe ? "var(--color-accent)" : "#2a2a2a", color: m.isMe ? "#000" : "#fff" }}>
                    {m.content}
                    <div style={{ fontSize: 9, marginTop: 4, color: m.isMe ? "rgba(0,0,0,0.5)" : "var(--color-muted)" }}>{timeAgo(m.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>

            {isCreatorChat && (
              <div style={{ margin: "0 16px 8px", padding: "8px 14px", background: "#222", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 8, fontSize: 11, color: "var(--color-muted)", textAlign: "center" }}>
                ⚡ Cada mensaje cuesta <strong style={{ color: "var(--color-accent)" }}>{partner.costPerMsg ?? 50} créditos</strong> · Tienes {credits} ⚡
              </div>
            )}

            <div className="dm-input-wrap" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 16px 32px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              {isCreatorChat && (
                <div style={{ fontSize: 10, color: input.length >= 100 ? "#ef4444" : "var(--color-muted)", textAlign: "right" }}>{input.length}/100</div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  maxLength={isCreatorChat ? 100 : undefined}
                  placeholder={isCreatorChat ? `Escribe... (⚡${partner.costPerMsg ?? 50})` : "Escribe un mensaje..."}
                  style={{ flex: 1, background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#fff", fontFamily: "var(--font-body)", outline: "none" }}
                />
                <button onClick={sendMessage} style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}>Enviar</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
