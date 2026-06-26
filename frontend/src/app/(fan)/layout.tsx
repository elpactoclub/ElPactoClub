// EN: Layout wrapper for the fan-facing app shell; cached for one hour with background revalidation.
// ES: Contenedor de layout para la shell de la app del fan; almacenado en caché durante una hora con revalidación en segundo plano.

// Cache the static shell for 1 hour; revalidates in background on next request
export const revalidate = 3600;

// EN: Fan layout component wrapping child pages inside the fan-shell and fan-app containers.
// ES: Componente de layout del fan que envuelve las páginas hijas dentro de los contenedores fan-shell y fan-app.
export default function FanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fan-shell">
      <div className="fan-app">
        {children}
      </div>
    </div>
  );
}
