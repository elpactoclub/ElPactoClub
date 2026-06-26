// EN: Skeleton loading UI shown while an admin page is streaming from the server.
// ES: UI de esqueleto de carga mostrada mientras una página de admin se transmite desde el servidor.

// EN: Admin loading component rendering skeleton rows while the page data is fetched.
// ES: Componente de carga del admin que renderiza filas esqueleto mientras se obtienen los datos de la página.
export default function AdminLoading() {
  return (
    <div style={{ padding: "0" }}>
      <div className="skeleton" style={{ width: 200, height: 22, borderRadius: 6, marginBottom: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: "100%", height: 54, borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
