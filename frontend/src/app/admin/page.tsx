// EN: Admin root page that immediately redirects to the dashboard.
// ES: Página raíz del administrador que redirige inmediatamente al dashboard.

import { redirect } from "next/navigation";

// EN: Admin root component — redirects visitors straight to /admin/dashboard.
// ES: Componente raíz del admin — redirige a los visitantes directamente a /admin/dashboard.
export default function AdminRoot() {
  redirect("/admin/dashboard");
}
