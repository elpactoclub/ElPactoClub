"use client";

// EN: Hook that returns true when a JWT token exists in storage but the session has not yet been confirmed by fetchProfile.
// ES: Hook que devuelve true cuando hay un token JWT en el almacenamiento pero la sesión aún no ha sido confirmada por fetchProfile.

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";

/**
 * true cuando hay un token guardado pero la sesión todavía no se confirmó
 * (fetchProfile en curso). Sirve para mostrar skeletons en vez de los
 * valores iniciales (0 / Rookie) que luego "saltan" al llegar los datos.
 */
// EN: Returns true while there is a stored token but the user store is not yet authenticated (fetchProfile pending).
// ES: Devuelve true mientras hay un token almacenado pero el store de usuario aún no está autenticado (fetchProfile pendiente).
export function useAuthLoading(): boolean {
  const { token, isAuthenticated } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!token && !isAuthenticated;
}
