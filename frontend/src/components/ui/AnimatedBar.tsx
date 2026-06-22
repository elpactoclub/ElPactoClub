"use client";

import { useEffect, useState } from "react";

/**
 * Barra de progreso que se rellena suave desde 0 al montar, y re-anima
 * cuando cambia el valor (p.ej. al llegar los datos del backend), en vez
 * de aparecer llena de golpe.
 */
export default function AnimatedBar({
  pct,
  background,
  height = "100%",
  radius = 3,
  duration = 700,
}: {
  pct: number;
  background: string;
  height?: number | string;
  radius?: number;
  duration?: number;
}) {
  const target = Math.max(0, Math.min(100, pct || 0));
  const [w, setW] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setW(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div
      style={{
        height,
        width: `${w}%`,
        background,
        borderRadius: radius,
        transition: `width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    />
  );
}
