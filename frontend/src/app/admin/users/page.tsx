"use client";

// EN: Admin users page for listing, searching, editing roles/credits/XP and deleting fan accounts.
// ES: Página de usuarios del admin para listar, buscar, editar roles/créditos/XP y eliminar cuentas de fans.

import { useEffect, useState, useCallback } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import { CITIES_BY_COUNTRY, COUNTRIES } from "@/data/locations";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface User {
  id: string;
  name: string;
  email: string;
  role: "fan" | "socio" | "creator" | "admin" | "moderador";
  isSocio: boolean;
  credits: number;
  xp: number;
  city?: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = { fan: "Cliente", socio: "Cliente", creator: "Creador", admin: "Admin", moderador: "Moderador" };


function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

function SkeletonRow() {
  return (
    <tr>
      {[140, 180, 70, 60, 60, 80, 100].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="skeleton" style={{ width: w, height: 13 }} />
        </td>
      ))}
    </tr>
  );
}

// EN: Users admin page component with paginated list, search, inline credit adjustments and role changes.
// ES: Componente de página de usuarios del admin con lista paginada, búsqueda, ajustes de créditos en línea y cambios de rol.
export default function UsersPage() {
  const { confirm, alert, ConfirmUI } = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User> & { password?: string }>({});
  const [saving, setSaving] = useState(false);
  const [bulkXpAmount, setBulkXpAmount] = useState(0);
  const [bulkXpMode, setBulkXpMode] = useState<"add" | "set">("add");
  const [bulkXpSaving, setBulkXpSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", name: "", role: "fan", city: "Barcelona", country: "España", isSocio: false });
  const [creating, setCreating] = useState(false);
  const [badgesUser, setBadgesUser] = useState<User | null>(null);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [badgeCatalog, setBadgeCatalog] = useState<{ code: string; name: string; emoji: string; description: string }[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filter) params.set("filter", filter);
    fetch(`${API}/admin/users?${params}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, city: u.city, role: u.role, credits: u.credits, xp: u.xp, isSocio: u.isSocio, password: "" });
  }

  async function saveEdit() {
    if (!editUser) return;
    if (editForm.password && editForm.password.length < 8) {
      await alert({ title: "Contraseña corta", message: "La nueva contraseña debe tener al menos 8 caracteres (o déjala vacía para no cambiarla).", confirmLabel: "Ok" });
      return;
    }
    setSaving(true);
    try {
      // No enviar password si está vacío
      const payload: Record<string, unknown> = { ...editForm };
      if (!payload.password) delete payload.password;
      const res = await fetch(`${API}/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(String(d?.message ?? ""));
      }
      setEditUser(null);
      load();
    } catch (e) {
      await alert({ title: "Error al guardar", message: (e as Error).message || "No se pudieron guardar los cambios. Inténtalo de nuevo.", confirmLabel: "Entendido" });
    } finally {
      setSaving(false);
    }
  }

  async function createUser() {
    if (!createForm.email.trim() || createForm.password.length < 8) {
      await alert({ title: "Datos incompletos", message: "Pon un email válido y una contraseña de al menos 8 caracteres.", confirmLabel: "Ok" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = String(d?.message ?? "");
        throw new Error(/registered|registrado|exist/i.test(msg) ? "Ese email ya está registrado." : (msg || "No se pudo crear el usuario."));
      }
      setShowCreate(false);
      setCreateForm({ email: "", password: "", name: "", role: "fan", city: "Barcelona", country: "España", isSocio: false });
      setSearch(""); setSearchInput(""); setFilter(""); setPage(1);
      load();
    } catch (e) {
      await alert({ title: "Error", message: (e as Error).message || "No se pudo crear el usuario.", confirmLabel: "Entendido" });
    } finally {
      setCreating(false);
    }
  }

  async function applyBulkXP() {
    const label = bulkXpMode === "add"
      ? `Añadir ${bulkXpAmount} XP a todos los usuarios`
      : `Establecer ${bulkXpAmount} XP para todos los usuarios`;
    const ok = await confirm({
      title: "XP masivo",
      message: label,
      detail: "Esta acción afecta a todos los usuarios registrados y recalcula su nivel automáticamente.",
      confirmLabel: "Aplicar",
    });
    if (!ok) return;
    setBulkXpSaving(true);
    try {
      const res = await fetch(`${API}/admin/users/bulk-xp`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ mode: bulkXpMode, amount: bulkXpAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        load();
        await alert({ title: "XP actualizado", message: `Se actualizó el XP de ${data.affected} usuarios correctamente.`, confirmLabel: "Perfecto" });
      } else {
        await alert({ title: "Error", message: "No se pudo actualizar el XP. Inténtalo de nuevo.", confirmLabel: "Entendido", danger: true });
      }
    } finally {
      setBulkXpSaving(false);
    }
  }

  async function deleteUser(id: string, name: string) {
    const ok = await confirm({
      title: "Eliminar usuario",
      message: `¿Seguro que quieres eliminar a ${name}?`,
      detail: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    await fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  async function openBadges(u: User) {
    setBadgesUser(u);
    setBadgesLoading(true);
    try {
      const [catalog, owned] = await Promise.all([
        fetch(`${API}/admin/badges/catalog`, { headers: authHeader() }).then(r => r.json()),
        fetch(`${API}/admin/users/${u.id}/badges`, { headers: authHeader() }).then(r => r.json()),
      ]);
      setBadgeCatalog(Array.isArray(catalog) ? catalog : []);
      setUserBadges(Array.isArray(owned) ? owned.map((b: { badgeCode: string }) => b.badgeCode) : []);
    } finally {
      setBadgesLoading(false);
    }
  }

  async function toggleBadge(badgeCode: string) {
    if (!badgesUser) return;
    const hasIt = userBadges.includes(badgeCode);
    if (hasIt) {
      await fetch(`${API}/admin/users/${badgesUser.id}/badges/${badgeCode}`, { method: "DELETE", headers: authHeader() });
      setUserBadges(prev => prev.filter(c => c !== badgeCode));
    } else {
      await fetch(`${API}/admin/users/${badgesUser.id}/badges/${badgeCode}`, { method: "POST", headers: authHeader() });
      setUserBadges(prev => [...prev, badgeCode]);
    }
  }

  const roleBadge = (u: User) => {
    if (u.role === "admin") return "admin-badge-red";
    if (u.role === "creator") return "admin-badge-purple";
    if (u.role === "moderador") return "admin-badge-blue";
    if (u.isSocio) return "admin-badge-yellow";
    return "admin-badge-gray";
  };

  return (
    <div className="admin-page">
      {ConfirmUI}

      <div className="admin-header">
        <h1 className="admin-title">USUARIOS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({total})</span></h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} style={{ display: "flex", gap: 8 }}>
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Buscar por nombre, email, ciudad..." className="admin-input" style={{ width: 260, maxWidth: "100%" }} />
            <button type="submit" className="admin-btn-ghost">Buscar</button>
          </form>
          <button onClick={() => setShowCreate(true)} className="admin-btn-primary">+ Nuevo usuario</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ value: "", label: "Todos" }, { value: "socio", label: "Socios" }, { value: "creator", label: "Creadores" }, { value: "admin", label: "Admins" }, { value: "fan", label: "Clientes" }].map((f) => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", background: filter === f.value ? "#F0E040" : "transparent", color: filter === f.value ? "#000" : "#888", borderColor: filter === f.value ? "#F0E040" : "rgba(255,255,255,0.12)" }}>{f.label}</button>
        ))}
      </div>

      {/* Bulk XP */}
      <div style={{ background: "#141414", border: "1px solid rgba(240,224,64,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#F0E040", flexShrink: 0 }}>XP masivo</span>
        <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }}>
          {(["add", "set"] as const).map((m) => (
            <button key={m} onClick={() => setBulkXpMode(m)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: bulkXpMode === m ? "#F0E040" : "transparent", color: bulkXpMode === m ? "#000" : "#888" }}>
              {m === "add" ? "Añadir" : "Establecer"}
            </button>
          ))}
        </div>
        <input type="number" min={0} value={bulkXpAmount} onChange={(e) => setBulkXpAmount(Number(e.target.value))} placeholder="Cantidad XP" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#fff", outline: "none", width: 130 }} />
        <span style={{ fontSize: 12, color: "#555" }}>{bulkXpMode === "add" ? `→ +${bulkXpAmount} XP a todos` : `→ todos quedan en ${bulkXpAmount} XP`}</span>
        <button onClick={applyBulkXP} disabled={bulkXpSaving || bulkXpAmount < 0} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(240,224,64,0.15)", border: "1px solid rgba(240,224,64,0.3)", color: "#F0E040", marginLeft: "auto" }}>
          {bulkXpSaving ? "Aplicando..." : "Aplicar a todos"}
        </button>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Créditos</th><th>XP</th><th>Ciudad</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="empty">Sin resultados</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td data-label="Nombre" style={{ fontWeight: 600, color: "#fff" }}>{u.name}</td>
                <td data-label="Email" className="muted">{u.email}</td>
                <td data-label="Rol"><span className={`admin-badge ${roleBadge(u)}`}>{ROLE_LABELS[u.role]}</span></td>
                <td data-label="Créditos"><span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{u.credits} ⚡</span></td>
                <td data-label="XP"><span style={{ color: "#c4b5fd", fontWeight: 600 }}>{u.xp} XP</span></td>
                <td data-label="Ciudad" className="muted">{u.city ?? "—"}</td>
                <td data-label="" className="actions">
                  <button onClick={() => openEdit(u)} className="admin-btn-edit">Editar</button>
                  <button onClick={() => openBadges(u)} className="admin-btn-ghost" style={{ fontSize: 11 }}>Insignias</button>
                  <button onClick={() => deleteUser(u.id, u.name)} className="admin-btn-delete">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Anterior</button>
          <span className="info">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente →</button>
        </div>
      )}

      {editUser && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setEditUser(null)}>
          <div className="admin-modal">
            <div>
              <h2>EDITAR USUARIO</h2>
              <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{editUser.email}</p>
            </div>
            {[{ key: "name", label: "Nombre", type: "text" }, { key: "email", label: "Correo", type: "email" }, { key: "city", label: "Ciudad", type: "text" }, { key: "credits", label: "Créditos", type: "number" }, { key: "xp", label: "XP", type: "number" }].map(({ key, label, type }) => (
              <div key={key}>
                <label className="admin-label">{label}</label>
                <input type={type} value={(editForm as Record<string, string | number | boolean | undefined>)[key] as string ?? ""} onChange={(e) => setEditForm({ ...editForm, [key]: type === "number" ? Number(e.target.value) : e.target.value })} className="admin-input" />
              </div>
            ))}
            <div>
              <label className="admin-label">Nueva contraseña</label>
              <input type="password" value={editForm.password ?? ""} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="admin-input" placeholder="Déjalo vacío para no cambiarla" autoComplete="new-password" />
            </div>
            <div>
              <label className="admin-label">Rol</label>
              <select value={editForm.role === "socio" ? "fan" : (editForm.role ?? "fan")} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User["role"] })} className="admin-input">
                <option value="fan">Cliente</option>
                <option value="creator">Creador</option>
                <option value="moderador">Moderador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ddd", cursor: "pointer" }}>
              <input type="checkbox" checked={editForm.isSocio ?? false} onChange={(e) => setEditForm({ ...editForm, isSocio: e.target.checked })} style={{ accentColor: "#F0E040" }} />
              Es Socio
            </label>
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button onClick={saveEdit} disabled={saving} className="admin-btn-primary" style={{ flex: 1 }}>{saving ? "Guardando..." : "Guardar"}</button>
              <button onClick={() => setEditUser(null)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Badges modal */}
      {badgesUser && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setBadgesUser(null)}>
          <div className="admin-modal" style={{ maxWidth: 520 }}>
            <div>
              <h2>INSIGNIAS — {badgesUser.name}</h2>
              <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>Haz clic para añadir o quitar insignias</p>
            </div>
            {badgesLoading ? (
              <div style={{ color: "#666", textAlign: "center", padding: 20 }}>Cargando...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {badgeCatalog.map(b => {
                  const owned = userBadges.includes(b.code);
                  return (
                    <button
                      key={b.code}
                      onClick={() => toggleBadge(b.code)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        borderRadius: 10, border: `1px solid ${owned ? "rgba(240,224,64,0.4)" : "rgba(255,255,255,0.08)"}`,
                        background: owned ? "rgba(240,224,64,0.08)" : "#141414",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{b.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: owned ? "#F0E040" : "#ccc" }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>{b.description}</div>
                      </div>
                      {owned && <span style={{ marginLeft: "auto", fontSize: 10, color: "#F0E040" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={() => setBadgesUser(null)} className="admin-btn-ghost" style={{ width: "100%" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setShowCreate(false)}>
          <div className="admin-modal">
            <div>
              <h2>NUEVO USUARIO</h2>
              <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>Crea una cuenta manualmente desde el panel.</p>
            </div>
            <div>
              <label className="admin-label">Email *</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="admin-input" placeholder="usuario@email.com" />
            </div>
            <div>
              <label className="admin-label">Contraseña * (mín. 8)</label>
              <input type="text" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="admin-input" placeholder="Contraseña inicial" />
            </div>
            <div>
              <label className="admin-label">Nombre</label>
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="admin-input" placeholder="Nombre del usuario" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="admin-label">País</label>
                <select
                  value={createForm.country}
                  onChange={(e) => { const c = e.target.value; setCreateForm({ ...createForm, country: c, city: (CITIES_BY_COUNTRY[c] ?? ["Otra"])[0] }); }}
                  className="admin-input"
                >
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Ciudad</label>
                <select value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className="admin-input">
                  {(CITIES_BY_COUNTRY[createForm.country] ?? ["Otra"]).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="admin-label">Rol</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="admin-input">
                <option value="fan">Cliente</option>
                <option value="creator">Creador</option>
                <option value="moderador">Moderador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ddd", cursor: "pointer" }}>
              <input type="checkbox" checked={createForm.isSocio} onChange={(e) => setCreateForm({ ...createForm, isSocio: e.target.checked })} style={{ accentColor: "#F0E040" }} />
              Es Socio
            </label>
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button onClick={createUser} disabled={creating} className="admin-btn-primary" style={{ flex: 1 }}>{creating ? "Creando..." : "Crear usuario"}</button>
              <button onClick={() => setShowCreate(false)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
