"use client";

// EN: "El Pacto" about screen with club intro, creators, community ranking, impact projects, sponsors, contact and legal modals.
// ES: Pantalla "El Pacto" con introducción del club, creadores, ranking de la comunidad, proyectos de impacto, patrocinadores, contacto y modales legales.

import { useUIStore, type ProjectData } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { useState, useEffect } from "react";
import { api } from "@/services/api";

// Sponsors ocultos durante el periodo de prueba. Cambiar a `true` para volver a mostrarlos.
const SHOW_SPONSORS = false;

const PRIVACY_TEXT = `POLÍTICA DE PRIVACIDAD
Club Bàsquet El Pacto
Última actualización: mayo de 2025

1. Responsable del Tratamiento
En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), el responsable del tratamiento es:
• Denominación social: Club Bàsquet El Pacto
• NIF: G56373806
• Domicilio: Calle Jeroni Marsal, núm. 68, planta 4, puerta 1 — 08340 Vilassar de Mar (Barcelona)
• Contacto: soporte@elpactoclub.com

2. Datos Personales que Recopilamos
Al registrarse recopilamos: nombre y apellidos, correo electrónico, contraseña (cifrada), fecha de nacimiento, país y ciudad de residencia, y datos de pago (gestionados íntegramente por Stripe; el Club no almacena datos de tarjeta).

3. Finalidad del Tratamiento
• Gestión de la membresía: alta, mantenimiento y baja como socio.
• Acceso a la aplicación: autenticación e identificación.
• Gestión de pagos: procesamiento a través de Stripe.
• Comunicaciones: información sobre la actividad del Club.
• Cumplimiento legal: atención de obligaciones legales.

4. Base Jurídica del Tratamiento
• Ejecución de un contrato (art. 6.1.b RGPD): gestión de membresía y acceso.
• Consentimiento (art. 6.1.a RGPD): comunicaciones comerciales.
• Cumplimiento de obligaciones legales (art. 6.1.c RGPD).

5. Plazos de Conservación
Sus datos se conservarán mientras se mantenga la membresía. Tras la baja, se bloquearán y conservarán durante los plazos legales (5 años para obligaciones fiscales y mercantiles).

6. Destinatarios
El Club no vende datos a terceros. Encargados del tratamiento:
• Stripe, Inc.: proveedor de pagos. Política: https://stripe.com/es/privacy

7. Transferencias Internacionales
Stripe puede procesar datos en EE.UU. bajo las garantías del RGPD (Cláusulas Contractuales Tipo u otros mecanismos aplicables).

8. Sus Derechos
Acceso, rectificación, supresión, oposición, limitación, portabilidad y retirada del consentimiento. Contacte en soporte@elpactoclub.com indicando "Ejercicio de derechos RGPD". Puede reclamar ante la AEPD (www.aepd.es).

9. Seguridad
Las contraseñas se almacenan cifradas. Los datos de pago son tratados por Stripe bajo estándares PCI-DSS.

10. Menores de Edad
Los menores de 14 años requieren consentimiento expreso del tutor legal conforme al art. 7 LOPDGDD.

11. Modificaciones
Cualquier cambio relevante se comunicará con antelación por la app o correo electrónico.

Club Bàsquet El Pacto · NIF G56373806 · soporte@elpactoclub.com`;

