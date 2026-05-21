"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

export default function AuthModal() {
  const { isProfileOpen, closeProfile, showToast } = useUIStore();
  const { login, registerUser, isAuthenticated, name, email, logout, referralCode, credits, level } = useUserStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cityInput, setCityInput] = useState("Barcelona");
  const [referredByInput, setReferredByInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Trigger modal externally using custom state or global action
  // For simplicity, we can hook it to the global layout or let users open it from Profile button.
  // Let's make it a global modal that is opened via custom event or global store trigger.
  // We can add `isAuthOpen` to useUIStore!
  
  const isAuthOpen = useUIStore((s: any) => s.isAuthOpen || false);
  const closeAuth = () => useUIStore.setState({ isAuthOpen: false } as any);

  if (!isAuthOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const success = await login(emailInput, passwordInput);
      if (success) {
        showToast("¡Sesión iniciada con éxito! 🏀");
        closeAuth();
      } else {
        showToast("Error: Credenciales incorrectas ❌");
      }
    } else {
      const success = await registerUser(emailInput, passwordInput, nameInput, cityInput, referredByInput);
      if (success) {
        showToast("¡Cuenta creada! Bienvenido a El Pacto ⚡");
        closeAuth();
      } else {
        showToast("Error al registrar cuenta ❌");
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && closeAuth()}
    >
      <div className="bg-gray border border-border rounded-2xl w-full max-w-[380px] p-6 animate-badge-pop">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="font-heading text-xl tracking-[1px]">
            {isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
          </div>
          <button
            onClick={closeAuth}
            className="bg-gray2 text-muted w-7 h-7 rounded-full flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div>
                <label className="text-[10px] text-muted uppercase font-bold tracking-[1px] block mb-1">
                  Nombre de Fan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. BasketMaster99"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-gray2 border border-border rounded-lg px-3 py-2 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted uppercase font-bold tracking-[1px] block mb-1">
                  Ciudad
                </label>
                <select
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full bg-gray2 border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                >
                  <option value="Barcelona">Barcelona</option>
                  <option value="Madrid">Madrid</option>
                  <option value="Valencia">Valencia</option>
                  <option value="Sevilla">Sevilla</option>
                  <option value="Bilbao">Bilbao</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] text-muted uppercase font-bold tracking-[1px] block mb-1">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="fan@elpacto.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-gray2 border border-border rounded-lg px-3 py-2 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase font-bold tracking-[1px] block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-gray2 border border-border rounded-lg px-3 py-2 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-[10px] text-muted uppercase font-bold tracking-[1px] block mb-1">
                Código de Referido (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. PACTO-XXXX"
                value={referredByInput}
                onChange={(e) => setReferredByInput(e.target.value)}
                className="w-full bg-gray2 border border-border rounded-lg px-3 py-2 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black font-heading text-sm tracking-[1px] py-3 rounded-lg mt-2 disabled:opacity-50"
          >
            {loading ? "CARGANDO..." : isLogin ? "ENTRAR 🏀" : "REGISTRARME ⚡"}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[11px] text-accent underline bg-transparent border-none"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
