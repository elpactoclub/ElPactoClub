"use client";

import { create } from "zustand";

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
  isPersonalizeOpen: boolean;
  isPostModalOpen: boolean;
  isPaymentOpen: boolean;
  isEventPageOpen: boolean;
  isFanModalOpen: boolean;
  fanModalUser: string | null;
  fanModalData: { city?: string; level?: string; xp?: number } | null;
  isShareCarnetOpen: boolean;
  isProjectPageOpen: boolean;
  projectId: "india" | "tecnificar" | null;
  viewPostId: string | null;

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
  closeDM: () => void;
  openPersonalize: () => void;
  closePersonalize: () => void;
  openPostModal: () => void;
  closePostModal: () => void;
  openPayment: () => void;
  closePayment: () => void;
  openEventPage: () => void;
  closeEventPage: () => void;
  openFanModal: (username: string, data?: { city?: string; level?: string; xp?: number }) => void;
  closeFanModal: () => void;
  openShareCarnet: () => void;
  closeShareCarnet: () => void;
  openProjectPage: (id: "india" | "tecnificar") => void;
  closeProjectPage: () => void;
  openViewPost: (postId: string) => void;
  closeViewPost: () => void;
  showToast: (message: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: "home",
  communityTab: "feed",
  isLandingOpen: typeof window !== "undefined" ? !localStorage.getItem("el_pacto_token") : true,
  isOnboardingOpen: false,
  onboardingStep: 0,
  isProfileOpen: false,
  isCarnetOpen: false,
  isNotifOpen: false,
  isDMOpen: false,
  dmOpenWithCreator: null,
  isPersonalizeOpen: false,
  isPostModalOpen: false,
  isPaymentOpen: false,
  isEventPageOpen: false,
  isFanModalOpen: false,
  fanModalUser: null,
  fanModalData: null,
  isShareCarnetOpen: false,
  isProjectPageOpen: false,
  projectId: null,
  viewPostId: null,
  notifUnreadCount: 0,
  toastMessage: null,
  toastTimer: null,

  setNotifUnreadCount: (count) => set({ notifUnreadCount: count }),
  setTab: (tab) => set({ activeTab: tab, communityTab: "feed" }),
  setCommunityTab: (tab) => set({ communityTab: tab }),

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
  openDM: () => set({ isDMOpen: true, dmOpenWithCreator: null }),
  openDMWithCreator: (creatorName) => set({ isDMOpen: true, dmOpenWithCreator: creatorName }),
  closeDM: () => set({ isDMOpen: false, dmOpenWithCreator: null }),
  openPersonalize: () => set({ isProfileOpen: false, isPersonalizeOpen: true }),
  closePersonalize: () => set({ isPersonalizeOpen: false }),
  openPostModal: () => set({ isPostModalOpen: true }),
  closePostModal: () => set({ isPostModalOpen: false }),
  openPayment: () => set({ isPaymentOpen: true }),
  closePayment: () => set({ isPaymentOpen: false }),
  openEventPage: () => set({ isEventPageOpen: true }),
  closeEventPage: () => set({ isEventPageOpen: false }),
  openFanModal: (username, data) => set({ isFanModalOpen: true, fanModalUser: username, fanModalData: data ?? null }),
  closeFanModal: () => set({ isFanModalOpen: false, fanModalUser: null, fanModalData: null }),
  openShareCarnet: () => set({ isShareCarnetOpen: true }),
  closeShareCarnet: () => set({ isShareCarnetOpen: false }),
  openProjectPage: (id) => set({ isProjectPageOpen: true, projectId: id }),
  closeProjectPage: () => set({ isProjectPageOpen: false, projectId: null }),
  openViewPost: (postId) => set({ viewPostId: postId }),
  closeViewPost: () => set({ viewPostId: null }),

  showToast: (message) => {
    const state = get();
    if (state.toastTimer) clearTimeout(state.toastTimer);
    const timer = setTimeout(() => set({ toastMessage: null, toastTimer: null }), 2500);
    set({ toastMessage: message, toastTimer: timer });
  },
}));
