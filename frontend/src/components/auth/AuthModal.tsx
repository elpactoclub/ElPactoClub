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
  const [emailInput, setEmailInput]       = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput]         = useState("");
  const [countryInput, setCountryInput]   = useState("España");
  const [cityInput, setCityInput]         = useState("Barcelona");
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
      const ok = await registerUser(emailInput, passwordInput, nameInput, countryInput, cityInput, referredByInput);
      if (ok) { showToast("¡Bienvenido a El Pacto! ⚡"); closeAuth(); }
      else showToast("Error al crear cuenta ❌");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[350]"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={closeAuth}
      />

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[351] animate-slide-up">
        <div style={{ background: "var(--color-gray)", borderRadius: "20px 20px 0 0", padding: "0 20px 40px" }}>
          <div style={{ width: 36, height: 4, background: "var(--color-gray3)", borderRadius: 2, margin: "14px auto 20px" }} />
          <FormContent
            isLogin={isLogin} loading={loading}
            emailInput={emailInput} setEmailInput={setEmailInput}
            passwordInput={passwordInput} setPasswordInput={setPasswordInput}
            nameInput={nameInput} setNameInput={setNameInput}
            countryInput={countryInput} setCountryInput={setCountryInput}
            cityInput={cityInput} setCityInput={setCityInput}
            referredByInput={referredByInput} setReferredByInput={setReferredByInput}
            onSubmit={handleSubmit} onClose={closeAuth} onToggle={() => setIsLogin(!isLogin)}
          />
        </div>
      </div>

      {/* Desktop: centered modal */}
      <div className="hidden sm:flex fixed inset-0 z-[351] items-center justify-center p-6">
        <div
          className="animate-fade-in"
          style={{
            background: "var(--color-gray)",
            borderRadius: 20,
            padding: "36px 40px 40px",
            width: "100%",
            maxWidth: 460,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            position: "relative",
          }}
        >
          <FormContent
            isLogin={isLogin} loading={loading}
            emailInput={emailInput} setEmailInput={setEmailInput}
            passwordInput={passwordInput} setPasswordInput={setPasswordInput}
            nameInput={nameInput} setNameInput={setNameInput}
            countryInput={countryInput} setCountryInput={setCountryInput}
            cityInput={cityInput} setCityInput={setCityInput}
            referredByInput={referredByInput} setReferredByInput={setReferredByInput}
            onSubmit={handleSubmit} onClose={closeAuth} onToggle={() => setIsLogin(!isLogin)}
            desktop
          />
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-gray2)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 13,
  color: "var(--color-white)",
  outline: "none",
  fontFamily: "var(--font-sans)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "var(--color-muted)",
  marginBottom: 6,
};

const citiesByCountry: Record<string, string[]> = {
  España: ["Barcelona", "Madrid", "Valencia", "Sevilla", "Bilbao", "Zaragoza", "Málaga", "Otra"],
  Argentina: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Otra"],
  México: ["Ciudad de México", "Guadalajara", "Monterrey", "Cancún", "Playa del Carmen", "Puebla", "Querétaro", "Otra"],
  Colombia: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Santa Marta", "Otra"],
  Perú: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Cusco", "Piura", "Ica", "Otra"],
  Chile: ["Santiago", "Valparaíso", "Concepción", "La Serena", "Temuco", "Valdivia", "Puerto Montt", "Otra"],
  Brasil: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Outra"],
  Uruguay: ["Montevideo", "Salto", "Paysandú", "Las Piedras", "Rivera", "Maldonado", "Tacuarembó", "Outra"],
  Paraguay: ["Asunción", "Ciudad del Este", "Encarnación", "Caaguazú", "Coronel Oviedo", "Pedro Juan Caballero", "Villarrica", "Outra"],
  Otro: ["Otra"],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function FormContent({
  isLogin, loading,
  emailInput, setEmailInput,
  passwordInput, setPasswordInput,
  nameInput, setNameInput,
  countryInput, setCountryInput,
  cityInput, setCityInput,
  referredByInput, setReferredByInput,
  onSubmit, onClose, onToggle,
  desktop = false,
}: {
  isLogin: boolean; loading: boolean;
  emailInput: string; setEmailInput: (v: string) => void;
  passwordInput: string; setPasswordInput: (v: string) => void;
  nameInput: string; setNameInput: (v: string) => void;
  countryInput: string; setCountryInput: (v: string) => void;
  cityInput: string; setCityInput: (v: string) => void;
  referredByInput: string; setReferredByInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onToggle: () => void;
  desktop?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24, position: "relative" }}>
        {desktop && (
          <button
            onClick={onClose}
            style={{ position: "absolute", top: -4, right: -4, background: "none", border: "none", color: "var(--color-muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        )}
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4 }}>
          EL PACTO BC
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, letterSpacing: 1 }}>
          {isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
          {isLogin ? "Accede a tu perfil de fan" : "Únete al club nativo digital"}
        </div>
      </div>

      {/* Form card */}
      <div
        style={{
          background: "var(--color-gray2)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: "18px 16px",
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!isLogin && (
            <>
              <Field label="Nombre de Fan">
                <input
                  type="text" required
                  placeholder="Ej. BasketMaster99"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="País">
                <select
                  value={countryInput}
                  onChange={(e) => {
                    setCountryInput(e.target.value);
                    setCityInput(citiesByCountry[e.target.value]?.[0] || "Otra");
                  }}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {["España","Argentina","México","Colombia","Perú","Chile","Brasil","Uruguay","Paraguay","Otro"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ciudad">
                <select
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {(citiesByCountry[countryInput] || ["Otra"]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field label="Email">
            <input
              type="email" required
              placeholder="fan@elpacto.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Contraseña">
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 0, fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center" }}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </Field>

          {!isLogin && (
            <Field label="Código referido (opcional)">
              <input
                type="text"
                placeholder="PACTO-XXXX"
                value={referredByInput}
                onChange={(e) => setReferredByInput(e.target.value)}
                style={inputStyle}
              />
            </Field>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-y"
            style={{ fontSize: 13, fontWeight: 800, padding: "14px", opacity: loading ? 0.6 : 1, marginTop: 2 }}
          >
            {loading ? "CARGANDO..." : isLogin ? "ENTRAR 🏀" : "REGISTRARME ⚡"}
          </button>
        </form>
      </div>

      <button
        onClick={onToggle}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--color-accent)", textDecoration: "underline", textAlign: "center", padding: "6px 0" }}
      >
        {isLogin ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
}
