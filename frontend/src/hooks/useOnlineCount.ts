"use client";

// EN: Hook that polls the backend every N milliseconds and returns the current online user count.
// ES: Hook que consulta el backend cada N milisegundos y devuelve el número actual de usuarios en línea.

import { useState, useEffect } from "react";
import { api } from "@/services/api";

// EN: Polls /users/online-count on mount and on each interval tick, returning the live count.
// ES: Consulta /users/online-count al montar y en cada tick del intervalo, devolviendo el conteo en vivo.
export function useOnlineCount(intervalMs = 30000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetch = () => {
      api.get("/users/online-count")
        .then((r) => {
          const val = typeof r.data === "number" ? r.data : r.data?.count;
          if (typeof val === "number") setCount(val);
        })
        .catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return count;
}
