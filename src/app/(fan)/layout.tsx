export default function FanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fan-shell">
      <div className="fan-app">
        {children}
      </div>
    </div>
  );
}
