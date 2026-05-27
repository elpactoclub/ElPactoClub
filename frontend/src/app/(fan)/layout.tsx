// Cache the static shell for 1 hour; revalidates in background on next request
export const revalidate = 3600;

export default function FanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fan-shell">
      <div className="fan-app">
        {children}
      </div>
    </div>
  );
}
