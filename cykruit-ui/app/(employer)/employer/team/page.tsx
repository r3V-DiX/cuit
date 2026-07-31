"use client";

import { useState, useEffect, useCallback } from "react";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Users, UserPlus, Crown, Briefcase, Eye, Trash2,
  MoreVertical, Mail, Loader2, Shield, AlertTriangle,
  Clock, CheckCircle2, XCircle, UserCheck,
} from "lucide-react";
import { TeamMemberListSkeleton } from "@/components/ui/skeletons/TeamMemberSkeleton";
import Link from "next/link";
import { apiFetch, authHeaders, ApiError } from "@/lib/api";
import { useSubscriptionLimits } from "@/lib/use-subscription-limits";
import { KycGate } from "@/components/employer/KycGate";
import { useKycStatus } from "@/lib/employer-context";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";

type MemberRole = "OWNER" | "HIRING_MANAGER" | "RECRUITER" | "VIEWER";
type ActiveTab = "members" | "invites" | "permissions";

interface Member {
  id: string;
  userId: string;
  role: MemberRole;
  invitedBy?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

interface JoinRequest {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  message?: string;
  createdAt: string;
  expiresAt: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

interface InviteRow {
  id: string;
  invitedEmail: string;
  role: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
}

const ROLE_META: Record<MemberRole, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  OWNER:          { label: "Owner",           color: "text-yellow-700 bg-yellow-50 border-yellow-200",  icon: <Crown className="w-3 h-3" />,    desc: "Full access — billing, team, jobs, settings" },
  HIRING_MANAGER: { label: "Hiring Manager",  color: "text-blue-700 bg-blue-50 border-blue-200",       icon: <Briefcase className="w-3 h-3" />, desc: "Manage jobs, applications, invite members" },
  RECRUITER:      { label: "Recruiter",        color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Users className="w-3 h-3" />,     desc: "Post jobs, review applications" },
  VIEWER:         { label: "Viewer",           color: "text-slate-600 bg-slate-50 border-slate-200",    icon: <Eye className="w-3 h-3" />,       desc: "View-only access" },
};

const ASSIGNABLE_ROLES: MemberRole[] = ["HIRING_MANAGER", "RECRUITER", "VIEWER"];

export default function TeamPage() {
  const [members, setMembers]           = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [invites, setInvites]           = useState<InviteRow[]>([]);
  const [loading, setLoading]           = useState(false);
  const [resolving, setResolving]       = useState<string | null>(null);
  const [revoking, setRevoking]         = useState<string | null>(null);
  const [myRole, setMyRole]             = useState<MemberRole | null>(null);
  const [myUserId, setMyUserId]         = useState<string | null>(null);
  const [openMenu, setOpenMenu]         = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<ActiveTab>("members");
  const { limits: subLimits, loading: subLoading } = useSubscriptionLimits();
  const teamLimit = subLimits?.maxTeamMembers ?? null;

  const [showInvite, setShowInvite]   = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState<MemberRole>("RECRUITER");
  const [inviting, setInviting]       = useState(false);

  const { toast }     = useToast();
  const { openModal } = useModal();
  const kycStatus     = useKycStatus();

  const load = useCallback(async () => {
    if (kycStatus !== "verified") return;
    setLoading(true);
    try {
      const [teamRes, meRes] = await Promise.all([
        apiFetch<Member[]>("/api/employer/team"),
        apiFetch<{ id?: string }>("/api/auth/me"),
      ]);
      const items: Member[] = teamRes.data ?? [];
      setMembers(items);
      const myId = meRes.data?.id ?? null;
      setMyUserId(myId);
      const me = items.find((m) => m.userId === myId);
      const role = me?.role ?? null;
      setMyRole(role);

      if (role === "OWNER" || role === "HIRING_MANAGER") {
        try {
          const jrRes = await apiFetch<JoinRequest[]>("/api/employer/company/join-requests");
          setJoinRequests(jrRes.data ?? []);
        } catch {
          // non-critical
        }
        try {
          const invRes = await apiFetch<InviteRow[]>("/api/employer/team/invites");
          setInvites(invRes.data ?? []);
        } catch {
          // non-critical
        }
      }
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to load team") });
    } finally {
      setLoading(false);
    }
  }, [kycStatus, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleInvite() {
    if (!inviteEmail.trim() || inviting) return;
    if (teamLimit !== null && teamLimit > 0 && members.length >= teamLimit) {
      toast({
        type: "error",
        message: `Team limit reached (${members.length}/${teamLimit})`,
        description: "Upgrade your plan to add more members.",
      });
      return;
    }
    setInviting(true);
    try {
      await apiFetch("/api/employer/team/invite", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      toast({ type: "success", message: "Invitation sent", description: `${inviteEmail} will receive an invite email` });
      setInviteEmail("");
      setShowInvite(false);
      load();
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to send invitation") });
    } finally { setInviting(false); }
  }

  async function handleRoleChange(memberId: string, newRole: MemberRole) {
    try {
      await apiFetch("/api/employer/team/role", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ memberId, newRole }),
      });
      toast({ type: "success", message: "Role updated" });
      setOpenMenu(null);
      load();
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to update role") });
    }
  }

  function confirmRemove(member: Member) {
    const name = member.user ? `${member.user.firstName} ${member.user.lastName}` : "this member";
    openModal({
      variant: "danger",
      title: "Remove member?",
      description: `${name} will lose access to your organization immediately.`,
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          await apiFetch(`/api/employer/team/${member.id}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          toast({ type: "success", message: "Member removed" });
          load();
        } catch (err: unknown) {
          toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to remove member") });
        }
      },
    });
  }

  async function handleRevokeInvite(tokenId: string, email: string) {
    openModal({
      variant: "danger",
      title: "Revoke invite?",
      description: `The invitation to ${email} will be cancelled.`,
      confirmLabel: "Revoke",
      onConfirm: async () => {
        setRevoking(tokenId);
        try {
          await apiFetch(`/api/employer/team/invites/${tokenId}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          toast({ type: "success", message: "Invite revoked" });
          load();
        } catch (err: unknown) {
          toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to revoke invite") });
        } finally {
          setRevoking(null);
        }
      },
    });
  }

