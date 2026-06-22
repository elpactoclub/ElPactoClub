"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";

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
