"use client";

// EN: Marketing landing page with hero, live stats, member pricing and CTAs to sign up or explore.
// ES: Página de aterrizaje de marketing con hero, estadísticas en vivo, precio de socio y CTAs para registrarse o explorar.

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";

// EN: Landing component that fetches public stats/prices and routes users to auth or onboarding.
// ES: Componente de landing que obtiene estadísticas/precios públicos y dirige a los usuarios a auth u onboarding.
export default function Landing() {
  const { openAuthForPayment } = useUIStore();
  const [stats, setStats] = useState<{ fans: number; decisions: number } | null>(null);
  const [socioPrice, setSocioPrice] = useState("5€");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    fetch(`${apiUrl}/api/v1/stats`)
      .then((r) => r.json())
      .then((d) => setStats({ fans: d.fans ?? 0, decisions: d.decisions ?? 0 }))
      .catch(() => setStats({ fans: 0, decisions: 0 }));
    fetch(`${apiUrl}/api/v1/prices`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.socio) { const n = d.socio; setSocioPrice(n % 1 === 0 ? `${n}€` : `${n.toFixed(2).replace(".", ",")}€`); } })
      .catch(() => {});
  }, []);

  const handleExplorar = () => {
    useUIStore.setState({ isOnboardingOpen: true, isLandingOpen: false });
  };

  const avatars = ["/imagenes/elvis.jpg", "/imagenes/herson.jpg", "/imagenes/violeta.jpg"];

  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        background: "#0A0A0A",
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 20% 10%, rgba(240,224,64,0.07) 0%, transparent 65%),
          radial-gradient(ellipse 60% 50% at 85% 80%, rgba(34,197,94,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 50% 50%, rgba(167,139,250,0.03) 0%, transparent 70%)
        `,
        minHeight: "100%",
      }}
    >

      {/* ── DESKTOP ≥ 640px ─────────────────────────────── */}
      <div className="hidden sm:flex flex-1 items-stretch justify-center" style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {/* Left */}
        <div className="flex flex-col justify-between flex-1" style={{ maxWidth: 560, padding: "52px 48px 52px 48px" }}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-black text-sm"
              style={{ background: "var(--color-white)", fontFamily: "var(--font-heading)", letterSpacing: 0 }}
            >
              EP
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 20, letterSpacing: 3 }}>EL PACTO</span>
          </div>

          {/* Center content */}
          <div className="flex flex-col gap-5">
            <div className="text-[10px] font-bold tracking-[2.5px] uppercase" style={{ color: "var(--color-muted)" }}>
              Club Nativo Digital
            </div>

            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, letterSpacing: 1 }}>
              VOTA DECISIONES<br />DEL CLUB,<br />
              <span style={{ color: "var(--color-accent)" }}>HABLA CON<br />LOS JUGADORES,<br />SUBE EN EL<br />RANKING.</span>
            </h1>
            <p style={{ fontSize: 14, color: "#777", lineHeight: 1.7, maxWidth: 380 }}>
              Vienes por el basket, te quedas por lo que pasa.
            </p>

            {/* Avatares */}
            <div className="flex items-center gap-3">
              <div className="flex">
                {avatars.map((src, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full overflow-hidden"
                    style={{ border: "2px solid #0A0A0A", marginLeft: i > 0 ? -10 : 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover object-top" />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#666" }}>Elvis, Herson y Violeta te esperan</span>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {[
                { val: stats?.fans.toLocaleString("es"), lbl: "Fans activos", c: "var(--color-accent)" },
                { val: stats ? String(stats.decisions) : undefined, lbl: "Decisiones", c: "var(--color-white)" },
                { val: socioPrice, lbl: "Al mes", c: "var(--color-green)" },
              ].map((s) => (
                <div key={s.lbl}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: s.c, lineHeight: 1, minWidth: 24 }}>
                    {s.val !== undefined ? s.val : <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", verticalAlign: "middle" }} />}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--color-muted)", marginTop: 3 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3" style={{ maxWidth: 340 }}>
            <button
              onClick={openAuthForPayment}
              className="btn-y"
              style={{ fontSize: 13, fontWeight: 800, padding: "13px" }}
            >
              Hacerme socio — {socioPrice}/mes
            </button>
            <button
              onClick={handleExplorar}
              className="btn-o"
              style={{ fontSize: 12 }}
            >
              Explorar gratis
            </button>
            <p style={{ textAlign: "center", fontSize: 10, color: "#444" }}>
              Sin tarjeta de crédito · Cancela cuando quieras
            </p>
          </div>
        </div>

        {/* Right — grid fotos */}
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "52px 60px" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 380 }}>
            {[
              { src: "/imagenes/herson.jpg",  pos: "center top"    },
              { src: "/imagenes/elvis.jpg",   pos: "center top"    },
              { src: "/imagenes/violeta.jpg", pos: "center top"    },
              { src: "/imagenes/edugilnew.jpg",  pos: "center 30%"    },
            ].map(({ src, pos }, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  aspectRatio: "1",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 4 }}>El equipo te espera</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Entra a la comunidad y sé parte del club</div>
          </div>
        </div>
      </div>

      {/* ── MOBILE < 640px ───────────────────────────────── */}
      <div
        className="flex sm:hidden flex-col flex-1"
        style={{ maxWidth: 480, margin: "0 auto", width: "100%", padding: "0 22px" }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, paddingTop: 36, paddingBottom: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: "var(--color-white)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontSize: 12, color: "#000", fontWeight: 900 }}>
            EP
          </div>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 17, letterSpacing: 3 }}>EL PACTO</span>
        </div>

        {/* Hero — crece para ocupar el espacio disponible */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, paddingTop: 20, paddingBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "var(--color-muted)" }}>
            Club Nativo Digital
          </div>

          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 36, lineHeight: 1.02, letterSpacing: 0.5, margin: 0 }}>
            VOTA DECISIONES<br />DEL CLUB,<br />
            <span style={{ color: "var(--color-accent)" }}>HABLA CON<br />LOS JUGADORES,<br />SUBE EN EL<br />RANKING.</span>
          </h1>
          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: "4px 0 0" }}>
            Vienes por el basket, te quedas por lo que pasa.
          </p>

          {/* Avatares */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex" }}>
              {avatars.map((src, i) => (
                <div
                  key={i}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", overflow: "hidden",
                    border: "2px solid #0A0A0A", marginLeft: i > 0 ? -8 : 0,
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 10, color: "#666" }}>Elvis, Herson y Violeta te esperan</span>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", margin: "0 -22px" }}>
          {[
            { val: stats?.fans.toLocaleString("es"), lbl: "Fans activos", c: "var(--color-accent)" },
            { val: stats ? String(stats.decisions) : undefined, lbl: "Decisiones", c: "var(--color-white)" },
            { val: socioPrice, lbl: "Al mes", c: "var(--color-green)" },
          ].map((s, i) => (
            <div key={s.lbl} style={{ flex: 1, padding: "12px 6px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: s.c, lineHeight: 1, minHeight: 22 }}>
                {s.val !== undefined ? s.val : <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", verticalAlign: "middle" }} />}
              </div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--color-muted)", marginTop: 3 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "18px 0 32px" }}>
          <button onClick={openAuthForPayment} className="btn-y">Hacerme socio — {socioPrice}/mes</button>
          <button onClick={handleExplorar} className="btn-o">Explorar gratis</button>
          <p style={{ textAlign: "center", fontSize: 10, color: "#444", margin: 0 }}>
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>
      </div>

    </div>
  );
}
