import EmployerClient from "./employer-client";

export default function EmployerRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 pointer-events-none bg-grid-auth-purple" />
      <EmployerClient />
    </div>
  );
}
