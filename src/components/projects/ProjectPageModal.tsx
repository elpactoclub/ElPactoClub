"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

type ProjectTab = "info" | "chat" | "votar";

interface ProjectMeta {
  id: "india" | "tecnificar";
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  badgeAt: string;
  description: string;
}

const PROJECTS: Record<string, ProjectMeta> = {
  india: {
    id: "india",
    emoji: "🇮🇳",
    title: "India · Dribble Academy",
    subtitle: "Llevamos el baloncesto a India",
    color: "#F59E0B",
    badgeAt: "Dribble Spirit 🇮🇳",
    description:
      "Colaboramos con la Fundación Dribble Academy para llevar el baloncesto a India. Equipo conjunto Dribble Academy El Pacto, formación de community manager local, material deportivo y colaboradores estratégicos. Cada crédito donado va directo a infraestructura básica: canchas, balones y becas de entrenamiento.",
  },
  tecnificar: {
    id: "tecnificar",
    emoji: "🎓",
    title: "Tecnificar",
    subtitle: "Becas para jóvenes con talento",
    color: "#A78BFA",
    badgeAt: "Mentor 🎓",
    description:
      "Becas de tecnificación para jóvenes jugadores con talento que no tienen recursos para acceder a formación de élite. Material deportivo, seguimiento, mentoría y colaboradores estratégicos. El club anuncia al primer becado en exclusiva si llegamos a la misión colectiva.",
  },
};

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
  const { isProjectPageOpen, projectId, closeProjectPage, showToast } = useUIStore();
  const { isAuthenticated, spendCredits, addXP } = useUserStore();
  const [tab, setTab] = useState<ProjectTab>("info");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [votes, setVotes] = useState<VoteOption[]>([]);
  const [voted, setVoted] = useState<Record<string, string>>({});

  const project = projectId ? PROJECTS[projectId] : null;
  const channel = projectId ? `project-${projectId}` : "";

  useEffect(() => {
    if (!isProjectPageOpen || !projectId) return;
    api.get(`/community/messages?channel=${channel}`).then((r) => setChatMsgs(r.data)).catch(() => setChatMsgs([]));
    api.get("/gamification/votes").then((r) => {
      const list = (r.data || []).filter((v: any) => v.category === "decision");
      setVotes(list);
    }).catch(() => {});
  }, [isProjectPageOpen, projectId, channel]);

  if (!isProjectPageOpen || !project) return null;

  const handleClose = () => {
    setTab("info");
    setChatInput("");
    closeProjectPage();
  };

  const handleDonate = async (amount: number) => {
    if (isAuthenticated) {
      try {
        await api.post("/donations", { projectId: project.id, amount });
        addXP(amount);
        showToast(`¡Donación enviada! −${amount} ⚡ · +${amount} XP 🏀`);
      } catch {
        showToast("Necesitas más créditos ⚡");
      }
    } else {
      if (!spendCredits(amount)) { showToast("Sin créditos suficientes"); return; }
      addXP(amount);
      showToast(`Donación local · −${amount} ⚡ · +${amount} XP`);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    if (!isAuthenticated) { showToast("Inicia sesión para chatear ⚡"); return; }
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
      } catch { showToast("Error o créditos insuficientes ❌"); }
    } else {
      if (cost > 0 && !spendCredits(cost)) { showToast(`Necesitas ${cost} créditos`); return; }
      setVoted((v) => ({ ...v, [voteId]: option }));
      addXP(xp);
      showToast(`+${xp} XP local`);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000c] z-[300] flex flex-col" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Hero */}
      <div className="relative h-[180px] flex-shrink-0" style={{ background: `linear-gradient(135deg, ${project.color}22, ${project.color}11)` }}>
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="text-[8px] font-bold tracking-[2px] px-2 py-[2px] rounded-xl w-fit mb-2 border" style={{ color: project.color, borderColor: project.color + "60", background: project.color + "15" }}>
            🌍 PROYECTO ACTIVO
          </div>
          <div className="flex items-end gap-3">
            <div className="text-[44px] leading-none">{project.emoji}</div>
            <div>
              <div className="font-heading text-[24px] tracking-[1px] text-white leading-tight">{project.title}</div>
              <div className="text-[11px] text-muted mt-1">{project.subtitle}</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white border-none cursor-pointer text-sm"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0 bg-gray">
        {(["info", "chat", "votar"] as ProjectTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[11px] font-semibold cursor-pointer border-b-2 transition-colors bg-transparent capitalize ${tab === t ? "text-white border-accent" : "text-muted border-transparent"}`}
          >
            {t === "info" ? "Info" : t === "chat" ? "💬 Chat" : "🗳 Votar"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray">
        {tab === "info" && (
          <div className="p-4 flex flex-col gap-3">
            <div>
              <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-1">Sobre el proyecto</div>
              <div className="text-[12px] text-[#ccc] leading-relaxed">{project.description}</div>
            </div>
            <div className="bg-gray2 rounded-xl p-3">
              <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase mb-2">Insignia al donar</div>
              <div className="text-[13px]">Tu primera donación desbloquea: <strong className="text-accent">{project.badgeAt}</strong></div>
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

        {tab === "chat" && (
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

        {tab === "votar" && (
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
  );
}
