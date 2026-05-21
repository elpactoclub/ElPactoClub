"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

type PostType = "text" | "poll" | "challenge";

export default function PostModal() {
  const { isPostModalOpen, closePostModal, showToast } = useUIStore();
  const { isAuthenticated, name, avatar, addXP } = useUserStore();
  const [type, setType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  if (!isPostModalOpen) return null;

  const handleClose = () => {
    setType("text");
    setContent("");
    setPollOptions(["", ""]);
    closePostModal();
  };

  const handleSubmit = async () => {
    if (!content.trim()) { showToast("Escribe algo primero"); return; }
    if (type === "poll" && pollOptions.filter((o) => o.trim()).length < 2) {
      showToast("Añade al menos 2 opciones");
      return;
    }

    setSubmitting(true);
    try {
      if (isAuthenticated) {
        await api.post("/community/posts", {
          type,
          content: content.trim(),
          pollOptions: type === "poll" ? pollOptions.filter((o) => o.trim()) : undefined,
        });
        addXP(10);
        showToast("¡Publicado! +10 XP 🏀");
      } else {
        addXP(5);
        showToast("Publicado localmente · +5 XP 🏀");
      }
      handleClose();
    } catch {
      showToast("Error al publicar ❌");
    } finally {
      setSubmitting(false);
    }
  };

  const updateOption = (i: number, val: string) => {
    const opts = [...pollOptions];
    opts[i] = val;
    setPollOptions(opts);
  };

  const TYPE_TABS: { id: PostType; label: string }[] = [
    { id: "text", label: "📝 Texto" },
    { id: "poll", label: "📊 Encuesta" },
    { id: "challenge", label: "🔥 Reto" },
  ];

  const PLACEHOLDERS: Record<PostType, string> = {
    text: "¿Qué está pasando en El Pacto?",
    poll: "Escribe tu pregunta para la comunidad...",
    challenge: "Describe el reto semanal...",
  };

  return (
    <div className="fixed inset-0 bg-[#000c] z-[350] flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="bg-gray rounded-t-2xl w-full max-w-[480px] pb-8 animate-slide-up">
        <div className="w-9 h-1 bg-gray3 rounded-sm mx-auto mt-4 mb-4" />

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-gray3 flex items-center justify-center text-[15px]">{avatar}</div>
          <div className="flex-1">
            <div className="text-[12px] font-bold">{name}</div>
            <div className="text-[9px] text-muted">Publicando en El Pacto</div>
          </div>
          <button onClick={handleClose} className="bg-gray2 border-none text-muted w-7 h-7 rounded-full cursor-pointer text-sm flex items-center justify-center">✕</button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-[5px] px-4 pt-3 pb-2">
          {TYPE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`flex-1 py-[6px] rounded-[20px] text-[10px] font-bold cursor-pointer ${type === t.id ? "bg-accent text-black" : "bg-gray2 text-muted border border-border2"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 py-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDERS[type]}
            rows={4}
            className="w-full bg-transparent text-[13px] text-white placeholder:text-muted resize-none outline-none leading-relaxed font-sans"
          />

          {/* Poll options */}
          {type === "poll" && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="text-[9px] font-bold tracking-[1.5px] text-muted uppercase">Opciones</div>
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="w-full bg-gray2 border border-border2 rounded-lg px-3 py-2 text-[12px] text-white font-sans outline-none focus:border-accent"
                />
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-[10px] text-accent bg-transparent border-none cursor-pointer text-left"
                >
                  + Añadir opción
                </button>
              )}
            </div>
          )}

          {/* Challenge hint */}
          {type === "challenge" && (
            <div className="mt-2 bg-gray2 border border-accent/20 rounded-lg px-3 py-2 text-[10px] text-muted">
              💡 El mejor reto de la semana gana <strong className="text-accent">200 créditos ⚡</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 border-t border-border flex items-center gap-2">
          <div className="text-[10px] text-muted flex-1">{content.length}/280</div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="bg-accent text-black font-heading text-[12px] px-5 py-[9px] rounded-xl tracking-[1px] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Publicando..." : "PUBLICAR →"}
          </button>
        </div>
      </div>
    </div>
  );
}
