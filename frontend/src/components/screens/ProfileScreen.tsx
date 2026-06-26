"use client";

// EN: Profile tab screen that renders the ProfileModal inline (as a full screen instead of an overlay).
// ES: Pantalla de la pestaña de perfil que renderiza ProfileModal en línea (como pantalla completa en lugar de overlay).

import ProfileModal from "@/components/profile/ProfileModal";

// EN: Profile screen component wrapping ProfileModal in inline mode.
// ES: Componente de pantalla de perfil que envuelve ProfileModal en modo inline.
export default function ProfileScreen() {
  return <ProfileModal inline />;
}
