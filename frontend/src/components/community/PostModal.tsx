"use client";

import { useRef, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

type PostType = "text" | "poll" | "challenge";

export default function PostModal() {
  const { isPostModalOpen, closePostModal, showToast, refreshPosts } = useUIStore();
  const { isAuthenticated, name, avatar, addXP } = useUserStore();
  const [type, setType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isPostModalOpen) return null;

  const handleClose = () => {
    setType("text");
    setContent("");
    setPollOptions(["", ""]);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    closePostModal();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Solo se permiten imágenes"); return; }
    if (file.size > 8 * 1024 * 1024) { showToast("La imagen no puede superar 8 MB"); return; }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) { showToast("Escribe algo o añade una foto"); return; }
    if (type === "poll" && pollOptions.filter((o) => o.trim()).length < 2) {
      showToast("Añade al menos 2 opciones"); return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile && isAuthenticated) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await api.post("/community/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = res.data.url;
      }

      if (isAuthenticated) {
        await api.post("/community/posts", {
          type,
          content: content.trim() || " ",
          imageUrl,
          pollOptions: type === "poll" ? pollOptions.filter((o) => o.trim()) : undefined,
        });
        addXP(10);
        showToast("¡Publicado! +10 XP 🏀");
      } else {
        addXP(5);
        showToast("Publicado localmente · +5 XP 🏀");
      }
      refreshPosts();
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

  const removeOption = (i: number) => {
    setPollOptions(pollOptions.filter((_, idx) => idx !== i));
  };

  const TYPE_TABS: { id: PostType; label: string }[] = [
    { id: "text",      label: "📝 Texto"    },
    { id: "poll",      label: "📊 Encuesta" },
    { id: "challenge", label: "🔥 Reto"     },
  ];

  const PLACEHOLDERS: Record<PostType, string> = {
    text:      "¿Qué está pasando en El Pacto?",
    poll:      "Escribe tu pregunta para la comunidad...",
    challenge: "Describe el reto semanal...",
  };

  return (
    <div
      className="fixed inset-0 z-[350] flex items-end lg:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full lg:rounded-2xl rounded-t-2xl animate-slide-up flex flex-col"
        style={{
          maxWidth: 560,
          background: "#1c1c1c",
          height: "min(90vh, 600px)",
        }}
      >
        {/* Handle — mobile only */}
        <div className="lg:hidden w-9 h-1 rounded-sm mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: "#333" }} />

        {/* Header — fixed */}
        <div className="flex items-center gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 20px" }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0 overflow-hidden"
            style={{ background: "#252525", border: "2px solid rgba(240,224,64,0.3)" }}
          >
            {avatar?.startsWith("http") || avatar?.startsWith("data:")
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
              : avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 13, fontWeight: 700 }}>{name || "elpactoclub"}</div>
            <div style={{ fontSize: 10, color: "var(--color-muted)" }}>Publicando en El Pacto</div>
          </div>
          <button
            onClick={handleClose}
            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Type tabs — fixed */}
        <div className="flex gap-2 flex-shrink-0" style={{ padding: "12px 20px 10px" }}>
          {TYPE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 20, fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                background: type === t.id ? "var(--color-accent)" : "rgba(255,255,255,0.06)",
                color: type === t.id ? "#000" : "var(--color-muted)",
                border: type === t.id ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, padding: "12px 20px 16px" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDERS[type]}
            maxLength={280}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              fontSize: 15, color: "#fff", lineHeight: 1.65, resize: "none",
              fontFamily: "inherit", minHeight: 120,
            }}
          />

          {/* Image preview */}
          {imagePreview && (
            <div style={{ position: "relative", marginTop: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="preview"
                style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12, display: "block" }}
              />
              <button
                onClick={() => { URL.revokeObjectURL(imagePreview); setImageFile(null); setImagePreview(null); }}
                style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
          )}

          {/* Poll options */}
          {type === "poll" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", color: "var(--color-muted)", textTransform: "uppercase" }}>Opciones</div>
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                    style={{
                      flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fff",
                      fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >✕</button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  style={{ fontSize: 11, color: "var(--color-accent)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", padding: 0 }}
                >
                  + Añadir opción
                </button>
              )}
            </div>
          )}

          {/* Challenge hint */}
          {type === "challenge" && (
            <div style={{ marginTop: 10, background: "rgba(240,224,64,0.06)", border: "1px solid rgba(240,224,64,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 11, color: "var(--color-muted)" }}>
              💡 El mejor reto de la semana gana <strong style={{ color: "var(--color-accent)" }}>200 créditos ⚡</strong>
            </div>
          )}
        </div>

        {/* Footer — fixed */}
        <div
          className="flex-shrink-0 flex items-center gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 20px" }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: imageFile ? "var(--color-accent)" : "var(--color-muted)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
          >
            📷 Foto
          </button>
          <span style={{ fontSize: 11, color: content.length > 250 ? "#ef4444" : "var(--color-muted)", flex: 1, textAlign: "right" }}>
            {content.length}/280
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !imageFile)}
            style={{
              background: "var(--color-accent)", color: "#000", border: "none",
              padding: "10px 24px", borderRadius: 12, fontSize: 12, fontWeight: 800,
              cursor: submitting || (!content.trim() && !imageFile) ? "default" : "pointer",
              fontFamily: "var(--font-heading)", letterSpacing: 1,
              opacity: submitting || (!content.trim() && !imageFile) ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {submitting ? "Publicando..." : "PUBLICAR →"}
          </button>
        </div>
      </div>
    </div>
  );
}
