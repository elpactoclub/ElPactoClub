"use client";

import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";
import Skel from "@/components/ui/Skel";
import { useAuthLoading } from "@/hooks/useAuthLoading";

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

export default function MessagesScreen() {
  const { showToast, setTab } = useUIStore();
  const { isAuthenticated, credits } = useUserStore();
  const authLoading = useAuthLoading();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);

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
      setConversations([...convs, ...creators.filter((c) => !existingIds.has(c.partnerId))]);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadConversations();
  }, [isAuthenticated, loadConversations]);

  const openThread = async (conv: Conversation) => {
    setActiveId(conv.partnerId);
    setPartner(conv);
    setThreadLoading(true);
    try {
      const r = await api.get(`/dm/thread/${conv.partnerId}`);
      setPartner({ ...conv, ...r.data.partner, partnerId: conv.partnerId });
      setThread(r.data.messages ?? []);
    } catch {
      setThread([]);
    } finally {
      setThreadLoading(false);
    }
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
      if (msg?.includes("credits") || msg?.includes("Insufficient")) { showToast("Necesitas más créditos ⚡"); setTab("store"); }
      else if (msg?.includes("caracteres")) showToast("Máximo 100 caracteres ❌");
      else showToast("No se pudo enviar el mensaje ❌");
      setInput(content);
    }
  };

  const isCreatorChat = !!partner?.isCreator;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        {activeId && (
          <button onClick={() => { setActiveId(null); setPartner(null); setThread([]); loadConversations(); }} style={{ width: 32, height: 32, borderRadius: "50%", background: "#2a2a2a", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 }}>‹</button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 2 }}>
            {partner ? partner.name.toUpperCase() : "MENSAJES"}
          </div>
          {partner?.isCreator && (
            <div style={{ fontSize: 10, fontWeight: 700, color: colorFor(partner.partnerId), marginTop: 2 }}>CREADOR · ⚡{partner.costPerMsg ?? 50} por mensaje</div>
          )}
        </div>
      </div>

      {authLoading ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Skel w={46} h={46} r={23} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <Skel w={120} h={13} r={4} />
                    <Skel w={28} h={11} r={4} />
                  </div>
                  <Skel w="60%" h={11} r={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Fake conversations — blurred */}
          {[
            { name: "Herson", preview: "¡Gracias por el apoyo! 🏀", time: "2m", color: "#22C55E", creator: true },
            { name: "Violeta Verano", preview: "Nos vemos en el próximo evento", time: "1h", color: "#F472B6", creator: true },
            { name: "Elvis Ude", preview: "¿Viste el último partido?", time: "3h", color: "#60A5FA", creator: true },
            { name: "BasketFan99", preview: "¡Gran temporada!", time: "1d", color: "#A78BFA", creator: false },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{c.name}{c.creator && <span style={{ fontSize: 9, color: c.color, marginLeft: 6 }}>CREADOR</span>}</span>
                  <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.preview}</div>
              </div>
            </div>
          ))}
          {/* Lock overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
            <div style={{ fontSize: 32 }}>✉️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Tus mensajes privados</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", textAlign: "center", maxWidth: 220 }}>Inicia sesión para hablar con creadores y otros fans</div>
            <button
              onClick={() => useUIStore.setState({ isAuthOpen: true } as any)}
              style={{ marginTop: 4, background: "var(--color-accent)", color: "#000", border: "none", padding: "11px 28px", borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Iniciar sesión →
            </button>
          </div>
        </div>
      ) : !activeId ? (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Skel w={46} h={46} r={23} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <Skel w={120} h={13} r={4} />
                      <Skel w={28} h={11} r={4} />
                    </div>
                    <Skel w="60%" h={11} r={4} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && conversations.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>No tienes conversaciones todavía.</div>
          )}
          {conversations.map((c) => (
            <button
              key={c.partnerId}
              onClick={() => openThread(c)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 20px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", textAlign: "left" }}
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
      ) : partner ? (
        <>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "20px" }}>
            {threadLoading && (
              <>
                {[
                  { isMe: false, w: 160 }, { isMe: true, w: 120 },
                  { isMe: false, w: 200 }, { isMe: false, w: 140 },
                  { isMe: true, w: 180 }, { isMe: true, w: 100 },
                ].map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, flexDirection: b.isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                    {!b.isMe && <Skel w={28} h={28} r={14} />}
                    <Skel w={b.w} h={38} r={12} />
                  </div>
                ))}
              </>
            )}
            {!threadLoading && thread.length === 0 && (
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-muted)", marginTop: 20 }}>No hay mensajes aún. ¡Escribe el primero!</div>
            )}
            {!threadLoading && thread.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: m.isMe ? "row-reverse" : "row" }}>
                {!m.isMe && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: colorFor(partner.partnerId), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                    {initials(partner.name)}
                  </div>
                )}
                <div style={{ maxWidth: "70%", borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.4, background: m.isMe ? "var(--color-accent)" : "#2a2a2a", color: m.isMe ? "#000" : "#fff" }}>
                  {m.content}
                  <div style={{ fontSize: 9, marginTop: 4, color: m.isMe ? "rgba(0,0,0,0.5)" : "var(--color-muted)" }}>{timeAgo(m.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>

          {isCreatorChat && (
            <div style={{ margin: "0 20px 10px", padding: "8px 14px", background: "#222", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 8, fontSize: 11, color: "var(--color-muted)", textAlign: "center", flexShrink: 0 }}>
              ⚡ Cada mensaje cuesta <strong style={{ color: "var(--color-accent)" }}>{partner.costPerMsg ?? 50} créditos</strong> · Tienes {credits} ⚡
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
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
              <button onClick={sendMessage} style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "12px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}>Enviar</button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
