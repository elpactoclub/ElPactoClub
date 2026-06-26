"use client";

// EN: Hook providing imperative confirm/alert dialogs via promises, along with the JSX to render the dialog UI.
// ES: Hook que proporciona diálogos de confirmación/alerta imperativos mediante promesas, junto con el JSX para renderizar la UI del diálogo.

import { useState, useCallback, useRef } from "react";
import ConfirmDialog, { ConfirmDialogProps } from "@/components/ui/ConfirmDialog";

type ConfirmOptions = Omit<ConfirmDialogProps, "onConfirm" | "onCancel">;
type AlertOptions = Omit<ConfirmDialogProps, "onConfirm" | "onCancel" | "cancelLabel">;

// EN: Returns confirm (with cancel) and alert (confirm-only) functions plus a ConfirmUI node to mount in the component tree.
// ES: Devuelve las funciones confirm (con cancelar) y alert (solo confirmar) más un nodo ConfirmUI para montar en el árbol de componentes.
export function useConfirm() {
  const [state, setState] = useState<(ConfirmOptions & { isAlert?: boolean }) | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setState(opts);
    return new Promise((resolve) => { resolveRef.current = resolve; });
  }, []);

  const alert = useCallback((opts: AlertOptions): Promise<void> => {
    setState({ ...opts, isAlert: true });
    return new Promise((resolve) => { resolveRef.current = () => resolve(); });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState(null);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState(null);
  }, []);

  const ConfirmUI = state ? (
    <ConfirmDialog
      {...state}
      onConfirm={handleConfirm}
      onCancel={state.isAlert ? undefined : handleCancel}
    />
  ) : null;

  return { confirm, alert, ConfirmUI };
}
