"use client";

import { useEffect, useState, useCallback } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface Setting {
  key: string;
  value: string;
}

const SETTING_META: Record<string, { label: string; description: string; unit: string; min: number; max: number; step: number; section: string }> = {
  price_socio_cents:       { label: "Suscripción mensual",   description: "Precio en euros (ej. 5.00)",                                    unit: "€",   min: 1,    max: 100,   step: 0.5,  section: "Stripe — Suscripciones" },
  price_credits_100_cents: { label: "Pack 100 créditos",     description: "Precio en euros (ej. 3.50)",                                    unit: "€",   min: 0.5,  max: 50,    step: 0.5,  section: "Stripe — Créditos" },
  price_credits_200_cents: { label: "Pack 200 créditos",     description: "Precio en euros (ej. 6.00)",                                    unit: "€",   min: 1,    max: 50,    step: 0.5,  section: "Stripe — Créditos" },
  dm_creator_cost_credits: { label: "Coste DM a creador",    description: "Créditos que cuesta enviar un mensaje directo a un creador",    unit: "cr",  min: 0,    max: 500,   step: 1,    section: "Economía interna" },
  dm_creator_xp_reward:    { label: "XP por DM a creador",   description: "XP que gana el fan al enviar un DM",                           unit: "XP",  min: 0,    max: 200,   step: 1,    section: "Economía interna" },
};

const SECTIONS = ["Stripe — Suscripciones", "Stripe — Créditos", "Economía interna"];

// Cents-based settings are shown/edited in euros; stored as integer cents.
function isCentsKey(key: string) { return key.includes("cents"); }
function storedToDisplay(key: string, stored: string | undefined): string {
  if (!isCentsKey(key)) return stored ?? "";
  const n = parseInt(stored ?? "", 10);
  return isNaN(n) ? "" : (n / 100).toFixed(2);
}
function displayToStored(key: string, display: string): string {
  if (!isCentsKey(key)) return display;
  const euros = parseFloat(display);
  return isNaN(euros) ? "0" : String(Math.round(euros * 100));
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}`, "Content-Type": "application/json" };
}

export default function PricingPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`${API}/admin/settings`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: Setting[]) => {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) for (const s of data) map[s.key] = storedToDisplay(s.key, s.value);
        setSettings(map);
        setDraft(map);
      })
      .catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(key: string) {
    setSaving(key);
    try {
      const r = await fetch(`${API}/admin/settings/${key}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ value: displayToStored(key, draft[key]) }),
      });
      if (r.ok) {
        setSettings((prev) => ({ ...prev, [key]: draft[key] }));
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, letterSpacing: 2, marginBottom: 24 }}>PRECIOS Y CONFIG</h1>

      {SECTIONS.map((section) => {
        const keys = Object.entries(SETTING_META).filter(([, m]) => m.section === section).map(([k]) => k);
        return (
          <div key={section} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 12 }}>{section}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {keys.map((key) => {
                const meta = SETTING_META[key];
                const isCents = isCentsKey(key);
                const isDirty = draft[key] !== settings[key];
                return (
                  <div
                    key={key}
                    style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{meta.label}</div>
                        <div style={{ fontSize: 11.5, color: "#666", lineHeight: 1.4 }}>{meta.description}</div>
                        {isCents && draft[key] && (
                          <div style={{ fontSize: 12, color: "var(--color-accent)", marginTop: 4, fontWeight: 600 }}>
                            {(parseFloat(draft[key]) || 0).toFixed(2)}€ · se cobra como {displayToStored(key, draft[key])} céntimos
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <input
                          type="number"
                          value={draft[key] ?? ""}
                          min={meta.min}
                          max={meta.max}
                          step={meta.step}
                          onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                          style={{
                            width: 88, padding: "8px 10px", borderRadius: 8, fontSize: 15, fontWeight: 700, textAlign: "right",
                            background: "#1a1a1a",
                            border: `1px solid ${isDirty ? "var(--color-accent)" : "rgba(255,255,255,0.1)"}`,
                            color: "#fff", outline: "none",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "#555", width: 24 }}>{meta.unit}</span>
                        <button
                          onClick={() => save(key)}
                          disabled={!isDirty || saving === key}
                          style={{
                            padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            cursor: isDirty ? "pointer" : "default",
                            background: saved === key ? "#22C55E" : isDirty ? "var(--color-accent)" : "#1a1a1a",
                            color: isDirty || saved === key ? "#000" : "#444",
                            border: "none", transition: "all 0.15s",
                          }}
                        >
                          {saving === key ? "…" : saved === key ? "✓ Guardado" : "Guardar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
