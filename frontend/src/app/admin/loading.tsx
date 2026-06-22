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
