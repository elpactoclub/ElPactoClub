"use client";

// EN: Admin panel layout with JWT-based role guard, collapsible sidebar navigation, and a sticky topbar.
// ES: Layout del panel de administración con guardia de rol basada en JWT, navegación de barra lateral plegable y topbar fija.

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type AdminRole = "admin" | "creator";

// EN: Decodes a JWT payload (without verification) to read the role claim.
// ES: Decodifica el payload de un JWT (sin verificación) para leer el claim de rol.
function decodeToken(token: string): { role?: string } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: "📊", roles: ["admin", "creator"] },
  { href: "/admin/events",    label: "Eventos",     icon: "📅", roles: ["admin", "creator"] },
  { href: "/admin/users",     label: "Usuarios",    icon: "👥", roles: ["admin"] },
  { href: "/admin/posts",     label: "Posts",       icon: "💬", roles: ["admin"] },
  { href: "/admin/votes",     label: "Votaciones",  icon: "🗳", roles: ["admin"] },
  { href: "/admin/raffles",   label: "Sorteos",     icon: "🎁", roles: ["admin"] },
  { href: "/admin/store-benefits", label: "Beneficios", icon: "🏷️", roles: ["admin"] },
  { href: "/admin/projects",  label: "Proyectos",   icon: "🌍", roles: ["admin"] },
  { href: "/admin/club-creators", label: "Creadores", icon: "🎬", roles: ["admin"] },
  { href: "/admin/messages",  label: "Mensaje directo", icon: "✉️", roles: ["admin"] },
  { href: "/admin/missions",  label: "Misiones",    icon: "🎯", roles: ["admin"] },
  { href: "/admin/pricing",   label: "Precios",     icon: "💰", roles: ["admin"] },
];

// EN: Admin layout component guarding access by role, rendering sidebar nav and routing creators to their own panel.
// ES: Componente de layout del admin que guarda el acceso por rol, renderiza la navegación lateral y redirige a los creadores a su propio panel.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>("");
  const [adminName, setAdminName] = useState<string>("Admin");

  useEffect(() => {
    const token = localStorage.getItem("el_pacto_token");
    if (!token) {
      // Sin sesión: volver a la app (login normal)
      router.replace("/");
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded?.role) {
      router.replace("/");
      return;
    }
    if (decoded.role === "creator") {
      // Los creators van a su propio panel
      router.replace("/creator/dashboard");
      return;
    }
    if (decoded.role !== "admin") {
      // No es admin: a la app
      router.replace("/");
      return;
    }
    setRole("admin");
    setReady(true);
  }, [pathname, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Cargar foto y nombre reales del perfil
  useEffect(() => {
    const token = localStorage.getItem("el_pacto_token");
    if (!token) return;
    const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;
    fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => { if (u) { if (u.name) setAdminName(u.name); setAvatar(u.avatar ?? ""); } })
      .catch(() => {});
  }, []);

  if (!ready) return null;

  const visibleNav = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  function handleLogout() {
    localStorage.removeItem("el_pacto_token");
    router.push("/");
  }

  const currentPage = visibleNav.find((it) => pathname.startsWith(it.href));

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "#0a0a0a", color: "#fff", fontFamily: "var(--font-sans)" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
          className="md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={mobileOpen ? "admin-sidebar admin-sidebar-open" : "admin-sidebar"}
        style={{
          width: 256,
          flexShrink: 0,
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "#111",
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* Brand */}
        <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #F0E040, #FF6B1A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚡</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#888", textTransform: "uppercase" }}>El Pacto BC</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, lineHeight: 1.1 }}>ADMIN</div>
          </div>
          {/* Cerrar sidebar (solo móvil) */}
          <button
            className="admin-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Volver a la app del fan */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "12px 10px 0",
            padding: "9px 12px",
            borderRadius: 9,
            fontSize: 12.5,
            color: "var(--color-accent)",
            background: "rgba(240,224,64,0.06)",
            border: "1px solid rgba(240,224,64,0.18)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 14 }}>‹</span>
          <span>Volver a la app</span>
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 9,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#000" : "#bbb",
                  background: active ? "var(--color-accent)" : "transparent",
                  textDecoration: "none",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = "rgba(255,255,255,0.06)"); }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = "transparent"); }}
              >
                <span style={{ fontSize: 17, width: 20, textAlign: "center" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 10px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#aaa", flexShrink: 0, overflow: "hidden" }}>
              {avatar && (avatar.startsWith("http") || avatar.startsWith("data:"))
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (adminName?.[0]?.toUpperCase() ?? "A")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{adminName}</div>
              <div style={{ fontSize: 10, color: "#777" }}>Sesión activa</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 9,
              fontSize: 12.5,
              color: "#aaa",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: 14 }}>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        {/* Topbar */}
        <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d0d", position: "sticky", top: 0, zIndex: 30 }}>
          <button
            className="admin-burger md:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.5, textTransform: "uppercase" }}>Panel admin</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
              {currentPage?.label ?? "Admin"}
            </div>
          </div>
        </header>

        <main className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "26px 22px 32px" }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 767px) {
          .admin-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.22s ease;
            box-shadow: 0 0 0 100vw rgba(0,0,0,0);
          }
          .admin-sidebar-open {
            transform: translateX(0) !important;
            box-shadow: 8px 0 28px rgba(0,0,0,0.6);
          }
          .admin-sidebar-close {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .admin-burger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
