"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import Landing from "@/components/landing/Landing";
import Onboarding from "@/components/landing/Onboarding";
import AppShell from "@/components/layout/AppShell";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isLandingOpen, isOnboardingOpen, showToast } = useUIStore();
  const { isAuthenticated, fetchProfile, token, becomeSocioApi } = useUserStore();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (token) {
      fetchProfile().then(() => {
        useUIStore.setState({ isLandingOpen: false });
      });
    }
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Handle shared post — go to community and open modal
    const postId = params.get("post");
    if (postId) {
      window.history.replaceState({}, "", window.location.pathname);
      useUIStore.setState({ activeTab: "comunidad", communityTab: "feed", viewPostId: postId });
    }

    // Handle socio payment
    if (params.get("socio") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      if (token) {
        becomeSocioApi().then(() => {
          showToast("¡Bienvenido al Pacto! Ya eres socio oficial 🏀");
        });
      } else {
        showToast("¡Pago completado! Inicia sesión para activar tu membresía 🏀");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return <div style={{ position: "fixed", inset: 0, background: "#0A0A0A" }} />;
  }

  if (isOnboardingOpen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0A0A0A", display: "flex", flexDirection: "column" }}>
        <Onboarding />
      </div>
    );
  }

  if (isLandingOpen && !isAuthenticated) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0A0A0A", display: "flex", flexDirection: "column" }}>
        <Landing />
      </div>
    );
  }

  return <AppShell />;
}
