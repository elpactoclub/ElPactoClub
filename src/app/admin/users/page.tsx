"use client";

import { useEffect, useState, useCallback } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface User {
  id: string;
  name: string;
  email: string;
  role: "fan" | "socio" | "creator" | "admin";
  isSocio: boolean;
  credits: number;
  xp: number;
  city?: string;
  createdAt: string;
}

// 3 roles base. 'socio' es legacy — se trata como fan+isSocio en la UI nueva.
const ROLE_LABELS: Record<string, string> = {
  fan: "Cliente",
  socio: "Cliente",
  creator: "Creador",
  admin: "Admin",
};

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    fetch(`${API}/admin/users?${params}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setError("Error cargando usuarios"));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name: u.name, city: u.city, role: u.role, credits: u.credits, xp: u.xp, isSocio: u.isSocio });
  }

  async function saveEdit() {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      setEditUser(null);
      load();
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("¿Eliminar usuario? Esta acción no se puede deshacer.")) return;
    await fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: authHeader() });
    load();
  }

  const roleBadge = (u: User) => {
    if (u.role === "admin") return "admin-badge-red";
    if (u.role === "creator") return "admin-badge-purple";
    if (u.isSocio) return "admin-badge-yellow";
    return "admin-badge-gray";
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">USUARIOS <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({total})</span></h1>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} style={{ display: "flex", gap: 8 }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, email, ciudad..."
            className="admin-input"
            style={{ width: 260 }}
          />
          <button type="submit" className="admin-btn-primary">Buscar</button>
        </form>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 14 }}>{error}</p>}

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Créditos</th>
              <th>XP</th>
              <th>Ciudad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: "#fff" }}>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td><span className={`admin-badge ${roleBadge(u)}`}>{ROLE_LABELS[u.role]}</span></td>
                <td><span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{u.credits} ⚡</span></td>
                <td><span style={{ color: "#c4b5fd", fontWeight: 600 }}>{u.xp} XP</span></td>
                <td className="muted">{u.city ?? "—"}</td>
                <td className="actions">
                  <button onClick={() => openEdit(u)} className="admin-btn-edit">Editar</button>
                  <button onClick={() => deleteUser(u.id)} className="admin-btn-delete">Eliminar</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={7} className="empty">Sin resultados</td></tr>
            )}
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

      {/* Edit Modal */}
      {editUser && (
        <div className="admin-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && setEditUser(null)}>
          <div className="admin-modal">
            <div>
              <h2>EDITAR USUARIO</h2>
              <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{editUser.email}</p>
            </div>

            {[
              { key: "name", label: "Nombre", type: "text" },
              { key: "city", label: "Ciudad", type: "text" },
              { key: "credits", label: "Créditos", type: "number" },
              { key: "xp", label: "XP", type: "number" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="admin-label">{label}</label>
                <input
                  type={type}
                  value={(editForm as Record<string, string | number | boolean | undefined>)[key] as string ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                  className="admin-input"
                />
              </div>
            ))}

            <div>
              <label className="admin-label">Rol</label>
              <select
                value={editForm.role === "socio" ? "fan" : (editForm.role ?? "fan")}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User["role"] })}
                className="admin-input"
              >
                <option value="fan">Cliente</option>
                <option value="creator">Creador</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ddd", cursor: "pointer" }}>
              <input type="checkbox" checked={editForm.isSocio ?? false} onChange={(e) => setEditForm({ ...editForm, isSocio: e.target.checked })} style={{ accentColor: "#F0E040" }} />
              Es Socio
            </label>

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button onClick={saveEdit} disabled={saving} className="admin-btn-primary" style={{ flex: 1 }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => setEditUser(null)} className="admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
