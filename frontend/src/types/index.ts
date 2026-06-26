// EN: Shared TypeScript type definitions for users, credits, XP, events, community objects and more.
// ES: Definiciones de tipos TypeScript compartidos para usuarios, créditos, XP, eventos, objetos de comunidad y más.

// ==========================================
// User Types
// ==========================================
// EN: Core user record returned by the API.
// ES: Registro de usuario principal devuelto por la API.
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  city: string;
  credits: number;
  xp: number;
  level: UserLevel;
  streak: number;
  tickets: number;
  isSocio: boolean;
  referralCode: string;
  createdAt: string;
}

// EN: The four progression levels a fan can reach based on their XP.
// ES: Los cuatro niveles de progresión que un fan puede alcanzar según su XP.
export type UserLevel = "Rookie" | "Starter" | "MVP" | "Leyenda";

export const LEVEL_THRESHOLDS: Record<UserLevel, number> = {
  Rookie: 0,
  Starter: 500,
  MVP: 2000,
  Leyenda: 5000,
};

export const LEVEL_COLORS: Record<UserLevel, string> = {
  Rookie: "#777",
  Starter: "#F0E040",
  MVP: "#60A5FA",
  Leyenda: "#FFD700",
};

// ==========================================
// Credits & XP
// ==========================================
// EN: A single credit debit or earn transaction logged for a user.
// ES: Una transacción individual de débito o ganancia de créditos registrada para un usuario.
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "earn" | "spend";
  description: string;
  createdAt: string;
}

export const CREDIT_COSTS = {
  clubVote: 5,
  groupBet: 20,
  creatorMessage: 50,
  exclusiveTalk: 50,
  raffleTicket: 75,
  weeklySurvey: 0,
  dailyQuestion: 0,
} as const;

export const XP_REWARDS = {
  chatMessage: 1,
  clubVote: 5,
  groupBet: 10,
  exclusiveTalk: 25,
  creatorMessage: 30,
  raffleTicket: 50,
} as const;

// ==========================================
// Events
// ==========================================
// EN: A club event (match or talk) displayed in the events tab.
// ES: Un evento del club (partido o charla) mostrado en la pestaña de eventos.
export interface Event {
  id: string;
  title: string;
  type: "match" | "talk";
  date: string;
  time: string;
  city: string;
  description: string;
  bannerUrl?: string;
  slots?: number;
  creditCost?: number;
}

// ==========================================
// Community
// ==========================================
// EN: A post in the community feed (text, poll, or challenge).
// ES: Una publicación en el feed de la comunidad (texto, encuesta o reto).
export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isCreator: boolean;
  creatorBadge?: string;
  content: string;
  type: "post" | "poll" | "challenge";
  reactions: Record<string, number>;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  isCreator: boolean;
  createdAt: string;
}

export interface Vote {
  id: string;
  category: string;
  title: string;
  options: string[];
  creditCost: number;
  xpReward: number;
  votes: number[];
  closesAt: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  closesAt: string;
}

// ==========================================
// Badges
// ==========================================
// EN: An achievement badge that can be unlocked by the user.
// ES: Una insignia de logro que el usuario puede desbloquear.
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  isSecret: boolean;
  isUnlocked: boolean;
}

// ==========================================
// Notifications
// ==========================================
// EN: A single in-app notification shown in the notification panel.
// ES: Una notificación individual en la app mostrada en el panel de notificaciones.
export interface Notification {
  id: string;
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  isRead: boolean;
  action?: string;
  createdAt: string;
}

// ==========================================
// Social Projects
// ==========================================
// EN: A social project fans can donate credits to and vote on.
// ES: Un proyecto social al que los fans pueden donar créditos y votar.
export interface SocialProject {
  id: string;
  name: string;
  emoji: string;
  status: "active" | "completed";
  description: string;
  color: string;
  creditCost: number;
}

// ==========================================
// Raffle
// ==========================================
// EN: A raffle entry fans can enter by spending credits.
// ES: Una rifa a la que los fans pueden inscribirse gastando créditos.
export interface Raffle {
  id: string;
  title: string;
  prize: string;
  value: string;
  participants: number;
  creditCost: number;
  closesAt: string;
}

// ==========================================
// Creator
// ==========================================
// EN: A content creator whose DMs fans can pay credits to access.
// ES: Un creador de contenido cuyos DMs los fans pueden pagar con créditos para acceder.
export interface Creator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  messageCost: number;
}
