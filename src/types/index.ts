// ==========================================
// User Types
// ==========================================
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
export interface Creator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  messageCost: number;
}
