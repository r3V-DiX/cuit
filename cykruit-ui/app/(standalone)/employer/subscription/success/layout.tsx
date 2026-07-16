export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="fixed inset-0 pointer-events-none z-0 bg-grid-ghost" />
      {children}
    </div>
  );
}
