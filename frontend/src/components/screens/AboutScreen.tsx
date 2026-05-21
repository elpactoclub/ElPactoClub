"use client";

import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { useState, useEffect } from "react";
import { api } from "@/services/api";

interface LeaderboardEntry {
  id: string;
  name: string;
  city?: string;
  level: string;
  xp: number;
}

const LEVEL_COLORS: Record<string, string> = { Leyenda: "#A78BFA", MVP: "#60A5FA", Starter: "#22C55E", Rookie: "#777" };
const POS_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32", "#777", "#777"];

const STATIC_RANKING = [
  { pos: 1, name: "BasketQueen", city: "Barcelona", level: "Leyenda", xp: "7,890", color: "#A78BFA", posColor: "#FFD700" },
  { pos: 2, name: "MikelFan23", city: "Madrid", level: "MVP", xp: "5,240", color: "#60A5FA", posColor: "#C0C0C0" },
  { pos: 3, name: "NachoBCN", city: "Barcelona", level: "MVP", xp: "4,120", color: "#F59E0B", posColor: "#CD7F32" },
  { pos: 4, name: "Laura_BCN", city: "Valencia", level: "Starter", xp: "3,890", color: "#22C55E", posColor: "#777" },
  { pos: 5, name: "PactoForever", city: "Sevilla", level: "Starter", xp: "2,760", color: "#EC4899", posColor: "#777" },
];

