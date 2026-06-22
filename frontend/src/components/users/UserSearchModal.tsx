"use client";

import { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

interface SearchUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  xp: number;
  level: string;
  city?: string;
  isSocio: boolean;
  isFollowing: boolean;
}

const LEVEL_COLOR: Record<string, string> = {
  Rookie: "#888",
  Starter: "#60A5FA",
  MVP: "#A78BFA",
  Leyenda: "#F0E040",
};

export default function UserSearchModal() {
  const { isUserSearchOpen, closeUserSearch, openUserProfile } = useUIStore();
  const { isAuthenticated } = useUserStore();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isUserSearchOpen) { setQ(""); setResults([]); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [isUserSearchOpen]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get(`/users/search?q=${encodeURIComponent(q.trim())}`);
        setResults(Array.isArray(r.data) ? r.data : []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  if (!isUserSearchOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px 20px" }}
      onClick={(e) => e.target === e.currentTarget && closeUserSearch()}
    >
      <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 500, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 90px)" }}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar fans, creadores..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#fff", fontFamily: "inherit" }}
          />
          {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>}
          <button onClick={closeUserSearch} style={{ background: "#1a1a1a", border: "none", color: "#555", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "4px 8px", borderRadius: 6 }}>Esc</button>
        </div>

        {/* Results */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {loading && <div style={{ textAlign: "center", color: "#666", padding: "24px", fontSize: 13 }}>Buscando...</div>}

          {!loading && q.length >= 2 && results.length === 0 && (
            <div style={{ textAlign: "center", color: "#666", padding: "24px", fontSize: 13 }}>Sin resultados para "{q}"</div>
          )}

          {!loading && q.length < 2 && (
            <div style={{ textAlign: "center", color: "#555", padding: "24px", fontSize: 13 }}>Escribe al menos 2 caracteres</div>
          )}

          {results.map((u) => (
            <div
              key={u.id}
              onClick={() => { closeUserSearch(); openUserProfile(u.id); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                {u.avatar?.startsWith("http") || u.avatar?.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>{u.avatar}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{u.name}</span>
                  {u.role === "creator" && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "1px 6px", borderRadius: 3, background: "rgba(167,139,250,0.2)", color: "#A78BFA" }}>CREADOR</span>}
                  {u.isSocio && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "1px 6px", borderRadius: 3, background: "rgba(240,224,64,0.15)", color: "#F0E040" }}>SOCIO</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#666" }}>
                  <span style={{ color: LEVEL_COLOR[u.level] ?? "#888" }}>{u.level}</span>
                  <span>·</span>
                  <span>{u.xp.toLocaleString("es")} XP</span>
                  {u.city && <><span>·</span><span>{u.city}</span></>}
                </div>
              </div>
              {u.isFollowing && isAuthenticated && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", flexShrink: 0 }}>Siguiendo</span>
              )}
              <span style={{ fontSize: 16, color: "#444", flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
