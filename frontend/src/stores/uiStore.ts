"use client";

import { create } from "zustand";

export interface ProjectData {
  id: string;
  slug: string;
  emoji?: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  color?: string;
  badgeLabel?: string;
}

type ActiveTab = "home" | "comunidad" | "eventos" | "store" | "about" | "notifications" | "messages" | "profile";
type CommunityTab = "feed" | "chat" | "votar";

interface UIState {
  activeTab: ActiveTab;
  communityTab: CommunityTab;
  isLandingOpen: boolean;
  isOnboardingOpen: boolean;
  onboardingStep: number;

  // Modals
  isProfileOpen: boolean;
  isCarnetOpen: boolean;
  isNotifOpen: boolean;
  isDMOpen: boolean;
  dmOpenWithCreator: string | null;
  dmOpenWithUser: { id: string; name: string; avatar?: string; role?: string } | null;
  isPersonalizeOpen: boolean;
  isPostModalOpen: boolean;
  isAuthOpen: boolean;
  authSuccessAction: "payment" | null;
  isPaymentOpen: boolean;
  isEventPageOpen: boolean;
  isFanModalOpen: boolean;
  fanModalUser: string | null;
  fanModalData: { id?: string; role?: string; city?: string; level?: string; xp?: number; avatar?: string } | null;
  isShareCarnetOpen: boolean;
  isProjectPageOpen: boolean;
  activeProject: ProjectData | null;
  viewPostId: string | null;
  isUserSearchOpen: boolean;
  userProfileId: string | null;

  // Feed refresh
  postsRefreshKey: number;
  refreshPosts: () => void;

  // Notifications
  notifUnreadCount: number;

  // Toast
  toastMessage: string | null;
  toastTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  setNotifUnreadCount: (count: number) => void;
  setTab: (tab: ActiveTab) => void;
  setCommunityTab: (tab: CommunityTab) => void;
  closeLanding: () => void;
  setOnboardingStep: (step: number) => void;
  finishOnboarding: () => void;
  skipOnboarding: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  openCarnet: () => void;
  closeCarnet: () => void;
  toggleNotif: () => void;
  closeNotif: () => void;
  openDM: () => void;
  openDMWithCreator: (creatorName: string) => void;
  openDMWithUser: (user: { id: string; name: string; avatar?: string; role?: string }) => void;
  closeDM: () => void;
  openPersonalize: () => void;
  closePersonalize: () => void;
  openPostModal: () => void;
  closePostModal: () => void;
  openAuth: () => void;
  openAuthForPayment: () => void;
  closeAuth: () => void;
  openPayment: () => void;
  closePayment: () => void;
  openEventPage: () => void;
  closeEventPage: () => void;
  openFanModal: (username: string, data?: { id?: string; role?: string; city?: string; level?: string; xp?: number; avatar?: string }) => void;
  closeFanModal: () => void;
  openShareCarnet: () => void;
  closeShareCarnet: () => void;
  openProjectPage: (project: ProjectData) => void;
  closeProjectPage: () => void;
  openViewPost: (postId: string) => void;
  closeViewPost: () => void;
  openUserSearch: () => void;
  closeUserSearch: () => void;
  openUserProfile: (userId: string) => void;
  closeUserProfile: () => void;
  showToast: (message: string) => void;
}

