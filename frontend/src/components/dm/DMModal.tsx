"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";
import { getSocket } from "@/services/socket";

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
  const { isDMOpen, closeDM, showToast, setTab, dmOpenWithCreator, dmOpenWithUser } = useUIStore();
  const { isAuthenticated, credits } = useUserStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const activeIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentRef = useRef(false);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const [convRes, creatorsRes] = await Promise.all([
        api.get("/dm/conversations"),
        api.get("/dm/creators"),
      ]);
      const convs: Conversation[] = convRes.data ?? [];
      const creators: Conversation[] = creatorsRes.data ?? [];
      // Solo añadir creadores que ya tienen conversación iniciada
      const existingIds = new Set(convs.map((c) => c.partnerId));
      const creatorsWithConv = creators.filter((c) => existingIds.has(c.partnerId));
      // Enriquecer las conversaciones con datos de creador si aplica
      const merged = convs.map((conv) => {
        const creator = creatorsWithConv.find((c) => c.partnerId === conv.partnerId);
        return creator ? { ...conv, isCreator: true, costPerMsg: creator.costPerMsg } : conv;
      });
      setConversations(merged);
      return merged;
    } catch {
      setConversations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time: incoming DMs
  useEffect(() => {
    if (!isDMOpen || !isAuthenticated) return;
    let sock: ReturnType<typeof getSocket> | null = null;
    try {
      sock = getSocket();
      const handleTyping = (data: { senderId: string; isTyping: boolean }) => {
        if (data.senderId !== activeIdRef.current) return;
        setPartnerTyping(data.isTyping);
        if (data.isTyping) {
          // Auto-clear after 4s in case stop event is lost
          setTimeout(() => setPartnerTyping(false), 4000);
        }
      };
      sock.on("dm_typing", handleTyping);

      const handleDM = (dm: { id: string; content: string; senderId: string; senderName: string; createdAt: string }) => {
        // Append to active thread if it's from the current partner
        if (activeIdRef.current === dm.senderId) {
          setThread((prev) => {
            if (prev.some((m) => m.id === dm.id)) return prev;
            return [...prev, { id: dm.id, content: dm.content, isMe: false, createdAt: dm.createdAt }];
          });
          api.post(`/dm/read/${dm.senderId}`).catch(() => {});
        }
        // Update conversations list
        setConversations((prev) => {
          const exists = prev.some((c) => c.partnerId === dm.senderId);
          if (exists) {
            return prev.map((c) => c.partnerId === dm.senderId
              ? { ...c, lastMsg: dm.content, time: dm.createdAt, unread: activeIdRef.current !== dm.senderId }
              : c
            );
          }
          // New conversation: add it with minimal info
          return [{ partnerId: dm.senderId, name: dm.senderName, avatar: dm.senderName[0] ?? "?", role: "fan", isCreator: false, lastMsg: dm.content, time: dm.createdAt, unread: true }, ...prev];
        });
      };
      sock.on("new_dm", handleDM);
      return () => {
        sock?.off("dm_typing", handleTyping);
        sock?.off("new_dm", handleDM);
      };
    } catch {}
  }, [isDMOpen, isAuthenticated]);

  useEffect(() => {
    if (!isDMOpen || !isAuthenticated) return;

    const init = async () => {
      const convs = await loadConversations();

      // Abrir hilo directo con un usuario por id (fans, no solo creadores)
      if (dmOpenWithUser) {
        const u = dmOpenWithUser;
        useUIStore.setState({ dmOpenWithUser: null });
        const existing = convs.find((c) => c.partnerId === u.id);
        openThread(existing ?? {
          partnerId: u.id,
          name: u.name,
          avatar: u.avatar ?? (u.name[0] ?? "?"),
          role: u.role ?? "fan",
          isCreator: u.role === "creator",
        });
        return;
      }

      if (dmOpenWithCreator) {
        useUIStore.setState({ dmOpenWithCreator: null });
        // Buscar en conversaciones existentes primero
        let target = convs.find((c) => c.name.toLowerCase() === dmOpenWithCreator.toLowerCase());
        if (!target) {
          // Si no hay conversación previa, buscar en lista de creadores
          try {
            const r = await api.get("/dm/creators");
            const creators: Conversation[] = r.data ?? [];
            target = creators.find((c) => c.name.toLowerCase() === dmOpenWithCreator.toLowerCase());
          } catch {}
        }
        if (target) openThread(target);
      }
    };

    init();
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

  function emitTyping(isTyping: boolean) {
    if (!partner) return;
    try {
      getSocket().emit("dm_typing", { recipientId: partner.partnerId, isTyping });
    } catch {}
  }

  function handleInputChange(val: string) {
    setInput(val);
    if (!partner) return;
    if (!typingSentRef.current && val.length > 0) {
      typingSentRef.current = true;
      emitTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingSentRef.current = false;
      emitTyping(false);
    }, 2000);
    if (val.length === 0) {
      typingSentRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTyping(false);
    }
  }

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !partner) return;
    typingSentRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
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
      if (msg?.includes("credits") || msg?.includes("Insufficient")) { showToast("Necesitas más créditos ⚡"); closeDM(); setTab("store"); }
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
              <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--color-muted)", lineHeight: 1.6 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>Sin mensajes aún</div>
                <div>Abre el perfil de un fan o creador y toca <strong>Enviar mensaje</strong> para empezar una conversación</div>
              </div>
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
              {partnerTyping && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: colorFor(partner.partnerId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                    {initials(partner.name)}
                  </div>
                  <div style={{ background: "#2a2a2a", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: "0.18s" }} />
                    <span className="typing-dot" style={{ animationDelay: "0.36s" }} />
                  </div>
                </div>
              )}
            </div>
            <style>{`
              .typing-dot {
                display: inline-block;
                width: 7px; height: 7px;
                border-radius: 50%;
                background: #777;
                animation: typingBounce 0.8s ease-in-out infinite;
              }
              @keyframes typingBounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-5px); background: #aaa; }
              }
            `}</style>

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
                  onChange={(e) => handleInputChange(e.target.value)}
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
