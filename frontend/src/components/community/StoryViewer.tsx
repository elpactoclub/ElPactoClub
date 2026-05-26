"use client";

import { useEffect, useRef, useState } from "react";

interface Story {
  name: string;
  photo: string;
  slides: { bg: string; text: string; emoji?: string }[];
}

const STORIES: Story[] = [
  {
    name: "Herson",
    photo: "/imagenes/herson.jpg",
    slides: [
      { bg: "linear-gradient(160deg,#0d1a0d,#1a3a1a)", text: "Entrenamiento terminado 💪 Mañana toca partido 🏀", emoji: "🏀" },
      { bg: "linear-gradient(160deg,#1a1a00,#2a2a00)", text: "¿Quién va a estar en el MVP'S TOUR 3x3 el 1 de julio? Os espero 🔥 #ElPacto", emoji: "🔥" },
    ],
  },
  {
    name: "Violeta",
    photo: "/imagenes/violeta.jpg",
    slides: [
      { bg: "linear-gradient(160deg,#1a0014,#2a0022)", text: "Nueva encuesta en el feed 📊 ¿Qué es más difícil de ejecutar?", emoji: "📊" },
    ],
  },
  {
    name: "Elvis",
    photo: "/imagenes/elvis.jpg",
    slides: [
      { bg: "linear-gradient(160deg,#0a0a1a,#14143a)", text: "🏆 RETO SEMANAL activo — graba tu mejor movimiento 1vs1 y usa #ElPactoReto", emoji: "🏆" },
    ],
  },
];

const DURATION = 5000; // ms per slide

interface StoryViewerProps {
  initialName: string;
  onClose: () => void;
}

export default function StoryViewer({ initialName, onClose }: StoryViewerProps) {
  const storyIdx = Math.max(0, STORIES.findIndex((s) => s.name === initialName));
  const [sIdx, setSIdx] = useState(storyIdx);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const pausedRef = useRef(false);

  const story = STORIES[sIdx];
  const totalSlides = story.slides.length;

  const goNext = () => {
    if (slideIdx < totalSlides - 1) {
      setSlideIdx((i) => i + 1);
      setProgress(0);
    } else if (sIdx < STORIES.length - 1) {
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

  useEffect(() => {
    setProgress(0);
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (pausedRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        goNext();
      }
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

  const slide = story.slides[slideIdx];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseDown={() => { pausedRef.current = true; }}
      onMouseUp={() => { pausedRef.current = false; startRef.current = performance.now() - (progress / 100) * DURATION; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { pausedRef.current = false; startRef.current = performance.now() - (progress / 100) * DURATION; }}
    >
      {/* Story card */}
      <div style={{ position: "relative", width: "100%", maxWidth: 420, height: "100dvh", maxHeight: 780, overflow: "hidden", borderRadius: 0, background: slide.bg }}>

        {/* Background photo blurred */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={story.photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "blur(0px) brightness(0.45)", zIndex: 0 }} />

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.8) 100%)", zIndex: 1 }} />

        {/* Progress bars */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", gap: 4, zIndex: 10 }}>
          {story.slides.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.3)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, background: "#fff",
                width: i < slideIdx ? "100%" : i === slideIdx ? `${progress}%` : "0%",
                transition: i === slideIdx ? "none" : undefined,
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ position: "absolute", top: 28, left: 12, right: 12, display: "flex", alignItems: "center", gap: 10, zIndex: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #F0E040", overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.photo} alt={story.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{story.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Ahora</div>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ position: "absolute", bottom: 60, left: 20, right: 20, zIndex: 10, textAlign: "center" }}>
          {slide.emoji && <div style={{ fontSize: 56, marginBottom: 16, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>{slide.emoji}</div>}
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.4, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>{slide.text}</div>
        </div>

        {/* Tap zones */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          style={{ position: "absolute", left: 0, top: 0, width: "35%", height: "100%", background: "transparent", border: "none", cursor: "pointer", zIndex: 5 }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          style={{ position: "absolute", right: 0, top: 0, width: "35%", height: "100%", background: "transparent", border: "none", cursor: "pointer", zIndex: 5 }}
        />

        {/* Story dots (which story) */}
        <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 10 }}>
          {STORIES.map((_, i) => (
            <div key={i} style={{ width: i === sIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === sIdx ? "#F0E040" : "rgba(255,255,255,0.3)", transition: "width 0.2s" }} />
          ))}
        </div>
      </div>

      {/* Side tap areas for desktop */}
      <button
        onClick={goPrev}
        style={{ position: "absolute", left: 0, top: 0, width: "calc(50% - 210px)", height: "100%", background: "transparent", border: "none", cursor: sIdx > 0 || slideIdx > 0 ? "pointer" : "default", zIndex: 2 }}
      />
      <button
        onClick={goNext}
        style={{ position: "absolute", right: 0, top: 0, width: "calc(50% - 210px)", height: "100%", background: "transparent", border: "none", cursor: "pointer", zIndex: 2 }}
      />
    </div>
  );
}