const savedTab = typeof window !== "undefined" ? (localStorage.getItem("ep_active_tab") as ActiveTab | null) : null;
const savedCommunityTab = typeof window !== "undefined" ? (localStorage.getItem("ep_community_tab") as CommunityTab | null) : null;

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: savedTab ?? "home",
  communityTab: savedCommunityTab ?? "feed",
  isLandingOpen: typeof window !== "undefined" ? !localStorage.getItem("el_pacto_token") : true,
  isOnboardingOpen: false,
  onboardingStep: 0,
  isProfileOpen: false,
  isCarnetOpen: false,
  isNotifOpen: false,
  isDMOpen: false,
  dmOpenWithCreator: null,
  dmOpenWithUser: null,
  isPersonalizeOpen: false,
  isPostModalOpen: false,
  isAuthOpen: false,
  authSuccessAction: null,
  isPaymentOpen: false,
  isEventPageOpen: false,
  isFanModalOpen: false,
  fanModalUser: null,
  fanModalData: null,
  isShareCarnetOpen: false,
  isProjectPageOpen: false,
  activeProject: null,
  viewPostId: null,
  isUserSearchOpen: false,
  userProfileId: null,
  postsRefreshKey: 0,
  refreshPosts: () => set((s) => ({ postsRefreshKey: s.postsRefreshKey + 1 })),
  notifUnreadCount: 0,
  toastMessage: null,
  toastTimer: null,

  setNotifUnreadCount: (count) => set({ notifUnreadCount: count }),
  setTab: (tab) => {
    if (typeof window !== "undefined") localStorage.setItem("ep_active_tab", tab);
    set({ activeTab: tab, communityTab: "feed" });
  },
  setCommunityTab: (tab) => {
    if (typeof window !== "undefined") localStorage.setItem("ep_community_tab", tab);
    set({ communityTab: tab });
  },

  closeLanding: () => set({ isLandingOpen: false }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  finishOnboarding: () => set({ isOnboardingOpen: false }),
  skipOnboarding: () => set({ isOnboardingOpen: false }),

  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false }),
  openCarnet: () => set({ isProfileOpen: false, isCarnetOpen: true }),
  closeCarnet: () => set({ isCarnetOpen: false }),
  toggleNotif: () => set((s) => ({ isNotifOpen: !s.isNotifOpen })),
  closeNotif: () => set({ isNotifOpen: false }),
  openDM: () => set({ isDMOpen: true, dmOpenWithCreator: null, dmOpenWithUser: null }),
  openDMWithCreator: (creatorName) => set({ isDMOpen: true, dmOpenWithCreator: creatorName, dmOpenWithUser: null }),
  openDMWithUser: (user) => set({ isDMOpen: true, dmOpenWithUser: user, dmOpenWithCreator: null }),
  closeDM: () => set({ isDMOpen: false, dmOpenWithCreator: null, dmOpenWithUser: null }),
  openPersonalize: () => set({ isProfileOpen: false, isPersonalizeOpen: true }),
  closePersonalize: () => set({ isPersonalizeOpen: false }),
  openPostModal: () => set({ isPostModalOpen: true }),
  closePostModal: () => set({ isPostModalOpen: false }),
  openAuth: () => set({ isAuthOpen: true, authSuccessAction: null }),
  openAuthForPayment: () => set({ isAuthOpen: true, authSuccessAction: "payment", isLandingOpen: false }),
  closeAuth: () => set({ isAuthOpen: false, authSuccessAction: null }),
  openPayment: () => set({ isPaymentOpen: true }),
  closePayment: () => set({ isPaymentOpen: false }),
  openEventPage: () => set({ isEventPageOpen: true }),
  closeEventPage: () => set({ isEventPageOpen: false }),
  openFanModal: (username, data) => set({ isFanModalOpen: true, fanModalUser: username, fanModalData: data ?? null }),
  closeFanModal: () => set({ isFanModalOpen: false, fanModalUser: null, fanModalData: null }),
  openShareCarnet: () => set({ isShareCarnetOpen: true }),
  closeShareCarnet: () => set({ isShareCarnetOpen: false }),
  openProjectPage: (project) => set({ isProjectPageOpen: true, activeProject: project }),
  closeProjectPage: () => set({ isProjectPageOpen: false, activeProject: null }),
  openViewPost: (postId) => set({ viewPostId: postId }),
  closeViewPost: () => set({ viewPostId: null }),
  openUserSearch: () => set({ isUserSearchOpen: true }),
  closeUserSearch: () => set({ isUserSearchOpen: false }),
  openUserProfile: (userId) => set({ userProfileId: userId, isUserSearchOpen: false }),
  closeUserProfile: () => set({ userProfileId: null }),

  showToast: (message) => {
    const state = get();
    if (state.toastTimer) clearTimeout(state.toastTimer);
    const timer = setTimeout(() => set({ toastMessage: null, toastTimer: null }), 2500);
    set({ toastMessage: message, toastTimer: timer });
  },
}));
