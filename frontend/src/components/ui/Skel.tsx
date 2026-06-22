import type { CSSProperties } from "react";

/** Bloque pulsante para esqueletos de carga. */
export default function Skel({
  w,
  h,
  r = 6,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: "rgba(255,255,255,0.07)",
        animation: "pulse 1.4s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
