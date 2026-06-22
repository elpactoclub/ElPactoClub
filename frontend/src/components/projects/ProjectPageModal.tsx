"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

type ProjectTab = "info" | "chat" | "votar";

interface ChatMsg {
  id: string;
  userId: string;
  content: string;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  createdAt: string;
}

interface VoteOption {
  id: string;
  title: string;
  options: string[];
  results: Record<string, number>;
  creditsCost: number;
  xpReward: number;
}

export default function ProjectPageModal() {
  const { isProjectPageOpen, activeProject, closeProjectPage, showToast, openAuth, setTab } = useUIStore();
  const { isAuthenticated, addXP } = useUserStore();
  const [activeTab, setActiveTab] = useState<ProjectTab>("info");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [votes, setVotes] = useState<VoteOption[]>([]);
  const [voted, setVoted] = useState<Record<string, string>>({});

  const project = activeProject;
  const channel = project ? `project-${project.slug}` : "";

  useEffect(() => {
    if (!isProjectPageOpen || !project) return;
    api.get(`/community/messages?channel=${channel}`).then((r) => setChatMsgs(r.data)).catch(() => setChatMsgs([]));
    api.get("/gamification/votes").then((r) => {
      const list = (r.data || []).filter((v: any) => v.category === "decision");
      setVotes(list);
    }).catch(() => {});
  }, [isProjectPageOpen, project, channel]);

  if (!isProjectPageOpen || !project) return null;

  const handleClose = () => {
    setActiveTab("info");
    setChatInput("");
    closeProjectPage();
  };

  const handleDonate = async (amount: number) => {
    if (isAuthenticated) {
      try {
        await api.post("/donations", { projectId: project.slug, amount });
        addXP(amount);
        showToast(`¡Donación enviada! −${amount} ⚡ · +${amount} XP 🏀`);
      } catch {
        showToast("Necesitas más créditos ⚡"); closeProjectPage(); setTab("store");
      }
    } else {
      openAuth();
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    if (!isAuthenticated) { openAuth(); return; }
    try {
      const res = await api.post("/community/messages", { channel, content: chatInput.trim() });
      setChatMsgs((m) => [...m, res.data]);
      addXP(1);
      setChatInput("");
    } catch {
      showToast("Error al enviar mensaje");
    }
  };

  const handleVote = async (voteId: string, option: string, cost: number, xp: number) => {
    if (voted[voteId]) { showToast("Ya votaste"); return; }
    if (isAuthenticated) {
      try {
        await api.post(`/gamification/votes/${voteId}/cast`, { selectedOption: option });
        setVoted((v) => ({ ...v, [voteId]: option }));
        addXP(xp);
        showToast(`¡Voto registrado! +${xp} XP`);
      } catch (err: any) {
        const m = err?.response?.data?.message ?? "";
        if (m.includes("credits") || m.includes("Insufficient")) { showToast("Necesitas más créditos ⚡"); closeProjectPage(); setTab("store"); }
        else showToast("Error al votar ❌");
      }
    } else {
      openAuth();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] sm:flex sm:items-center sm:justify-center sm:p-6 sm:bg-black/70 sm:backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Panel — full screen on mobile, centered rounded card on desktop */}
      <div
        className="absolute inset-0 sm:static sm:w-[480px] sm:max-h-[88vh] sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--color-gray)" }}
      >
      {/* Header */}
      <div className="relative flex-shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {/* Banner image (si existe) */}
        {project.imageUrl && (
          <div className="relative h-28 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(20,20,20,0.92) 100%)" }} />
          </div>
        )}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white border-none cursor-pointer text-sm z-10"
        >
          ✕
        </button>
        {/* Título + emoji */}
        <div
          className="flex items-center gap-3 px-4 pb-4 relative"
          style={{ paddingTop: project.imageUrl ? 0 : 16, marginTop: project.imageUrl ? -26 : 0 }}
        >
          <div
            className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[28px] flex-shrink-0 overflow-hidden"
            style={{ background: project.color + "26", border: `1px solid ${project.color}66` }}
          >
            {project.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-bold tracking-[2px] px-2 py-[2px] rounded-xl w-fit mb-1 border" style={{ color: project.color, borderColor: project.color + "60", background: project.color + "15" }}>
              🌍 PROYECTO ACTIVO
            </div>
            <div className="font-heading text-[20px] tracking-[0.5px] text-white leading-tight" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title}</div>
            <div className="text-[11px] text-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0 bg-gray">
        {(["info", "chat", "votar"] as ProjectTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-[11px] font-semibold cursor-pointer border-b-2 transition-colors bg-transparent capitalize ${activeTab === t ? "text-white border-accent" : "text-muted border-transparent"}`}
          >
            {t === "info" ? "Info" : t === "chat" ? "💬 Chat" : "🗳 Votar"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray">
        {activeTab === "info" && (
          <div className="p-4 flex flex-col gap-3">
            <div>
              <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-1">Sobre el proyecto</div>
              <div className="text-[12px] text-[#ccc] leading-relaxed">{project.description}</div>
            </div>
            <div className="bg-gray2 rounded-xl p-3">
              <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2">Insignia al donar</div>
              <div className="text-[13px]">Tu primera donación desbloquea: <strong className="text-accent">{project.badgeLabel}</strong></div>
            </div>
            <div className="bg-gray2 rounded-xl p-3">
              <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2">Apoyar el proyecto</div>
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleDonate(amt)}
                    className="bg-accent text-black border-none py-3 rounded-xl text-[12px] font-extrabold cursor-pointer font-sans"
                  >
                    {amt} ⚡
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-muted text-center mt-2">+XP proporcional a cada donación</div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto flex flex-col gap-[6px] px-4 py-3">
              {chatMsgs.length === 0 && (
                <div className="text-center text-[11px] text-muted py-6">Aún no hay mensajes. ¡Sé el primero!</div>
              )}
              {chatMsgs.map((m) => (
                <div key={m.id} className="flex gap-2">
                  <div className="w-[22px] h-[22px] rounded-full flex-shrink-0 flex items-center justify-center text-[10px]" style={{ background: project.color + "22", color: project.color }}>
                    {m.userAvatar ?? "🏀"}
                  </div>
                  <div className="max-w-[75%] rounded-lg px-[9px] py-[6px] text-[11px] bg-gray2">
                    <div className="text-[9px] font-bold mb-[2px]" style={{ color: project.color }}>{m.userName ?? "Fan"}</div>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-border">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder={isAuthenticated ? "Escribe algo..." : "Inicia sesión para chatear"}
                disabled={!isAuthenticated}
                className="flex-1 bg-gray2 border border-border2 rounded-lg px-3 py-2 text-[11px] text-white font-sans outline-none disabled:opacity-50"
              />
              <button onClick={sendChat} disabled={!isAuthenticated} className="bg-accent text-black border-none px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-50">
                Enviar
              </button>
            </div>
          </div>
        )}

        {activeTab === "votar" && (
          <div className="p-4 flex flex-col gap-3">
            {votes.length === 0 && (
              <div className="bg-gray2 rounded-xl p-4 text-center text-[11px] text-muted">
                No hay decisiones activas para este proyecto. Sigue al club para nuevas votaciones.
              </div>
            )}
            {votes.map((v) => (
              <div key={v.id} className="bg-gray2 rounded-xl p-3">
                <div className="text-[12px] font-bold mb-2">{v.title}</div>
                {v.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleVote(v.id, opt, v.creditsCost, v.xpReward)}
                    className={`w-full text-left px-3 py-2 bg-gray3 border rounded-lg text-[11px] mb-1 cursor-pointer transition-colors ${voted[v.id] === opt ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`}
                  >
                    {voted[v.id] === opt ? "✓ " : ""}{opt}
                  </button>
                ))}
                <div className="text-[10px] text-muted mt-1">{v.creditsCost > 0 ? `${v.creditsCost} ⚡` : "GRATIS"} · +{v.xpReward} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