const TERMS_TEXT = `TÉRMINOS Y CONDICIONES
Club Bàsquet El Pacto — Plataforma de socios
Última actualización: mayo de 2025

1. Objeto y Ámbito de Aplicación
Las presentes Condiciones regulan el acceso y uso de la aplicación web del Club Bàsquet El Pacto (NIF G56373806), domiciliado en Calle Jeroni Marsal, núm. 68, planta 4, puerta 1, 08340 Vilassar de Mar (Barcelona). El acceso implica la aceptación plena de estas Condiciones.

2. Registro y Cuenta de Usuario
Al registrarse, el usuario se compromete a facilitar información veraz, mantener la confidencialidad de sus credenciales y no compartir su cuenta. El registro de menores de 14 años requiere consentimiento del tutor legal.

3. Membresía
3.1 Precio: la cuota mensual vigente se indica en la Plataforma antes de completar la suscripción (orientativamente ~3 €/mes). El Club puede modificarlo con 30 días de antelación.
3.2 Facturación: mensual y recurrente mediante Stripe. En caso de impago, el Club puede suspender el acceso.
3.3 Duración: sin permanencia mínima. Renovación automática mensual salvo cancelación previa.
3.4 Baja y reembolsos: baja en cualquier momento desde el perfil o en soporte@elpactoclub.com, efectiva al final del periodo en curso. No se realizan reembolsos de cuotas ya abonadas.

4. Créditos de la Plataforma
Los créditos virtuales no tienen valor monetario fuera de la Plataforma y no son reembolsables. No caducan mientras la cuenta esté activa. En caso de baja, los créditos no utilizados quedan sin efecto.

5. Normas de Conducta
Queda prohibido publicar contenidos ofensivos, acosar a otros usuarios, suplantar identidades, intentar accesos no autorizados o realizar uso comercial no autorizado. El incumplimiento puede causar la baja definitiva.

6. Suspensión y Baja
El Club puede suspender o dar de baja por impago, conducta inapropiada, uso fraudulento o incumplimiento de estas Condiciones.

7. Propiedad Intelectual
Todos los contenidos de la Plataforma son propiedad del Club o sus titulares. Queda prohibida su reproducción sin autorización expresa.

8. Limitación de Responsabilidad
El Club no garantiza disponibilidad ininterrumpida y no es responsable de interrupciones técnicas, contenidos de usuarios o uso indebido de la Plataforma.

9. Modificaciones
Cambios relevantes se comunicarán con al menos 30 días de antelación. El uso continuado implica aceptación.

10. Legislación y Jurisdicción
Legislación española. Juzgados y Tribunales de Barcelona, sin perjuicio de los derechos del consumidor.

13. Contacto
soporte@elpactoclub.com

Club Bàsquet El Pacto · NIF G56373806 · soporte@elpactoclub.com`;

// EN: Shape of a single leaderboard entry returned by the backend.
// ES: Forma de una entrada individual del ranking devuelta por el backend.
interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  country?: string;
  level: string;
  xp: number;
}

const LEVEL_COLORS: Record<string, string> = { Leyenda: "#A78BFA", MVP: "#60A5FA", Starter: "#22C55E", Rookie: "#777" };
const POS_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32", "#777", "#777"];

const COUNTRY_FLAGS: Record<string, string> = {
  "España": "🇪🇸", "Espana": "🇪🇸", "Spain": "🇪🇸",
  "México": "🇲🇽", "Mexico": "🇲🇽",
  "Argentina": "🇦🇷", "Colombia": "🇨🇴", "Chile": "🇨🇱", "Perú": "🇵🇪", "Peru": "🇵🇪",
  "Venezuela": "🇻🇪", "Ecuador": "🇪🇨", "Uruguay": "🇺🇾", "Paraguay": "🇵🇾", "Bolivia": "🇧🇴",
  "Estados Unidos": "🇺🇸", "USA": "🇺🇸", "Francia": "🇫🇷", "France": "🇫🇷",
  "Italia": "🇮🇹", "Portugal": "🇵🇹", "Alemania": "🇩🇪", "Reino Unido": "🇬🇧",
  "India": "🇮🇳", "Brasil": "🇧🇷", "Brazil": "🇧🇷", "Marruecos": "🇲🇦", "Andorra": "🇦🇩",
};
// EN: Returns the flag emoji for a country name, defaulting to a globe.
// ES: Devuelve el emoji de bandera para un nombre de país, con globo por defecto.
function flagFor(country: string): string {
  return COUNTRY_FLAGS[country] ?? "🌍";
}


