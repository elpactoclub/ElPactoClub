"use client";

import { create } from "zustand";
import { UserLevel, LEVEL_THRESHOLDS } from "@/types";
import { api } from "@/services/api";

interface UserState {
  // User data
  id: string | null;
  name: string;
  email: string | null;
  avatar: string;
  city: string;
  credits: number;
  xp: number;
  streak: number;
  tickets: number;
  isSocio: boolean;
  referralCode: string;
  isAuthenticated: boolean;
  token: string | null;

  // Computed
  level: UserLevel;
  nextLevel: UserLevel | null;
  xpProgress: number;

  // Voted/interacted tracking
  voted: Record<string, string>;
  liked: Record<string, boolean>;
  reactions: Record<string, boolean>;
  polls: Record<string, number>;
  dailyClaimed: boolean;
  ruletaSpun: boolean;

  // Actions
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  addXP: (amount: number) => void;
  addTicket: () => void;
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  setCity: (city: string) => void;
  setVoted: (id: string, option: string) => void;
  toggleLike: (id: string) => void;
  toggleReaction: (id: string) => void;
  setPollVote: (id: string, option: number) => void;
  claimDaily: () => void;
  spinRuleta: () => void;
  becomeSocio: () => void;

  // API Async Actions
  login: (email: string, password: string) => Promise<boolean>;
  registerUser: (email: string, password: string, name: string, city: string, referredBy?: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  spinRuletaApi: () => Promise<{ prize: string; credits: number; xp: number } | null>;
  claimDailyApi: () => Promise<{ credits: number; xp: number } | null>;
  becomeSocioApi: () => Promise<boolean>;
}

function getLevel(xp: number): UserLevel {
  if (xp >= LEVEL_THRESHOLDS.Leyenda) return "Leyenda";
  if (xp >= LEVEL_THRESHOLDS.MVP) return "MVP";
  if (xp >= LEVEL_THRESHOLDS.Starter) return "Starter";
  return "Rookie";
}

function getNextLevel(level: UserLevel): UserLevel | null {
  const order: UserLevel[] = ["Rookie", "Starter", "MVP", "Leyenda"];
  const idx = order.indexOf(level);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

function getXPProgress(xp: number, level: UserLevel): number {
  const next = getNextLevel(level);
  if (!next) return 100;
  const current = LEVEL_THRESHOLDS[level];
  const target = LEVEL_THRESHOLDS[next];
  return Math.min(100, Math.round(((xp - current) / (target - current)) * 100));
}

// Initial state
const initialUserState = {
  id: null,
  name: "Tu Nombre",
  email: null,
  avatar: "🏀",
  city: "Barcelona",
  credits: 340,
  xp: 1240,
  streak: 7,
  tickets: 0,
  isSocio: false,
  referralCode: "PACTO-HE47",
  level: "Starter" as UserLevel,
  nextLevel: "MVP" as UserLevel,
  xpProgress: 62,
  voted: {},
  liked: {},
  reactions: {},
  polls: {},
  dailyClaimed: false,
  ruletaSpun: false,
  isAuthenticated: false,
  token: typeof window !== "undefined" ? localStorage.getItem("el_pacto_token") : null,
};

export const useUserStore = create<UserState>((set, get) => ({
  ...initialUserState,

  addCredits: (amount) =>
    set((state) => ({ credits: state.credits + amount })),

  spendCredits: (amount) => {
    const state = get();
    if (state.credits < amount) return false;
    set({ credits: state.credits - amount });
    return true;
  },

  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      const newLevel = getLevel(newXP);
      return {
        xp: newXP,
        level: newLevel,
        nextLevel: getNextLevel(newLevel),
        xpProgress: getXPProgress(newXP, newLevel),
      };
    }),

  addTicket: () => set((state) => ({ tickets: state.tickets + 1 })),

  setName: (name) => set({ name }),
  setAvatar: (avatar) => set({ avatar }),
  setCity: (city) => set({ city }),

  setVoted: (id, option) =>
    set((state) => ({ voted: { ...state.voted, [id]: option } })),

  toggleLike: (id) =>
    set((state) => ({
      liked: { ...state.liked, [id]: !state.liked[id] },
    })),

  toggleReaction: (id) =>
    set((state) => ({
      reactions: { ...state.reactions, [id]: !state.reactions[id] },
    })),

  setPollVote: (id, option) =>
    set((state) => ({ polls: { ...state.polls, [id]: option } })),

  claimDaily: () => set({ dailyClaimed: true }),
  spinRuleta: () => set({ ruletaSpun: true }),

  becomeSocio: () =>
    set((state) => ({
      isSocio: true,
      credits: state.credits + 200,
    })),

  // ─── API ACTIONS ────────────────────────────────────────────────────────
  login: async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, user } = res.data;

      localStorage.setItem("el_pacto_token", access_token);

      const computedLevel = getLevel(user.xp);
      set({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        city: user.city,
        credits: user.credits,
        xp: user.xp,
        streak: user.streak,
        isSocio: user.isSocio,
        referralCode: user.referralCode,
        level: computedLevel,
        nextLevel: getNextLevel(computedLevel),
        xpProgress: getXPProgress(user.xp, computedLevel),
        isAuthenticated: true,
        token: access_token,
      });

      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  },

