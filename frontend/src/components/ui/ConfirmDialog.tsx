"use client";

// EN: Modal confirmation dialog with confirm/cancel actions, keyboard shortcuts and optional danger styling.
// ES: Diálogo modal de confirmación con acciones confirmar/cancelar, atajos de teclado y estilo de peligro opcional.

import { useEffect } from "react";

// EN: Props controlling the confirm dialog's text, labels, callbacks and danger mode.
// ES: Props que controlan el texto, etiquetas, callbacks y modo de peligro del diálogo de confirmación.
export interface ConfirmDialogProps {
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

// EN: Renders an overlay confirmation dialog; Enter confirms and Escape cancels.
// ES: Renderiza un diálogo de confirmación superpuesto; Enter confirma y Escape cancela.
export default function ConfirmDialog({
  title,
  message,
  detail,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancel) onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  const accentColor = danger ? "#ef4444" : "#F0E040";
  const accentBg = danger ? "rgba(239,68,68,0.08)" : "rgba(240,224,64,0.06)";
  const icon = danger ? "🗑️" : onCancel ? "⚠️" : "ℹ️";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 20px",
        animation: "fadeIn 0.12s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && onCancel) onCancel(); }}
    >
      <div
        style={{
          background: "#161616",
          border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 18,
          padding: "28px 28px 24px",
          maxWidth: 400,
          width: "100%",
          boxShadow: `0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)`,
          animation: "dialogPopIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Icon + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: accentBg,
            border: `1px solid ${accentColor}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", lineHeight: 1.3 }}>
            {title ?? message}
          </div>
        </div>

        {/* Message (only if title is set) */}
        {title && (
          <div style={{ fontSize: 13.5, color: "#aaa", lineHeight: 1.65, marginBottom: detail ? 8 : 0 }}>
            {message}
          </div>
        )}

        {detail && (
          <div style={{
            fontSize: 12, color: "#666", lineHeight: 1.5,
            background: "rgba(255,255,255,0.03)", borderRadius: 8,
            padding: "10px 12px", marginTop: 10,
            fontFamily: "monospace",
            wordBreak: "break-word",
          }}>
            {detail}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#888",
                fontFamily: "inherit", transition: "all 0.12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#ccc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#888"; }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              padding: "9px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: danger ? "#ef4444" : "#F0E040",
              border: "none",
              color: danger ? "#fff" : "#000",
              fontFamily: "inherit", transition: "filter 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