  async function handleResolveRequest(joinRequestId: string, status: "ACCEPTED" | "REJECTED") {
    setResolving(joinRequestId);
    try {
      await apiFetch("/api/employer/company/join-requests/resolve", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ joinRequestId, status }),
      });
      toast({
        type: "success",
        message: status === "ACCEPTED" ? "Request accepted — member added" : "Request declined",
      });
      load();
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to resolve request") });
    } finally {
      setResolving(null);
    }
  }

  const canManage     = myRole === "OWNER" || myRole === "HIRING_MANAGER";
  const canInvite     = canManage;
  const canChangeRole = myRole === "OWNER";
  const pendingCount  = joinRequests.filter((r) => r.status === "PENDING").length;
  const pendingInviteCount = invites.filter((inv) => inv.status === "PENDING").length;
  const totalPendingBadge = pendingCount + pendingInviteCount;

  const tabs: { id: ActiveTab; label: string; badge?: number; hidden?: boolean }[] = [
    { id: "members",     label: "Members" },
    { id: "invites",     label: "Invites & Requests", badge: totalPendingBadge > 0 ? totalPendingBadge : undefined, hidden: !canManage },
    { id: "permissions", label: "Permissions" },
  ];

  return (
    <>
      <EmployerTopbar title="Team" />
      <KycGate>
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Team</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage who has access to your organization
                {teamLimit !== null && teamLimit > 0 && (
                  <span className="ml-2 text-slate-400">({members.length}/{teamLimit})</span>
                )}
              </p>
            </div>
            {canInvite && (
              <button
                onClick={() => { setActiveTab("members"); setShowInvite(true); }}
                disabled={subLoading || (teamLimit !== null && teamLimit > 0 && members.length >= teamLimit)}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20">
                <UserPlus className="w-4 h-4" /> Invite Member
              </button>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
            {tabs.filter(t => !t.hidden).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-200/80"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── MEMBERS TAB ─────────────────────────────────────────── */}
          {activeTab === "members" && (
            <>
              {teamLimit !== null && teamLimit > 0 && members.length >= teamLimit && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Team member limit reached ({members.length}/{teamLimit})</p>
                    <p className="text-xs text-amber-600 mt-0.5">Upgrade your plan to invite more team members.</p>
                    <Link href="/employer/subscription?tab=plans" className="text-xs font-semibold text-amber-700 underline mt-1 inline-block">Upgrade plan →</Link>
                  </div>
                </div>
              )}

              {/* Invite form */}
              {showInvite && canInvite && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-600" /> Invite a team member
                    </h2>
                    <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                  </div>
                  <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                      placeholder="colleague@yourcompany.com"
                      className="flex-1 h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 min-w-0"
                    />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                      className="h-11 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 appearance-none cursor-pointer">
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_META[r].label}</option>
                      ))}
                    </select>
                    <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}
                      className="h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0">
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      {inviting ? "Sending…" : "Send Invite"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {ASSIGNABLE_ROLES.map((r) => (
                      <div key={r} className={`px-3 py-2 rounded-xl border text-xs ${inviteRole === r ? ROLE_META[r].color : "bg-slate-50 border-slate-200 text-slate-500"} transition-all`}>
                        <div className="flex items-center gap-1.5 font-semibold mb-0.5">
                          {ROLE_META[r].icon} {ROLE_META[r].label}
                        </div>
                        <p className="leading-relaxed opacity-80">{ROLE_META[r].desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members list */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Members ({members.length})</span>
                </div>

                {loading ? (
                  <TeamMemberListSkeleton count={3} />
                ) : members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No team members yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {members.map((member) => {
                      const isMe = member.userId === myUserId;
                      const rm = ROLE_META[member.role];
                      const initials = member.user
                        ? `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase()
                        : "?";
                      const fullName = member.user
                        ? `${member.user.firstName} ${member.user.lastName}`
                        : "Invited user";

                      return (
                        <li key={member.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/50 transition-colors relative flex-wrap sm:flex-nowrap">
                          {member.user?.profileImage ? (
                            <img src={member.user.profileImage} alt={fullName}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 font-bold text-sm">
                              {initials}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
                              {isMe && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">you</span>}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{member.user?.email ?? "—"}</p>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${rm.color}`}>
                            {rm.icon} {rm.label}
                          </span>

                          {canManage && !isMe && member.role !== "OWNER" && (
                            <div className="relative shrink-0">
                              <button onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenu === member.id && (
                                <div className="absolute right-0 bottom-9 z-20 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/60 py-1 w-48">
                                  {canChangeRole && (
                                    <>
                                      <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Change Role</p>
                                      {ASSIGNABLE_ROLES.map((r) => (
                                        <button key={r} onClick={() => handleRoleChange(member.id, r)}
                                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${member.role === r ? "font-semibold text-blue-700" : "text-slate-700"}`}>
                                          {ROLE_META[r].icon} {ROLE_META[r].label}
                                          {member.role === r && <span className="ml-auto text-blue-600">✓</span>}
                                        </button>
                                      ))}
                                      <div className="border-t border-slate-100 mt-1" />
                                    </>
                                  )}
                                  <div className="pt-1">
                                    <button onClick={() => { setOpenMenu(null); confirmRemove(member); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-rose-600 hover:bg-rose-50 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" /> Remove member
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ── INVITES & REQUESTS TAB ──────────────────────────────── */}
          {activeTab === "invites" && canManage && (
            <>
              {/* Sent Invites */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-700">Sent Invites</span>
                  {pendingInviteCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                      {pendingInviteCount} pending
                    </span>
                  )}
                </div>

                {invites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No invites sent yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {invites.map((inv) => {
                      const initial = inv.invitedEmail[0].toUpperCase();
                      const isPending = inv.status === "PENDING";
                      const isRevoking = revoking === inv.id;
                      const invRole = inv.role as MemberRole;
                      const rm = ROLE_META[invRole] ?? ROLE_META["VIEWER"];

                      return (
                        <li key={inv.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 flex-wrap sm:flex-nowrap">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 font-bold text-sm">
                            {initial}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{inv.invitedEmail}</p>
                            <p className="text-xs text-slate-400 truncate">Invited by {inv.invitedBy}</p>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${rm.color}`}>
                            {rm.icon} {rm.label}
                          </span>

                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-semibold shrink-0">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          ) : inv.status === "ACCEPTED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-[11px] font-semibold shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Accepted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold shrink-0">
                              <XCircle className="w-3 h-3" /> Expired
                            </span>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleRevokeInvite(inv.id, inv.invitedEmail)}
                              disabled={isRevoking}
                              className="h-8 px-3 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
                            >
                              {isRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              Revoke
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Join Requests */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold text-slate-700">Join Requests</span>
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold">
                      {pendingCount} pending
                    </span>
                  )}
                </div>

                {joinRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No join requests yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {joinRequests.map((req) => {
                      const initials = `${req.requester.firstName[0]}${req.requester.lastName[0]}`.toUpperCase();
                      const isPending = req.status === "PENDING";
                      const isResolving = resolving === req.id;

                      return (
                        <li key={req.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 flex-wrap sm:flex-nowrap">
                          {req.requester.profileImage ? (
                            <img src={req.requester.profileImage} alt=""
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 text-violet-700 font-bold text-sm">
                              {initials}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {req.requester.firstName} {req.requester.lastName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{req.requester.email}</p>
                            {req.message && (
                              <p className="text-xs text-slate-500 mt-0.5 italic truncate">"{req.message}"</p>
                            )}
                          </div>

                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-semibold shrink-0">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          ) : req.status === "ACCEPTED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-[11px] font-semibold shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Accepted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold shrink-0">
                              <XCircle className="w-3 h-3" /> {req.status === "EXPIRED" ? "Expired" : "Declined"}
                            </span>
                          )}

                          {isPending && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleResolveRequest(req.id, "ACCEPTED")}
                                disabled={isResolving}
                                className="h-8 px-3 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                              >
                                {isResolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Accept
                              </button>
                              <button
                                onClick={() => handleResolveRequest(req.id, "REJECTED")}
                                disabled={isResolving}
                                className="h-8 px-3 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                              >
                                {isResolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                Decline
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ── PERMISSIONS TAB ─────────────────────────────────────── */}
          {activeTab === "permissions" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Role Permissions</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-left text-slate-500 font-semibold">Permission</th>
                      {(["OWNER","HIRING_MANAGER","RECRUITER","VIEWER"] as MemberRole[]).map((r) => (
                        <th key={r} className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${ROLE_META[r].color}`}>
                            {ROLE_META[r].icon}{ROLE_META[r].label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      ["Post & manage jobs",       true,  true,  true,  false],
                      ["Review applications",      true,  true,  true,  true ],
                      ["Invite team members",      true,  true,  false, false],
                      ["Change member roles",      true,  false, false, false],
                      ["Company profile & KYC",    true,  false, false, false],
                      ["Billing & subscription",   true,  false, false, false],
                      ["View all data",            true,  true,  true,  true ],
                    ].map(([label, ...perms]) => (
                      <tr key={label as string} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3 text-slate-700 font-medium">{label}</td>
                        {perms.map((p, i) => (
                          <td key={i} className="px-4 py-3 text-center">
                            {p ? <span className="text-green-500">✓</span> : <span className="text-slate-300">–</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
      </KycGate>

      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </>
  );
}