export default function AboutScreen() {
  const { showToast, openFanModal, openProjectPage } = useUIStore();
  const { spendCredits, addXP, name: myName, xp: myXP } = useUserStore();
  const [rankTab, setRankTab] = useState<"global" | "ciudades">("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.get("/users/leaderboard").then((r) => setLeaderboard(r.data)).catch(() => {});
  }, []);

  const handleDonar = (amount: number, project: string) => {
    if (!spendCredits(amount)) { showToast("Sin créditos suficientes"); return; }
    addXP(amount);
    showToast(`Apoyaste ${project} · −${amount} ⚡ · +${amount} XP 🏀`);
  };

  const globalRanking = leaderboard.length > 0
    ? leaderboard.slice(0, 5).map((u, i) => ({
        pos: i + 1, name: u.name, city: u.city || "—", level: u.level,
        xp: u.xp.toLocaleString(), color: LEVEL_COLORS[u.level] || "#777", posColor: POS_COLORS[i] || "#777",
      }))
    : STATIC_RANKING;

  const myRankPos = leaderboard.length > 0 ? (leaderboard.findIndex((u) => u.name === myName) + 1 || 47) : 47;
  const xpToTop5 = 2760;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>

      {/* Hero — white bg */}
      <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", color: "#000" }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>Quiénes somos</div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, lineHeight: 1.1, marginBottom: 10, color: "#000" }}>EL BALONCESTO YA NO ES SOLO DEPORTE</div>
        <div style={{ fontSize: 13, color: "#3b82f6", lineHeight: 1.55 }}>Club nativo digital donde el basket se mezcla con impacto social, comunidad real y contenido que importa.</div>
      </div>

      {/* Creators */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10, paddingLeft: 2 }}>CREADORES DEL CLUB</div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto" }} className="hide-scrollbar">
          {[
            { name: "Elvis Ude", role: "Creador · Jugador", img: "/imagenes/elvis.jpg" },
            { name: "Herson", role: "Capitán · Creador", img: "/imagenes/herson.jpg" },
            { name: "Violeta Verano", role: "Creadora · Jugadora", img: "/imagenes/violeta.jpg" },
          ].map((c) => (
            <div key={c.name} style={{ minWidth: 150, background: "#1a1a1a", borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ height: 140, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>{c.role}</div>
                <button
                  onClick={() => showToast(`Mensaje a ${c.name} · −50 ⚡`)}
                  style={{ width: "100%", background: "#252525", border: "1px solid rgba(255,255,255,0.07)", color: "#fff", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
                >
                  ✉ Mensaje ⚡ 50
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingLeft: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)" }}>RANKING DE LA COMUNIDAD</span>
          <span style={{ fontSize: 11, color: "var(--color-muted)" }}>1,247 fans activos</span>
        </div>

        {/* Tab buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setRankTab("global")}
            style={{ flex: 1, padding: "12px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", background: rankTab === "global" ? "var(--color-accent)" : "transparent", color: rankTab === "global" ? "#000" : "var(--color-muted)", border: rankTab === "global" ? "none" : "1px solid rgba(255,255,255,0.15)" }}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setRankTab("ciudades")}
            style={{ flex: 1, padding: "12px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", background: rankTab === "ciudades" ? "var(--color-accent)" : "transparent", color: rankTab === "ciudades" ? "#000" : "var(--color-muted)", border: rankTab === "ciudades" ? "none" : "1px solid rgba(255,255,255,0.15)" }}
          >
            🏙 Ciudades
          </button>
        </div>

        {/* Global ranking */}
        {rankTab === "global" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {globalRanking.map((r) => (
              <button
                key={r.pos}
                onClick={() => openFanModal(r.name)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, border: r.pos === 1 ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.05)", background: r.pos === 1 ? "linear-gradient(135deg,#1a1400,#252000)" : "#1a1a1a", cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, width: 28, textAlign: "center", flexShrink: 0, color: r.posColor }}>{r.pos}</div>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: r.color + "22", border: `2px solid ${r.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: r.color, flexShrink: 0 }}>{r.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{r.city} · {r.level}</div>
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-accent)", flexShrink: 0 }}>{r.xp} XP</div>
              </button>
            ))}

            {/* My position */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: "linear-gradient(135deg,#1a1a10,#252515)", border: "1px solid rgba(240,224,64,0.25)", marginTop: 4 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent)", flexShrink: 0 }}>#{myRankPos}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{myName || "TU NOMBRE"}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Barcelona · {myXP.toLocaleString()} XP</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "var(--color-muted)" }}>Te faltan</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-accent)", lineHeight: 1 }}>{xpToTop5.toLocaleString()} XP</div>
                <div style={{ fontSize: 10, color: "var(--color-muted)" }}>para top 5</div>
              </div>
            </div>
          </div>
        )}

        {/* Cities ranking */}
        {rankTab === "ciudades" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { pos: 1, city: "Barcelona", fans: 312, leader: "BasketQueen", xp: "247,840", posColor: "#FFD700" },
              { pos: 2, city: "Madrid", fans: 287, leader: "MikelFan23", xp: "198,320", posColor: "#C0C0C0" },
              { pos: 3, city: "Valencia", fans: 198, leader: "Laura_BCN", xp: "156,900", posColor: "#CD7F32" },
              { pos: 4, city: "Sevilla", fans: 156, leader: "PactoForever", xp: "98,450", posColor: "#777" },
              { pos: 5, city: "Bilbao", fans: 87, leader: "—", xp: "67,200", posColor: "#777" },
            ].map((c) => (
              <div key={c.pos} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: c.pos === 1 ? "linear-gradient(135deg,#1a1400,#252000)" : "#1a1a1a", border: c.pos === 1 ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, width: 28, textAlign: "center", flexShrink: 0, color: c.posColor }}>{c.pos}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{c.city}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{c.fans} fans · Líder: {c.leader}</div>
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, color: "var(--color-accent)", flexShrink: 0 }}>{c.xp} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* India project */}
      <div style={{ background: "linear-gradient(135deg,#1a1400,#221a00)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "16px 16px 0", cursor: "pointer" }} onClick={() => openProjectPage("india")}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#F59E0B", flexShrink: 0 }}>IN</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>India · Dribble Academy</div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1px", color: "#F59E0B", textTransform: "uppercase" }}>PROYECTO ACTIVO</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); openProjectPage("india"); }} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}>Ver más →</button>
        </div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.55, marginBottom: 16 }}>
          Colaboramos con la <strong style={{ color: "#F59E0B" }}>Fundación Dribble Academy</strong> para llevar el baloncesto a India — equipo conjunto, formación local y colaboradores estratégicos.
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDonar(50, "India"); }}
          style={{ width: "100%", background: "var(--color-accent)", color: "#000", border: "none", padding: "14px", borderRadius: "0 0 10px 10px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          Apoyar 50 ⚡
        </button>
      </div>

      {/* Tecnificar project */}
      <div style={{ background: "linear-gradient(135deg,#0d0014,#140020)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 10, padding: "16px 16px 0", cursor: "pointer" }} onClick={() => openProjectPage("tecnificar")}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>Tecnificar</div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1px", color: "#8B5CF6", textTransform: "uppercase" }}>PROYECTO ACTIVO</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); openProjectPage("tecnificar"); }} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}>Ver más →</button>
        </div>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.55, marginBottom: 16 }}>
          Becas de tecnificación para jóvenes jugadores con talento que no tienen recursos para acceder a formación de élite.
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDonar(50, "Tecnificar"); }}
          style={{ width: "100%", background: "var(--color-accent)", color: "#000", border: "none", padding: "14px", borderRadius: "0 0 10px 10px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          Apoyar 50 ⚡
        </button>
      </div>

      {/* Sponsor Principal */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16, paddingLeft: 2 }}>SPONSOR PRINCIPAL</div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "24px 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* Stylized logo placeholder — car silhouette */}
          <svg width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 28 C30 28 40 12 70 12 C100 12 110 28 130 28" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85"/>
            <path d="M25 28 L30 20 C45 10 55 8 70 8 C85 8 95 10 110 20 L115 28" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.08)" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Patrocinadores oficiales */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16, paddingLeft: 2 }}>PATROCINADORES OFICIALES</div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "20px 0", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, letterSpacing: "3px", background: "linear-gradient(135deg,#60A5FA,#A78BFA,#EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>HOOPS</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 4 }}>MATERIAL DEPORTIVO</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, letterSpacing: "3px", background: "linear-gradient(135deg,#3b82f6,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>REVOLUT</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 4 }}>PARTNER FINANCIERO</div>
          </div>
        </div>
      </div>

      {/* Proveedores oficiales */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16, paddingLeft: 2 }}>PROVEEDORES OFICIALES</div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "20px 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 300, fontStyle: "italic", letterSpacing: "1px", color: "#fff" }}>Xiaomi</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 4 }}>TECH OFICIAL</div>
          </div>
        </div>
      </div>

      {/* Colaborador oficial */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16, paddingLeft: 2 }}>COLABORADOR OFICIAL</div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "20px 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: "3px", color: "#fff", opacity: 0.85 }}>BASKETBALL EMOTION</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 4 }}>TIENDA OFICIAL</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "#FAFAF0", borderRadius: 10, padding: "22px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "var(--color-accent)", opacity: 0.15 }} />
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>Únete</div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1.05, color: "#000", marginBottom: 12 }}>
          ¿QUIERES SER<br />COLABORADOR<br />DE EL PACTO?
        </div>
        <div style={{ fontSize: 13, color: "#3b82f6", lineHeight: 1.55, marginBottom: 20 }}>
          Llegamos a más de 1,200 fans <strong style={{ color: "#1d4ed8" }}>comprometidos</strong> con el basket. Si tu marca quiere estar donde está la comunidad, hablemos.
        </div>
        <button
          onClick={() => showToast("📩 hola@elpactoclub.com — te respondemos en 24h")}
          style={{ background: "#111", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          Escribirnos →
        </button>
      </div>
    </div>
  );
}
