"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import Landing from "@/components/landing/Landing";
import Onboarding from "@/components/landing/Onboarding";
import AppShell from "@/components/layout/AppShell";

export default function Home() {
  const { isLandingOpen, isOnboardingOpen } = useUIStore();
  const { isAuthenticated, fetchProfile, token } = useUserStore();

  useEffect(() => {
    if (token) {
      fetchProfile().then(() => {
        useUIStore.setState({ isLandingOpen: false });
      });
    }
  }, [token]);

  if (isOnboardingOpen) {
    return <div className="h-full"><Onboarding /></div>;
  }

  if (isLandingOpen && !isAuthenticated) {
    return <div className="h-full"><Landing /></div>;
  }

  return <AppShell />;
}
