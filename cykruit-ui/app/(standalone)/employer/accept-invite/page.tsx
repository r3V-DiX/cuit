import { Suspense } from "react";
import AcceptInviteClient from "./AcceptInviteClient";
import { Loader2 } from "lucide-react";

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      }
    >
      <AcceptInviteClient />
    </Suspense>
  );
}