// EN: About screen component that loads leaderboard/projects/creators and handles donations and contact.
// ES: Componente de la pantalla "Acerca de" que carga ranking/proyectos/creadores y gestiona donaciones y contacto.
export default function AboutScreen() {
  const { showToast, openAuth, setTab, openFanModal, openProjectPage, openDMWithUser } = useUIStore();
  const { spendCredits, addXP, name: myName, xp: myXP, city: myCity, id: myId, isAuthenticated } = useUserStore();
  const [contactOpen, setContactOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"privacy" | "terms" | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const handleContactSend = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) {
      showToast("Rellena todos los campos"); return;
    }
    setSendingContact(true);
    try {
      await api.post("/contact", { name: contactName.trim(), email: contactEmail.trim(), message: contactMsg.trim() });
      setContactOpen(false);
      setContactName(""); setContactEmail(""); setContactMsg("");
      showToast("¡Mensaje enviado! Te respondemos en 24h ✅");
    } catch {
      showToast("Error al enviar. Escríbenos a hola@elpactoclub.com");
    } finally {
      setSendingContact(false);
    }
  };
  const [rankTab, setRankTab] = useState<"global" | "ciudades">("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rankLoading, setRankLoading] = useState(true);
  const [fansCount, setFansCount] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [clubCreators, setClubCreators] = useState<{ id: string; userId: string; name: string; photoUrl?: string | null; avatar?: string }[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);

  useEffect(() => {
    api.get("/users/leaderboard")
      .then((r) => setLeaderboard(r.data))
      .catch(() => {})
      .finally(() => setRankLoading(false));
    api.get("/users/count")
      .then((r) => setFansCount(r.data?.count ?? null))
      .catch(() => {});
    api.get("/projects")
      .then((r) => setProjects(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProjects([]));
    api.get("/club-creators")
      .then((r) => setClubCreators(Array.isArray(r.data) ? r.data : []))
      .catch(() => setClubCreators([]))
      .finally(() => setCreatorsLoading(false));
  }, []);

  const handleDonar = (amount: number, project: string) => {
    if (!isAuthenticated) { openAuth(); return; }
    if (!spendCredits(amount)) { showToast("Necesitas más créditos ⚡"); setTab("store"); return; }
    addXP(amount);
    showToast(`Apoyaste ${project} · −${amount} ⚡ · +${amount} XP 🏀`);
  };

  const globalRanking = leaderboard.slice(0, 5).map((u, i) => ({
    pos: i + 1, id: u.id, name: u.name, avatar: u.avatar, city: u.city || "—", level: u.level,
    xp: u.xp.toLocaleString(), color: LEVEL_COLORS[u.level] || "#777", posColor: POS_COLORS[i] || "#777",
  }));

  const myRankIndex = myId ? leaderboard.findIndex((u) => u.id === myId) : -1;
  const myRankPos = myRankIndex >= 0 ? myRankIndex + 1 : null;
  const myInTop5 = myRankPos !== null && myRankPos <= 5;
  const xpToTop5 = !myInTop5 ? Math.max(0, (leaderboard[4]?.xp ?? 0) - myXP + 1) : 0;

  // Cities ranking from real leaderboard data
  const allCitiesSorted = (() => {
    const map: Record<string, { totalXP: number; fans: number; leader: string; country?: string }> = {};
    leaderboard.forEach((u) => {
      const c = u.city || "—";
      // leaderboard viene ordenado por XP desc, así el primer usuario de cada ciudad es el líder
      if (!map[c]) map[c] = { totalXP: 0, fans: 0, leader: u.name, country: u.country };
      map[c].totalXP += u.xp;
      map[c].fans += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].totalXP - a[1].totalXP);
  })();

  const cityRanking = allCitiesSorted.slice(0, 5).map(([city, data], i) => ({
    pos: i + 1, city, fans: data.fans, leader: data.leader, country: data.country,
    xp: data.totalXP.toLocaleString(), posColor: POS_COLORS[i] || "#777",
  }));

  const myCityIndex = myCity ? allCitiesSorted.findIndex(([c]) => c === myCity) : -1;
  const myCityRankPos = myCityIndex >= 0 ? myCityIndex + 1 : null;
  const myCityData = myCityIndex >= 0 ? allCitiesSorted[myCityIndex][1] : null;
  const myCityInTop5 = myCityRankPos !== null && myCityRankPos <= 5;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>

      {/* Hero — Quiénes somos card */}
      <div style={{ background: "#fff", borderRadius: 10, padding: "16px", color: "#000" }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: "#666", marginBottom: 5 }}>QUIÉNES SOMOS</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, lineHeight: 1.2, marginBottom: 7, color: "#000" }}>EL BALONCESTO YA NO ES SOLO DEPORTE</div>
        <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>Club nativo digital donde el basket se mezcla con impacto social, comunidad real y contenido que importa.</div>
      </div>

      {/* Creators — dynamic from backend */}
      {(creatorsLoading || clubCreators.length > 0) && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10, paddingLeft: 2 }}>CREADORES DEL CLUB</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto" }} className="hide-scrollbar">
            {creatorsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ width: 150, flexShrink: 0, background: "#1a1a1a", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ height: 140, background: "rgba(255,255,255,0.06)", animation: "pulse 1.4s ease-in-out infinite" }} />
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ height: 13, width: "70%", borderRadius: 4, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite", marginBottom: 6 }} />
                    <div style={{ height: 10, width: "45%", borderRadius: 4, background: "rgba(255,255,255,0.05)", animation: "pulse 1.4s ease-in-out infinite", marginBottom: 12 }} />
                    <div style={{ height: 30, borderRadius: 8, background: "rgba(255,255,255,0.05)", animation: "pulse 1.4s ease-in-out infinite" }} />
                  </div>
                </div>
              ))
            ) : clubCreators.map((c) => {
              const img = c.photoUrl;
              return (
                <div key={c.id} style={{ width: 150, flexShrink: 0, background: "#1a1a1a", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ height: 140, overflow: "hidden", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                    {img
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                      : <span>{c.avatar || "🏀"}</span>}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 10 }}>Creador</div>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) { openAuth(); return; }
                        openDMWithUser({ id: c.userId, name: c.name, avatar: c.avatar, role: "creator" });
                      }}
                      style={{ width: "100%", background: "#252525", border: "1px solid rgba(255,255,255,0.07)", color: "#fff", borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
                    >
                      ✉ Mensaje ⚡ 50
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranking */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingLeft: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-muted)" }}>RANKING DE LA COMUNIDAD</span>
          <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{(fansCount ?? leaderboard.length).toLocaleString("es")} {(fansCount ?? leaderboard.length) === 1 ? "fan" : "fans"}</span>
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
            {rankLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 28, height: 22, borderRadius: 4, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ height: 13, width: `${50 + (i % 3) * 15}%`, borderRadius: 4, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite" }} />
                    <div style={{ height: 10, width: "40%", borderRadius: 4, background: "rgba(255,255,255,0.05)", animation: "pulse 1.4s ease-in-out infinite" }} />
                  </div>
                  <div style={{ width: 48, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
                </div>
              ))
            ) : globalRanking.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>
                Sin datos de ranking todavía
              </div>
            ) : (
              globalRanking.map((r) => (
                <button
                  key={r.pos}
                  onClick={() => openFanModal(r.name, { id: r.id, city: r.city, level: r.level, xp: leaderboard[r.pos - 1]?.xp, avatar: r.avatar })}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, border: r.pos === 1 ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.05)", background: r.pos === 1 ? "linear-gradient(135deg,#1a1400,#252000)" : "#1a1a1a", cursor: "pointer", textAlign: "left", width: "100%" }}
                >
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, width: 28, textAlign: "center", flexShrink: 0, color: r.posColor }}>{r.pos}</div>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: r.color + "22", border: `2px solid ${r.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: r.color, flexShrink: 0, overflow: "hidden" }}>
                    {r.avatar?.startsWith("http") || r.avatar?.startsWith("data:")
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={r.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : r.avatar && r.avatar.length <= 2
                        ? <span style={{ fontSize: 20 }}>{r.avatar}</span>
                        : <span>{r.name[0]}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{r.city} · {r.level}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-accent)", flexShrink: 0 }}>{r.xp} XP</div>
                </button>
              ))
            )}

            {/* My position — show if authenticated and not already in top 5 */}
            {!rankLoading && isAuthenticated && !myInTop5 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: "linear-gradient(135deg,#1a1a10,#252515)", border: "1px solid rgba(240,224,64,0.3)", marginTop: 4 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--color-accent)", width: 28, textAlign: "center", flexShrink: 0 }}>
                  {myRankPos ? `#${myRankPos}` : "—"}
                </div>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(240,224,64,0.15)", border: "2px solid rgba(240,224,64,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--color-accent)", flexShrink: 0 }}>
                  {myName[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{myName}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{myCity || "—"} · {myXP.toLocaleString()} XP</div>
                </div>
                {xpToTop5 > 0 && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: "var(--color-muted)", lineHeight: 1.3 }}>te faltan</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA" }}>{xpToTop5.toLocaleString()} XP</div>
                    <div style={{ fontSize: 9, color: "var(--color-muted)" }}>para top 5</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cities ranking — con país de cada ciudad */}
        {rankTab === "ciudades" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rankLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 28, height: 22, borderRadius: 4, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ height: 13, width: `${45 + (i % 3) * 18}%`, borderRadius: 4, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite" }} />
                    <div style={{ height: 10, width: "55%", borderRadius: 4, background: "rgba(255,255,255,0.05)", animation: "pulse 1.4s ease-in-out infinite" }} />
                  </div>
                  <div style={{ width: 52, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
                </div>
              ))
            ) : cityRanking.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center", fontSize: 13, color: "var(--color-muted)" }}>Sin datos todavía</div>
            ) : (
              <>
                {cityRanking.map((c) => (
                  <div key={c.pos} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: c.pos === 1 ? "linear-gradient(135deg,#1a1400,#252000)" : "#1a1a1a", border: c.pos === 1 ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, width: 28, textAlign: "center", flexShrink: 0, color: c.posColor }}>{c.pos}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
                        {c.city}
                        {c.country && <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-muted)", marginLeft: 6 }}>{flagFor(c.country)} {c.country}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{c.fans} {c.fans === 1 ? "fan" : "fans"} · Líder: {c.leader}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, color: "var(--color-accent)", flexShrink: 0 }}>{c.xp} XP</div>
                  </div>
                ))}

                {/* My city card */}
                {isAuthenticated && myCity && myCityRankPos !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: "linear-gradient(135deg,#1a1a10,#252515)", border: "1px solid rgba(240,224,64,0.3)", marginTop: 4 }}>
                    <div style={{ fontSize: 14, flexShrink: 0 }}>📍</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: "var(--color-muted)", marginBottom: 3 }}>Tu ciudad — {myCity}</div>
                      {myCityInTop5 ? (
                        <>
                          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 1 }}>#{myCityRankPos} {myCity} lidera el ranking</div>
                          <div style={{ fontSize: 12, color: "#22C55E" }}>¡Seguíd así! 🔥</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 1 }}>#{myCityRankPos} — {myCityData?.fans ?? 0} {(myCityData?.fans ?? 0) === 1 ? "fan" : "fans"}</div>
                          <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{myCityData?.totalXP.toLocaleString() ?? 0} XP acumulados</div>
                        </>
                      )}
                    </div>
                    {!myCityInTop5 && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 9, color: "var(--color-muted)", lineHeight: 1.3 }}>te faltan</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA" }}>
                          {Math.max(0, (allCitiesSorted[4]?.[1]?.totalXP ?? 0) - (myCityData?.totalXP ?? 0) + 1).toLocaleString()} XP
                        </div>
                        <div style={{ fontSize: 9, color: "var(--color-muted)" }}>para top 5</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Impact projects — dynamic from backend */}
      {projects.map((p) => {
        const color = p.color || "#F59E0B";
        return (
          <div key={p.id} style={{ background: `linear-gradient(135deg, ${color}1a, ${color}0d)`, border: `1px solid ${color}40`, borderRadius: 10, padding: 16, cursor: "pointer" }} onClick={() => openProjectPage(p)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: p.imageUrl ? "#222" : `${color}26`, border: `1px solid ${color}4d`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, overflow: "hidden" }}>
                {p.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (p.emoji || "🏀")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1px", color, textTransform: "uppercase" }}>PROYECTO ACTIVO</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); openProjectPage(p); }} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}>Ver más →</button>
            </div>
            <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.55, marginBottom: 14 }}>
              {p.summary || p.description}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDonar(50, p.title); }}
              style={{ width: "100%", background: "var(--color-accent)", color: "#000", border: "none", padding: "13px 16px", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              Apoyar 50 ⚡
            </button>
          </div>
        );
      })}

      {/* Sponsors — ocultos durante el periodo de prueba (ver SHOW_SPONSORS arriba) */}
      {SHOW_SPONSORS && (
      <>
      {/* Sponsor Principal */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16, paddingLeft: 2 }}>SPONSOR PRINCIPAL</div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "32px 0", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
          {/* Nike swoosh — logo oficial */}
          <svg viewBox="0 0 24 24" width="220" height="80" fill="white" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nike">
            <path d="M24 7.8L6.442 15.276c-1.456.616-2.679.925-3.668.925-1.12 0-1.933-.392-2.437-1.177-.317-.504-.41-1.143-.28-1.918.13-.775.476-1.6 1.036-2.478.467-.71 1.232-1.643 2.297-2.8-.42.672-.715 1.31-.886 1.91-.32 1.13-.13 2.006.572 2.625.522.467 1.222.7 2.1.7.71 0 1.503-.15 2.38-.45L24 7.8z" />
          </svg>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6, color: "#fff", fontFamily: "Arial Black, Arial, sans-serif", textTransform: "uppercase" }}>NIKE</div>
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
      </>
      )}

      {/* CTA */}
      <div style={{ padding: "24px 20px", background: "#fff", borderRadius: 10, color: "#000", position: "relative", overflow: "hidden", marginTop: 4 }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "var(--accent)", opacity: 0.15, pointerEvents: "none" }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#888", marginBottom: 8, textTransform: "uppercase" }}>Únete</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, lineHeight: 1.1, marginBottom: 10, color: "#000" }}>
          ¿QUIERES SER<br />COLABORADOR<br />DE EL PACTO?
        </div>
        <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
          Llegamos a más de 1,200 fans comprometidos con el basket. Si tu marca quiere estar donde está la comunidad, hablemos.
        </div>
        <button
          onClick={() => setContactOpen(true)}
          style={{ background: "#000", color: "#fff", border: "none", padding: "11px 22px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        >
          Escribirnos →
        </button>
      </div>

      {/* Legal footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 10, color: "#444", letterSpacing: 0.5 }}>© 2025 Club Bàsquet El Pacto · NIF G56373806</div>
        <div style={{ display: "flex", gap: 20 }}>
          <button onClick={() => setLegalOpen("terms")} style={{ background: "transparent", border: "none", fontSize: 11, color: "var(--color-muted)", cursor: "pointer", fontFamily: "var(--font-body)", textDecoration: "underline", padding: 0 }}>Términos y condiciones</button>
          <button onClick={() => setLegalOpen("privacy")} style={{ background: "transparent", border: "none", fontSize: 11, color: "var(--color-muted)", cursor: "pointer", fontFamily: "var(--font-body)", textDecoration: "underline", padding: 0 }}>Política de privacidad</button>
        </div>
      </div>

      {/* Legal modal */}
      {legalOpen && (
        <div className="fixed inset-0 flex items-end lg:items-center justify-center lg:p-6" style={{ zIndex: 500, background: "rgba(0,0,0,0.85)" }}>
          <div className="rounded-t-2xl lg:rounded-2xl" style={{ background: "#111", display: "flex", flexDirection: "column", maxWidth: 640, width: "100%", height: "90dvh", maxHeight: "90dvh", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>
                {legalOpen === "privacy" ? "Política de Privacidad" : "Términos y Condiciones"}
              </div>
              <button onClick={() => setLegalOpen(null)} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px", fontSize: 12, lineHeight: 1.75, color: "#ccc", whiteSpace: "pre-wrap" }}>
              {legalOpen === "privacy" ? PRIVACY_TEXT : TERMS_TEXT}
            </div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contactOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => e.target === e.currentTarget && setContactOpen(false)}
        >
          <div style={{ background: "#1c1c1c", borderRadius: 16, width: "100%", maxWidth: 480, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Escríbenos</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>hola@elpactoclub.com · respondemos en 24h</div>
              </div>
              <button onClick={() => setContactOpen(false)} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Form */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Nombre</div>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Tu nombre o empresa"
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Email</div>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tu@email.com"
                    type="email"
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Mensaje</div>
                <textarea
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Cuéntanos sobre tu marca y cómo quieres colaborar..."
                  rows={4}
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fff", fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleContactSend}
                disabled={sendingContact}
                style={{ background: "var(--color-accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: sendingContact ? "not-allowed" : "pointer", fontFamily: "var(--font-heading)", letterSpacing: 1, opacity: sendingContact ? 0.7 : 1 }}
              >
                {sendingContact ? "ENVIANDO…" : "ENVIAR →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
