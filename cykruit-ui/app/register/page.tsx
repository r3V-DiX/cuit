import RegisterClient from "./register-client";
import GuestGuard from "@/components/GuestGuard";

export default function RegisterPage() {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4 py-8">
        <div className="absolute inset-0 pointer-events-none bg-grid-auth" />
        <RegisterClient />
      </div>
    </GuestGuard>
  );
}
