"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";

export default function AuthModal() {
  const isAuthOpen = useUIStore((s: any) => s.isAuthOpen || false);
  const closeAuth = () => useUIStore.setState({ isAuthOpen: false } as any);
  const { showToast } = useUIStore();
  const { login, registerUser } = useUserStore();

  const [isLogin, setIsLogin] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cityInput, setCityInput] = useState("Barcelona");
  const [referredByInput, setReferredByInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const ok = await login(emailInput, passwordInput);
      if (ok) { showToast("¡Sesión iniciada! 🏀"); closeAuth(); }
      else showToast("Credenciales incorrectas ❌");
    } else {
      const ok = await registerUser(emailInput, passwordInput, nameInput, cityInput, referredByInput);
      if (ok) { showToast("¡Bienvenido a El Pacto! ⚡"); closeAuth(); }
      else showToast("Error al crear cuenta ❌");
    }
    setLoading(false);
  };

  const fields = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              className="w-full bg-gray2 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted uppercase font-bold tracking-[1px] block mb-1">
              Ciudad
            </label>
            <select
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            >
              {["Barcelona","Madrid","Valencia","Sevilla","Bilbao","Zaragoza","Málaga","Otra"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
          className="w-full bg-gray2 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
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
          className="w-full bg-gray2 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
        />
      </div>

      {!isLogin && (
        <div>
          <label className="text-[10px] text-muted uppercase font-bold tracking-[1px] block mb-1">
            Código de Referido <span className="normal-case font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="PACTO-XXXX"
            value={referredByInput}
            onChange={(e) => setReferredByInput(e.target.value)}
            className="w-full bg-gray2 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent text-black font-heading text-sm tracking-[1px] py-3 rounded-xl mt-1 disabled:opacity-50 hover:brightness-110 transition-all"
      >
        {loading ? "CARGANDO..." : isLogin ? "ENTRAR 🏀" : "REGISTRARME ⚡"}
      </button>

      <button
        type="button"
        onClick={() => setIsLogin(!isLogin)}
        className="text-[12px] text-accent underline text-center mt-1"
      >
        {isLogin ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </form>
  );

  const header = (
    <div className="flex justify-between items-center mb-5">
      <div className="font-heading text-lg tracking-[1px]">
        {isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
      </div>
      <button
        onClick={closeAuth}
        className="bg-[#1a1a1a] text-muted w-8 h-8 rounded-full flex items-center justify-center text-xs hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobile: bottom sheet ─────────────────────────────── */}
      <div className="sm:hidden fixed inset-0 z-[500]">
        <div className="absolute inset-0 bg-black/80" onClick={closeAuth} />
        <div className="absolute bottom-0 left-0 right-0 bg-gray rounded-t-3xl p-6 pb-10 animate-slide-up">
          {header}
          {fields}
        </div>
      </div>

      {/* ── Desktop: centered modal ───────────────────────────── */}
      <div className="hidden sm:block fixed inset-0 z-[500]">
        <div className="absolute inset-0 bg-black/80" onClick={closeAuth} />
        <div
          className="absolute bg-gray border border-border rounded-2xl p-8 animate-dialog-in"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            maxWidth: 440,
          }}
        >
          {header}
          {fields}
        </div>
      </div>
    </>
  );
}