  registerUser: async (email, password, name, city, referredBy) => {
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        name,
        city,
        referredBy: referredBy || undefined,
      });
      const { access_token, user } = res.data;

      localStorage.setItem("el_pacto_token", access_token);

      const computedLevel = getLevel(user.xp);
      set({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        city: user.city,
        credits: user.credits,
        xp: user.xp,
        streak: user.streak,
        isSocio: user.isSocio,
        referralCode: user.referralCode,
        level: computedLevel,
        nextLevel: getNextLevel(computedLevel),
        xpProgress: getXPProgress(user.xp, computedLevel),
        isAuthenticated: true,
        token: access_token,
      });

      return true;
    } catch (err) {
      console.error("Registration failed:", err);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("el_pacto_token");
    set({
      ...initialUserState,
      token: null,
      isAuthenticated: false,
    });
    // Redirect to landing on explicit logout
    const { useUIStore } = require("@/stores/uiStore");
    useUIStore.setState({ isLandingOpen: true });
  },

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem("el_pacto_token");
      if (!token) return;

      const res = await api.get("/users/me");
      const user = res.data;

      const computedLevel = getLevel(user.xp);
      set({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        city: user.city,
        credits: user.credits,
        xp: user.xp,
        streak: user.streak,
        isSocio: user.isSocio,
        referralCode: user.referralCode,
        level: computedLevel,
        nextLevel: getNextLevel(computedLevel),
        xpProgress: getXPProgress(user.xp, computedLevel),
        isAuthenticated: true,
        token,
      });
    } catch (err) {
      console.error("Fetch profile failed, logging out:", err);
      get().logout();
    }
  },

  spinRuletaApi: async () => {
    try {
      const res = await api.post("/gamification/roulette/spin");
      const prize = res.data; // { prize, credits, xp }

      // Update local state
      set((state) => {
        const newXP = state.xp + prize.xp;
        const computedLevel = getLevel(newXP);
        return {
          credits: state.credits + prize.credits,
          xp: newXP,
          level: computedLevel,
          nextLevel: getNextLevel(computedLevel),
          xpProgress: getXPProgress(newXP, computedLevel),
          ruletaSpun: true,
        };
      });

      return prize;
    } catch (err) {
      console.error("Spin roulette API failed:", err);
      return null;
    }
  },

  claimDailyApi: async () => {
    try {
      const res = await api.get("/users/me/daily-reward");
      const reward = res.data; // { credits, xp }

      // Update local state
      set((state) => {
        const newXP = state.xp + reward.xp;
        const computedLevel = getLevel(newXP);
        return {
          credits: state.credits + reward.credits,
          xp: newXP,
          level: computedLevel,
          nextLevel: getNextLevel(computedLevel),
          xpProgress: getXPProgress(newXP, computedLevel),
          dailyClaimed: true,
        };
      });

      return reward;
    } catch (err) {
      console.error("Claim daily API failed:", err);
      return null;
    }
  },

  becomeSocioApi: async () => {
    try {
      await api.post("/users/me/become-socio");
      await get().fetchProfile();
      return true;
    } catch {
      get().becomeSocio();
      return true;
    }
  },
}));
