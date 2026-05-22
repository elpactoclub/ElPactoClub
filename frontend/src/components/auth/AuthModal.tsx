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

  const inputCls = "w-full bg-gray3 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors";

  const content = (
    <div className="flex flex-col">
      {/* Brand header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-heading text-accent text-xs tracking-[3px] mb-0.5">EL PACTO BC</div>
          <div className="font-heading text-2xl tracking-[2px]">
            {isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
          </div>
        </div>
        <button
          onClick={closeAuth}
          className="w-9 h-9 rounded-full bg-gray3 flex items-center justify-center text-muted hover:text-white hover:bg-gray2 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {!isLogin && (
          <>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold tracking-[1.5px] block mb-1.5">
                Nombre de Fan
              </label>
              <input
                type="text"
                required
                placeholder="Ej. BasketMaster99"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold tracking-[1.5px] block mb-1.5">
                Ciudad
              </label>
              <select
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className={inputCls}
              >
                {["Barcelona","Madrid","Valencia","Sevilla","Bilbao","Zaragoza","Málaga","Otra"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="text-[10px] text-muted uppercase font-bold tracking-[1.5px] block mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="fan@elpacto.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-[10px] text-muted uppercase font-bold tracking-[1.5px] block mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className={inputCls}
          />
        </div>

        {!isLogin && (
          <div>
            <label className="text-[10px] text-muted uppercase font-bold tracking-[1.5px] block mb-1.5">
              Código referido <span className="normal-case font-normal text-muted">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="PACTO-XXXX"
              value={referredByInput}
              onChange={(e) => setReferredByInput(e.target.value)}
              className={inputCls}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-black font-heading text-base tracking-[2px] py-3.5 rounded-xl mt-2 disabled:opacity-50 hover:brightness-110 transition-all active:scale-[0.98]"
        >
          {loading ? "CARGANDO..." : isLogin ? "ENTRAR 🏀" : "REGISTRARME ⚡"}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="text-[12px] text-accent underline text-center mt-4"
      >
        {isLogin ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );

  return (
    <>
      {/* ── Mobile: bottom sheet ─────────────────────── */}
      <div className="sm:hidden fixed inset-0 z-[500]">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeAuth} />
        <div className="absolute bottom-0 left-0 right-0 bg-gray rounded-t-3xl px-6 pt-6 pb-10 animate-slide-up max-h-[92vh] overflow-y-auto">
          {content}
        </div>
      </div>

      {/* ── Desktop: centered modal ───────────────────── */}
      <div className="hidden sm:block fixed inset-0 z-[500]">
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeAuth} />
        <div
          className="absolute bg-gray border border-border rounded-2xl px-8 py-7 animate-dialog-in shadow-2xl"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            maxWidth: 460,
          }}
        >
          {content}
        </div>
      </div>
    </>
  );
}
