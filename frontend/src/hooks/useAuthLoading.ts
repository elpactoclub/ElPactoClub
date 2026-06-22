"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";

/**
 * true cuando hay un token guardado pero la sesión todavía no se confirmó
 * (fetchProfile en curso). Sirve para mostrar skeletons en vez de los
 * valores iniciales (0 / Rookie) que luego "saltan" al llegar los datos.
 */
export function useAuthLoading(): boolean {
  const { token, isAuthenticated } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!token && !isAuthenticated;
}
