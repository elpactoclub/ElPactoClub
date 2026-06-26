"use client";

// EN: Full-screen Instagram-style story viewer that auto-advances slides across multiple authors with tap/keyboard navigation.
// ES: Visor de historias a pantalla completa estilo Instagram que avanza automáticamente entre las diapositivas de varios autores con navegación táctil/teclado.

import { useEffect, useRef, useState } from "react";

// EN: A single story slide (background, text and optional emoji/image).
// ES: Una sola diapositiva de historia (fondo, texto y emoji/imagen opcional).
interface Slide { bg: string; text: string; emoji?: string; imageUrl?: string }
// EN: An author whose story is being viewed, including own-story metadata.
// ES: Un autor cuya historia se está viendo, incluyendo metadatos de la historia propia.
export interface StoryAuthor {
  id?: string;
  name: string;
  photo?: string;          // profile photo (dimmed bg for mock content)
  avatar?: string;         // emoji fallback
  storyId?: string;        // story entity ID (only for own story)
  storyImageUrl?: string;  // actual uploaded story image
  caption?: string;        // story caption text
  isOwn?: boolean;         // true for the current user's own story
}

// Mock content for seeded creators (used when they have no uploaded story).
const STORY_CONTENT: Record<string, Slide[]> = {
  "Herson": [
    { bg: "linear-gradient(160deg,#0d1a0d,#1a3a1a)", text: "Entrenamiento terminado 💪 Mañana toca partido 🏀", emoji: "🏀" },
    { bg: "linear-gradient(160deg,#1a1a00,#2a2a00)", text: "¿Quién va a estar en el MVP'S TOUR 3x3 el 1 de julio? Os espero 🔥 #ElPacto", emoji: "🔥" },
  ],
  "Violeta Verano": [
    { bg: "linear-gradient(160deg,#1a0014,#2a0022)", text: "Nueva encuesta en el feed 📊 ¿Qué es más difícil de ejecutar?", emoji: "📊" },
  ],
  "Elvis Ude": [
    { bg: "linear-gradient(160deg,#0a0a1a,#14143a)", text: "🏆 RETO SEMANAL activo — graba tu mejor movimiento 1vs1 y usa #ElPactoReto", emoji: "🏆" },
  ],
};

const GENERIC_SLIDE: Slide = { bg: "linear-gradient(160deg,#141414,#1f1f1f)", text: "ha compartido una historia 📸", emoji: "✨" };

// EN: Returns the slides for an author: their uploaded story if any, else seeded/generic mock content.
// ES: Devuelve las diapositivas de un autor: su historia subida si la hay, si no contenido simulado predefinido/genérico.
function slidesFor(author: StoryAuthor): Slide[] {
  if (author.storyImageUrl) {
    return [{ bg: "#000", text: author.caption ?? "", imageUrl: author.storyImageUrl }];
  }
  return STORY_CONTENT[author.name] ?? [GENERIC_SLIDE];
}

const DURATION = 5000; // ms per slide

// EN: Props for the story viewer: authors list, starting index and lifecycle callbacks.
// ES: Props del visor de historias: lista de autores, índice inicial y callbacks de ciclo de vida.
interface StoryViewerProps {
  authors: StoryAuthor[];
  startIndex: number;
  onClose: () => void;
  onViewed?: (author: StoryAuthor) => void;
  onDeleteStory?: (storyId: string) => void;
}

