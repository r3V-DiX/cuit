export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none bg-grid-auth" />
      {children}
    </div>
  );
}
