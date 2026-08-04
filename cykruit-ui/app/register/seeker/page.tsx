import SeekerClient from "./seeker-client";
import GuestGuard from "@/components/GuestGuard";

export default function SeekerRegisterPage() {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4 py-12">
        <div className="absolute inset-0 pointer-events-none bg-grid-auth" />
        <SeekerClient />
      </div>
    </GuestGuard>
  );
}
