"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

function decodeToken(token: string): { role?: string } | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Credenciales incorrectas");
        return;
      }
      const data = await res.json();
      const decoded = decodeToken(data.access_token);
      if (!decoded?.role || !["admin", "creator"].includes(decoded.role)) {
        setError("No tienes permisos de acceso al panel");
        return;
      }
      localStorage.setItem("el_pacto_token", data.access_token);
      // Creators van al panel creator, admins al panel admin
      router.replace(decoded.role === "creator" ? "/creator/dashboard" : "/admin/dashboard");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl font-bold tracking-tight">El Pacto BC</p>
          <p className="text-zinc-400 text-sm mt-1">Panel de administración</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6 space-y-4 border border-zinc-800">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              placeholder="admin@elpactobc.com"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
          >
            {loading ? "Accediendo..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
