"use client";

import { useEffect } from "react";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import Toast from "@/components/ui/Toast";
import HomeScreen from "@/components/screens/HomeScreen";
import CommunityScreen from "@/components/screens/CommunityScreen";
import EventsScreen from "@/components/screens/EventsScreen";
import StoreScreen from "@/components/screens/StoreScreen";
import AboutScreen from "@/components/screens/AboutScreen";
import NotificationsScreen from "@/components/screens/NotificationsScreen";
import MessagesScreen from "@/components/screens/MessagesScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import ProfileModal from "@/components/profile/ProfileModal";
import CarnetModal from "@/components/profile/CarnetModal";
import AuthModal from "@/components/auth/AuthModal";
import DMModal from "@/components/dm/DMModal";
import PaymentModal from "@/components/store/PaymentModal";
import EventPageModal from "@/components/events/EventPageModal";
import FanModal from "@/components/community/FanModal";
import PostModal from "@/components/community/PostModal";
import ViewPostModal from "@/components/community/ViewPostModal";
import ShareCarnetModal from "@/components/profile/ShareCarnetModal";
import PersonalizeModal from "@/components/profile/PersonalizeModal";
import ProjectPageModal from "@/components/projects/ProjectPageModal";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { api } from "@/services/api";

const screens: Record<string, React.ComponentType> = {
  home: HomeScreen,
  comunidad: CommunityScreen,
  eventos: EventsScreen,
  store: StoreScreen,
  about: AboutScreen,
  notifications: NotificationsScreen,
  messages: MessagesScreen,
  profile: ProfileScreen,
};

export default function AppShell() {
  const activeTab = useUIStore((s) => s.activeTab);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const Screen = screens[activeTab] || HomeScreen;

  useEffect(() => {
    if (!isAuthenticated) return;
    const ping = () => api.post("/users/me/ping").catch(() => {});
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col h-dvh">
      <DesktopSidebar />
      <div className="lg:hidden">
        <TopNav />
      </div>
      <NotificationPanel />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <Screen />
      </main>
      <div className="lg:hidden">
        <BottomNav />
      </div>
      <Toast />
      <ProfileModal />
      <CarnetModal />
      <AuthModal />
      <DMModal />
      <PaymentModal />
      <EventPageModal />
      <FanModal />
      <PostModal />
      <ViewPostModal />
      <ShareCarnetModal />
      <PersonalizeModal />
      <ProjectPageModal />
    </div>
  );
}
