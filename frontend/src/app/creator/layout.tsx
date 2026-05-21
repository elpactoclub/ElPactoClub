"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

function decodeToken(token: string): { role?: string; name?: string } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

const NAV_ITEMS = [
  { href: "/creator/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/creator/posts", label: "Mis posts", icon: "📝" },
  { href: "/creator/events", label: "Mis charlas", icon: "🎙" },
  { href: "/creator/messages", label: "Mensajes fans", icon: "💬" },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [creatorName, setCreatorName] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("el_pacto_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const decoded = decodeToken(token);
    if (decoded?.role === "creator" || decoded?.role === "admin") {
      setCreatorName(decoded.name ?? (decoded.role === "admin" ? "Admin" : "Creador"));
      setReady(true);
    } else {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!ready) return null;

  function handleLogout() {
    localStorage.removeItem("el_pacto_token");
    router.push("/admin/login");
  }

  const currentPage = NAV_ITEMS.find((it) => pathname.startsWith(it.href));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "var(--font-sans)" }}>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
          className="md:hidden"
        />
      )}

      <aside
        className={mobileOpen ? "admin-sidebar admin-sidebar-open" : "admin-sidebar"}
        style={{ width: 256, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.08)", background: "#111", position: "relative", zIndex: 50 }}
      >
        {/* Brand */}
        <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #A78BFA, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎙</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#888", textTransform: "uppercase" }}>El Pacto BC</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: 2, lineHeight: 1.1 }}>CREATOR</div>
          </div>
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
          style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 10px 0", padding: "9px 12px", borderRadius: 9, fontSize: 12.5, color: "#A78BFA", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", textDecoration: "none", fontWeight: 600 }}
        >
          <span style={{ fontSize: 14 }}>‹</span>
          <span>Volver a la app</span>
        </Link>

        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map((item) => {
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
                  color: active ? "#fff" : "#bbb",
                  background: active ? "linear-gradient(135deg, #A78BFA, #EC4899)" : "transparent",
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

        <div style={{ padding: "14px 12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 10px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #A78BFA, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {creatorName?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{creatorName}</div>
              <div style={{ fontSize: 10, color: "#777" }}>Creator</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, color: "#aaa", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: 14 }}>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d0d", position: "sticky", top: 0, zIndex: 30 }}>
          <button
            className="admin-burger md:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}
          >
            ☰
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.5, textTransform: "uppercase" }}>Panel creator</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{currentPage?.label ?? "Creator"}</div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "26px 22px 32px" }}>{children}</main>
      </div>
    </div>
  );
}