// EN: Story viewer component handling slide timing, navigation, pause-on-hold and view/delete callbacks.
// ES: Componente del visor de historias que gestiona el tiempo de las diapositivas, la navegación, la pausa al mantener pulsado y los callbacks de visto/eliminar.
export default function StoryViewer({ authors, startIndex, onClose, onViewed, onDeleteStory }: StoryViewerProps) {
  const [sIdx, setSIdx] = useState(Math.max(0, startIndex));
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const pausedRef = useRef(false);

  const author = authors[sIdx];
  const slides = author ? slidesFor(author) : [GENERIC_SLIDE];
  const totalSlides = slides.length;

  const goNext = () => {
    if (slideIdx < totalSlides - 1) {
      setSlideIdx((i) => i + 1);
      setProgress(0);
    } else if (sIdx < authors.length - 1) {
      setSIdx((i) => i + 1);
      setSlideIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (slideIdx > 0) {
      setSlideIdx((i) => i - 1);
      setProgress(0);
    } else if (sIdx > 0) {
      setSIdx((i) => i - 1);
      setSlideIdx(0);
      setProgress(0);
    }
  };

  // Mark each author as viewed as the viewer reaches them
  useEffect(() => {
    if (authors[sIdx]) onViewed?.(authors[sIdx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sIdx]);

  useEffect(() => {
    setProgress(0);
    startRef.current = performance.now();
    const tick = (now: number) => {
      if (pausedRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
      else goNext();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sIdx, slideIdx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sIdx, slideIdx]);

  if (!author) return null;
  const slide = slides[slideIdx];
  const hasPhoto = !!author.photo && (author.photo.startsWith("http") || author.photo.startsWith("data:") || author.photo.startsWith("/"));
  const emoji = author.avatar && !author.avatar.startsWith("http") && !author.avatar.startsWith("data:") ? author.avatar : author.name[0];

  // EN: Renders the author's avatar (photo or emoji fallback) at the given size.
  // ES: Renderiza el avatar del autor (foto o emoji de respaldo) al tamaño dado.
  const Avatar = ({ size }: { size: number }) => (
    hasPhoto ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={author.photo} alt={author.name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", objectPosition: "top" }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(240,224,64,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 700, color: "#F0E040" }}>{emoji}</div>
    )
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseDown={() => { pausedRef.current = true; }}
      onMouseUp={() => { pausedRef.current = false; startRef.current = performance.now() - (progress / 100) * DURATION; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { pausedRef.current = false; startRef.current = performance.now() - (progress / 100) * DURATION; }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: 420, height: "100dvh", maxHeight: 780, overflow: "hidden", background: slide.bg }}>
        {slide.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
        ) : hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "brightness(0.45)", zIndex: 0 }} />
        ) : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.8) 100%)", zIndex: 1 }} />

        {/* Progress bars */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", gap: 4, zIndex: 10 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.3)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: "#fff", width: i < slideIdx ? "100%" : i === slideIdx ? `${progress}%` : "0%" }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ position: "absolute", top: 28, left: 12, right: 12, display: "flex", alignItems: "center", gap: 10, zIndex: 10 }}>
          <div style={{ border: "2px solid #F0E040", borderRadius: "50%", overflow: "hidden", flexShrink: 0, padding: 1 }}>
            <Avatar size={36} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{author.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Ahora</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {author.isOwn && author.storyId && onDeleteStory && (
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar tu historia?")) { onDeleteStory(author.storyId!); onClose(); } }}
                style={{ background: "rgba(239,68,68,0.5)", border: "none", color: "#fff", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
              >🗑</button>
            )}
            <button onClick={onClose} style={{ background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ position: "absolute", bottom: 60, left: 20, right: 20, zIndex: 10, textAlign: "center" }}>
          {slide.emoji && <div style={{ fontSize: 56, marginBottom: 16, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>{slide.emoji}</div>}
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.4, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>{slide.text}</div>
        </div>

        {/* Tap zones */}
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }} style={{ position: "absolute", left: 0, top: 0, width: "35%", height: "100%", background: "transparent", border: "none", cursor: "pointer", zIndex: 5 }} />
        <button onClick={(e) => { e.stopPropagation(); goNext(); }} style={{ position: "absolute", right: 0, top: 0, width: "35%", height: "100%", background: "transparent", border: "none", cursor: "pointer", zIndex: 5 }} />

        {/* Story dots */}
        <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 10 }}>
          {authors.map((_, i) => (
            <div key={i} style={{ width: i === sIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === sIdx ? "#F0E040" : "rgba(255,255,255,0.3)", transition: "width 0.2s" }} />
          ))}
        </div>
      </div>

      {/* Side tap areas for desktop */}
      <button onClick={goPrev} style={{ position: "absolute", left: 0, top: 0, width: "calc(50% - 210px)", height: "100%", background: "transparent", border: "none", cursor: sIdx > 0 || slideIdx > 0 ? "pointer" : "default", zIndex: 2 }} />
      <button onClick={goNext} style={{ position: "absolute", right: 0, top: 0, width: "calc(50% - 210px)", height: "100%", background: "transparent", border: "none", cursor: "pointer", zIndex: 2 }} />
    </div>
  );
}
