"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  User, Briefcase, Award, Terminal, FileText,
  Plus, Pencil, Trash2, Upload, Check, X, ExternalLink, Sparkles, Wand2,
  GraduationCap, Globe, Camera, ChevronDown as ChevronDownIcon,
  Lock, Copy, Share2,
} from "lucide-react";
import { FaLinkedinIn, FaGithub, FaXTwitter } from "react-icons/fa6";
import { Country, State, City } from "country-state-city";
import { formatErrorDetails, apiFetch, authHeaders, describeError } from "@/lib/api";
import { ProfilePageSkeleton } from "@/components/ui/skeletons/PageSkeletons";

// Raw fetch() error responses arrive as {success:false, error:{code,message,details}} —
// unlike apiFetch()/ApiError, nothing here unwraps that envelope automatically.
function describeFetchError(body: any, fallback: string): { message: string; description?: string } {
  return { message: body?.error?.message || fallback, description: formatErrorDetails(body?.error?.details) };
}
// ─── Seed data ────────────────────────────────────────────────────────────────
const sections = [
  { id: "basics", label: "Basic Details", icon: User },
  { id: "bio", label: "Bio & Skills", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "ctf", label: "CTF Profiles", icon: Terminal },
  { id: "resume", label: "Resume", icon: FileText },
];

const field = "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all";
const selectField = "w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer";

function ChevronDown() {
  return (
    <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { toast } = useToast();
  const { openModal } = useModal();

  const [activeSection, setActiveSection] = useState("basics");
  const [userId, setUserId] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  async function toggleProfileVisibility() {
    const nextVal = !isProfilePublic;
    setUpdatingVisibility(true);
    try {
      await apiFetch("/api/settings/general", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          profileVisibility: nextVal ? "PUBLIC" : "PRIVATE",
        }),
      });
      setIsProfilePublic(nextVal);
      toast({
        type: "success",
        message: nextVal ? "Profile is now Public" : "Profile is now Private",
        description: nextVal ? "Anyone with your link can view your profile showcase." : "External visitors cannot view your profile.",
      });
    } catch (err) {
      toast({ type: "error", ...describeError(err, "Failed to update profile visibility") });
    } finally {
      setUpdatingVisibility(false);
    }
  }

  function handleCopyPublicLink() {
    if (!userId) {
      toast({ type: "error", message: "User profile ID not found" });
      return;
    }
    const url = `${window.location.origin}/p/${userId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast({ type: "success", message: "Public link copied to clipboard", description: url });
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ type: "error", message: "Image too large", description: "Please upload an image under 2 MB." });
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/image", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
        body: formData,
      });

      if (res.ok) {
        toast({ type: "success", message: "Photo updated" });
        loadProfile();
      } else {
        const body = await res.json().catch(() => null);
        toast({ type: "error", ...describeFetchError(body, "Failed to upload photo") });
      }
    } catch (err) {
      toast({ type: "error", message: "Error uploading photo", description: err instanceof Error ? err.message : undefined });
    }
    e.target.value = "";
  }

  async function deletePhoto() {
    try {
      const res = await fetch("/api/profile/image", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
      });
      if (res.ok) {
        toast({ type: "success", message: "Photo removed" });
        loadProfile();
      } else {
        const body = await res.json().catch(() => null);
        toast({ type: "error", ...describeFetchError(body, "Failed to remove photo") });
      }
    } catch (err) {
      toast({ type: "error", message: "Error removing photo", description: err instanceof Error ? err.message : undefined });
    }
  }

  // AI Resume Parse
  const [isParsingResume, setIsParsingResume] = useState(false);
  async function handleAiResumeParse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ type: "error", message: "Invalid file type", description: "Only PDF files are accepted." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ type: "error", message: "File too large", description: "Please upload a PDF under 5 MB." });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsParsingResume(true);
    toast({ type: "info", message: "Parsing resume...", description: "This might take a few seconds." });

    try {
      const res = await fetch("/api/profile/ai/parse-resume", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
        body: formData,
      });

      if (res.ok) {
        toast({ type: "success", message: "Profile Auto-filled!", description: "Your details have been extracted and saved." });
        loadProfile();
      } else {
        const errData = await res.json().catch(() => null);
        toast({ type: "error", message: "Parsing failed", description: describeFetchError(errData, "Failed to parse resume").message });
      }
    } catch (error) {
      toast({ type: "error", message: "Network error", description: "Failed to connect to parsing service." });
    } finally {
      setIsParsingResume(false);
      e.target.value = "";
    }
  }

  // AI Generators
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  async function handleAiGenerateBio() {
    setIsGeneratingBio(true);
    try {
      const res = await fetch("/api/profile/ai/generate-bio", { method: "GET", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const generatedBio: string = data?.data?.bio || data?.bio || "";
        if (generatedBio) {
          setBioBuffer(generatedBio);
          setEditingBio(true);
          toast({ type: "success", message: "Bio generated!" });
        } else {
          toast({ type: "error", message: "AI returned empty bio", description: "Try again in a moment." });
        }
      } else {
        if (res.status === 504) {
           toast({ type: "info", message: "AI is taking a while", description: "Ollama is generating in the background. Check back in a minute!" });
           return;
        }
        try {
          const err = await res.json();
          toast({ type: "error", message: "Generation failed", description: describeFetchError(err, "Failed to generate bio").message });
        } catch {
          toast({ type: "error", message: `Server error (${res.status})` });
        }
      }
    } catch (error) {
      toast({ type: "info", message: "Processing in background", description: "Your local AI is taking longer than 30s. Check back shortly!" });
    } finally {
      setIsGeneratingBio(false);
    }
  }

  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  async function handleAiSuggestSkills() {
    setIsGeneratingSkills(true);
    try {
      const res = await fetch("/api/profile/ai/suggest-skills", { method: "GET", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // The backend automatically saves matching skills to the database
        // We just reload the profile to get the newly added skills
        loadProfile();
        
        const addedCount = data.data?.addedSkills?.length || 0;
        if (addedCount > 0) {
          toast({ type: "success", message: `Added ${addedCount} suggested skills!` });
        } else {
          toast({ type: "info", message: "AI suggested skills, but they were already on your profile or not found in our database." });
        }

      } else {
        if (res.status === 504) {
           toast({ type: "info", message: "AI is taking a while", description: "Ollama is still generating in the background. Please refresh the page in a minute." });
           return;
        }
        try {
          const err = await res.json();
          toast({ type: "error", message: "Generation failed", description: describeFetchError(err, "Failed to suggest skills").message });
        } catch {
          toast({ type: "error", message: `Server error (${res.status})` });
        }
      }
    } catch (error) {
      toast({ type: "info", message: "Processing in background", description: "Your local AI is taking longer than 30s. Check back shortly!" });
    } finally {
      setIsGeneratingSkills(false);
    }
  }

  const [profileTips, setProfileTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [showTips, setShowTips] = useState(false);

  async function fetchTips() {
    if (showTips) {
      setShowTips(false);
      return;
    }
    setIsLoadingTips(true);
    try {
      const res = await fetch("/api/profile/ai/profile-tips", { method: "GET", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProfileTips(data.data.tips);
        setShowTips(true);
      } else {
        if (res.status === 504) {
           toast({ type: "info", message: "AI is taking a while", description: "Ollama is generating in the background. Check back in a minute!" });
           return;
        }
        try {
          const err = await res.json();
          toast({ type: "error", message: "Failed to load tips", description: describeFetchError(err, "").message || undefined });
        } catch {
          toast({ type: "error", message: `Server error (${res.status})` });
        }
      }
    } catch (error) {
      toast({ type: "info", message: "Processing in background", description: "Your local AI is taking longer than 30s. Check back shortly!" });
    } finally {
      setIsLoadingTips(false);
    }
  }

  // Basic details
  type BasicDetails = { name: string; email: string; professionalEmail: string; title: string; location: string; phone: string; linkedin: string; github: string; portfolio: string; twitter: string };
  const [basics, setBasics] = useState<BasicDetails>({
    name: "User",
    email: "",
    professionalEmail: "",
    title: "",
    location: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",
    twitter: "",
  });
  const [editingBasics, setEditingBasics] = useState(false);
  const [savingBasics, setSavingBasics] = useState(false);
  const [basicsBuffer, setBasicsBuffer] = useState<BasicDetails>({
    name: "User",
    email: "",
    professionalEmail: "",
    title: "",
    location: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",
    twitter: "",
  });

  const [countryName, setCountryName] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");

  const availableCountries = useMemo(() => Country.getAllCountries(), []);
  const selectedCountry = useMemo(() => availableCountries.find(c => c.name === countryName), [countryName, availableCountries]);
  const availableStates = useMemo(() => selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [], [selectedCountry]);
  const selectedState = useMemo(() => selectedCountry ? availableStates.find(s => s.name === stateName) : null, [selectedCountry, stateName, availableStates]);
  const availableCities = useMemo(() => selectedState && selectedCountry ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) : [], [selectedCountry, selectedState]);

  useEffect(() => {
    if (editingBasics) {
      setBasicsBuffer(basics);
      const loc = basics.location || "";
      if (loc) {
        const parts = loc.split(",").map(p => p.trim());
        const cName = parts[parts.length - 1];
        const country = Country.getAllCountries().find(c => c.name.toLowerCase() === cName?.toLowerCase());
        if (country) {
          setCountryName(country.name);
          if (parts.length > 1) {
             const sName = parts[parts.length - 2];
             const state = State.getStatesOfCountry(country.isoCode).find(s => s.name.toLowerCase() === sName?.toLowerCase());
             if (state) {
               setStateName(state.name);
               setCityName(parts.slice(0, parts.length - 2).join(", "));
             } else {
               setStateName("");
               setCityName(parts.slice(0, parts.length - 1).join(", "));
             }
          } else {
             setStateName("");
             setCityName("");
          }
        } else {
          setCountryName("");
          setStateName("");
          setCityName("");
        }
      }
    } else {
      setCountryName("");
      setStateName("");
      setCityName("");
    }
  }, [editingBasics, basics]);



  const getCsrfToken = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };

  async function saveBasics() {
    if (!basicsBuffer.name.trim()) {
      toast({ type: "error", message: "Name is required" });
      return;
    }
    setSavingBasics(true);
    try {
      const nameParts = basicsBuffer.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const body: any = {
        firstName,
        lastName,
        title: basicsBuffer.title || "",
        professionalEmail: basicsBuffer.professionalEmail || "",
      };
      if (basicsBuffer.phone !== undefined) body.phone = basicsBuffer.phone;
      if (selectedCountry) {
        const locObj: any = { country: selectedCountry.name };
        if (selectedState?.name) locObj.state = selectedState.name;
        if (cityName?.trim()) locObj.city = cityName.trim();
        body.location = locObj;
      }
      if (basicsBuffer.linkedin) body.linkedin = basicsBuffer.linkedin.startsWith("http") ? basicsBuffer.linkedin : `https://${basicsBuffer.linkedin}`;
      if (basicsBuffer.github) body.github = basicsBuffer.github.startsWith("http") ? basicsBuffer.github : `https://${basicsBuffer.github}`;
      if (basicsBuffer.portfolio) body.portfolio = basicsBuffer.portfolio.startsWith("http") ? basicsBuffer.portfolio : `https://${basicsBuffer.portfolio}`;
      if (basicsBuffer.twitter) body.twitter = basicsBuffer.twitter.startsWith("http") ? basicsBuffer.twitter : `https://${basicsBuffer.twitter}`;

      const response = await fetch("/api/profile/basic-info", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        loadProfile();
        setEditingBasics(false);
        toast({ type: "success", message: "Profile updated" });
      } else {
        const errData = await response.json().catch(() => null);
        toast({ type: "error", message: "Failed to update profile", description: describeFetchError(errData, "Invalid input values").message });
      }
    } catch (error) {
      toast({ type: "error", message: "Network error", description: error instanceof Error ? error.message : "Failed to save profile changes" });
    } finally {
      setSavingBasics(false);
    }
  }

  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [bioBuffer, setBioBuffer] = useState(bio);

  async function saveBio() {
    setSavingBio(true);
    try {
      const response = await fetch("/api/profile/summary", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ summary: bioBuffer }),
      });

      if (response.ok) {
        setBio(bioBuffer);
        setEditingBio(false);
        toast({ type: "success", message: "Bio updated" });
      } else {
        const errData = await response.json().catch(() => null);
        toast({ type: "error", message: "Failed to update bio", description: describeFetchError(errData, "Invalid input values").message });
      }
    } catch (error) {
      toast({ type: "error", message: "Network error", description: error instanceof Error ? error.message : "Failed to save bio changes" });
    } finally {
      setSavingBio(false);
    }
  }

  // Skills
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [addingSkillId, setAddingSkillId] = useState<string | null>(null);
  const skillSearchTimer = useCallback(() => {}, []);

  async function searchSkillSuggestions(query: string) {
    if (!query.trim()) { setSkillSuggestions([]); setShowSkillDropdown(false); return; }
    try {
      const res = await fetch(`/api/profile/skills/search?query=${encodeURIComponent(query)}&limit=8`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const results = (data.data?.skills || []).filter((s: { id: string; name: string }) => !skills.some(existing => existing.id === s.id));
        setSkillSuggestions(results);
        setShowSkillDropdown(results.length > 0);
      }
    } catch { /* silent */ }
  }

  const skillDebounceRef = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (query: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => searchSkillSuggestions(query), 300);
      };
    })(),
    [skills]
  );

  async function addSkillById(skillId: string, skillName: string) {
    if (skills.some((s) => s.id === skillId)) {
      toast({ type: "warning", message: "Already added" });
      return;
    }
    setAddingSkillId(skillId);
    setShowSkillDropdown(false);
    setNewSkill("");
    setSkillSuggestions([]);
    try {
      const addRes = await fetch("/api/profile/skills", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ skillId, proficiency: "Intermediate", yearsOfExperience: 2 }),
      });
      if (addRes.ok) {
        toast({ type: "success", message: "Skill added", description: `"${skillName}" added to your profile.` });
        loadProfile();
      } else {
        const err = await addRes.json().catch(() => null);
        toast({ type: "error", message: "Failed to add skill", description: describeFetchError(err, "").message || undefined });
      }
    } catch (err) {
      toast({ type: "error", message: "Error adding skill", description: err instanceof Error ? err.message : undefined });
    } finally {
      setAddingSkillId(null);
    }
  }

  async function removeSkill(id: string, name: string) {
    try {
      const res = await fetch(`/api/profile/skills/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
      });
      if (res.ok) {
        toast({ type: "info", message: "Skill removed", description: `"${name}" was removed.` });
        loadProfile();
      } else {
        const body = await res.json().catch(() => null);
        toast({ type: "error", ...describeFetchError(body, "Failed to remove skill") });
      }
    } catch (err) {
      toast({ type: "error", message: "Error removing skill", description: err instanceof Error ? err.message : undefined });
    }
  }

  // Experience
  type Exp = { id: string; role: string; company: string; period: string; desc: string };
  const [experience, setExperience] = useState<Exp[]>([]);
  const [editingExp, setEditingExp] = useState<Exp | null>(null);
  const [addingExp, setAddingExp] = useState(false);
  const [savingExp, setSavingExp] = useState(false);
  const currentYear = new Date().getFullYear();
  const startYearOptions = Array.from({ length: 41 }, (_, i) => String(currentYear - i));
  const endYearOptions = Array.from({ length: 46 }, (_, i) => String(currentYear + 5 - i));

  const [expForm, setExpForm] = useState({ role: "", company: "", startYear: "", endYear: "Present", desc: "" });

  function expFormToPeriod(f: typeof expForm) {
    if (!f.startYear) return "";
    return `${f.startYear} – ${f.endYear}`;
  }

  function periodToExpForm(period: string) {
    const parts = period.split(" – ");
    return { startYear: parts[0] ?? "", endYear: parts[1] ?? "Present" };
  }

  function openAddExp() {
    setExpForm({ role: "", company: "", startYear: "", endYear: "Present", desc: "" });
    setEditingExp(null);
    setAddingExp(true);
  }
  function openEditExp(exp: Exp) {
    const { startYear, endYear } = periodToExpForm(exp.period);
    setExpForm({ role: exp.role, company: exp.company, startYear, endYear, desc: exp.desc });
    setEditingExp(exp);
    setAddingExp(true);
  }
  async function saveExp() {
    if (!expForm.role.trim() || !expForm.company.trim()) {
      toast({ type: "error", message: "Missing fields", description: "Role and company are required." });
      return;
    }
    if (!expForm.startYear) {
      toast({ type: "error", message: "Missing start year", description: "Please select a start year." });
      return;
    }
    setSavingExp(true);

    const descText = expForm.desc.trim();
    const payload = {
      title: expForm.role,
      company: expForm.company,
      location: "Remote",
      startDate: `${expForm.startYear}-01`,
      endDate: expForm.endYear === "Present" ? undefined : `${expForm.endYear}-12`,
      current: expForm.endYear === "Present",
      description: descText.length >= 5 ? descText : descText + (descText ? " " : "") + "No description provided.",
      tools: ["Not specified"],
    };

    try {
      const url = editingExp ? `/api/profile/experiences/${editingExp.id}` : "/api/profile/experiences";
      const method = editingExp ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ type: "success", message: editingExp ? "Experience updated" : "Experience added" });
        loadProfile();
        setAddingExp(false);
        setEditingExp(null);
      } else {
        const err = await res.json().catch(() => null);
        toast({ type: "error", message: "Failed to save experience", description: describeFetchError(err, "").message || undefined });
      }
    } catch (err) {
      toast({ type: "error", message: "Error saving experience", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSavingExp(false);
    }
  }
  async function deleteExp(id: string) {
    openModal({
      variant: "danger",
      title: "Delete experience?",
      description: "This entry will be permanently removed from your profile.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/profile/experiences/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "x-csrf-token": getCsrfToken(),
            },
          });
          if (res.ok) {
            toast({ type: "success", message: "Experience removed" });
            loadProfile();
          } else {
            const body = await res.json().catch(() => null);
            toast({ type: "error", ...describeFetchError(body, "Failed to remove experience") });
          }
        } catch (err) {
          toast({ type: "error", message: "Error removing experience", description: err instanceof Error ? err.message : undefined });
        }
      },
    });
  }

  // Education
  type Edu = { id: string; degree: string; school: string; startYear: string; endYear: string; desc: string };
  const [education, setEducation] = useState<Edu[]>([]);
  const [editingEdu, setEditingEdu] = useState<Edu | null>(null);
  const [addingEdu, setAddingEdu] = useState(false);
  const [savingEdu, setSavingEdu] = useState(false);
  const [eduForm, setEduForm] = useState({ degree: "", school: "", startYear: "", endYear: "", desc: "" });

  function openAddEdu() {
    setEduForm({ degree: "", school: "", startYear: "", endYear: "", desc: "" });
    setEditingEdu(null);
    setAddingEdu(true);
  }
  function openEditEdu(edu: Edu) {
    setEduForm({ degree: edu.degree, school: edu.school, startYear: edu.startYear, endYear: edu.endYear, desc: edu.desc });
    setEditingEdu(edu);
    setAddingEdu(true);
  }
  async function saveEdu() {
    if (!eduForm.degree.trim() || !eduForm.school.trim()) {
      toast({ type: "error", message: "Missing fields", description: "Degree and school are required." });
      return;
    }
    setSavingEdu(true);
    const payload = {
      degree: eduForm.degree,
      instituteName: eduForm.school,
      startDate: eduForm.startYear ? eduForm.startYear : undefined,
      endDate: eduForm.endYear === "Present" || !eduForm.endYear ? undefined : eduForm.endYear,
      description: eduForm.desc || undefined,
    };

    try {
      const url = editingEdu ? `/api/profile/education/${editingEdu.id}` : "/api/profile/education";
      const method = editingEdu ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ type: "success", message: editingEdu ? "Education updated" : "Education added" });
        loadProfile();
        setAddingEdu(false);
        setEditingEdu(null);
      } else {
        const err = await res.json().catch(() => null);
        toast({ type: "error", message: "Failed to save education", description: describeFetchError(err, "").message || undefined });
      }
    } catch (err) {
      toast({ type: "error", message: "Error saving education", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSavingEdu(false);
    }
  }
  async function deleteEdu(id: string) {
    openModal({
      variant: "danger",
      title: "Remove education?",
      description: "This entry will be permanently removed from your profile.",
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/profile/education/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "x-csrf-token": getCsrfToken(),
            },
          });
          if (res.ok) {
            toast({ type: "success", message: "Education removed" });
            loadProfile();
          } else {
            const body = await res.json().catch(() => null);
            toast({ type: "error", ...describeFetchError(body, "Failed to remove education") });
          }
        } catch (err) {
          toast({ type: "error", message: "Error removing education", description: err instanceof Error ? err.message : undefined });
        }
      },
    });
  }

  // Certifications
  type Cert = { id: string; name: string; issuer: string; year: string; badge: string };
  const [certs, setCerts] = useState<Cert[]>([]);
  const [addingCert, setAddingCert] = useState(false);
  const [certForm, setCertForm] = useState({ certId: "", name: "", issuer: "", year: "" });
  const [certSuggestions, setCertSuggestions] = useState<{ id: string; name: string; organization: string }[]>([]);
  const [showCertDropdown, setShowCertDropdown] = useState(false);

  const certDebounceRef = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (query: string) => {
        clearTimeout(timer);
        if (!query.trim()) { setCertSuggestions([]); setShowCertDropdown(false); return; }
        timer = setTimeout(async () => {
          try {
            const res = await fetch(`/api/profile/certifications/search?query=${encodeURIComponent(query)}&limit=8`, { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              const results = data.data?.certifications || [];
              setCertSuggestions(results);
              setShowCertDropdown(results.length > 0);
            }
          } catch { /* silent */ }
        }, 300);
      };
    })(),
    []
  );

  async function saveCert() {
    if (!certForm.certId) {
      toast({ type: "warning", message: "Select a certification", description: "Type to search and pick from the dropdown." });
      return;
    }
    if (certForm.year && Number(certForm.year) > currentYear) {
      toast({ type: "error", message: "Invalid year", description: "Year obtained can't be in the future." });
      return;
    }
    const issueDate = certForm.year ? `${certForm.year}-01` : `${new Date().getFullYear()}-01`;
    try {
      const addRes = await fetch("/api/profile/certifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ certificationId: certForm.certId, issueDate }),
      });
      if (addRes.ok) {
        toast({ type: "success", message: "Certification added" });
        loadProfile();
        setAddingCert(false);
        setCertForm({ certId: "", name: "", issuer: "", year: "" });
      } else {
        const err = await addRes.json().catch(() => null);
        toast({ type: "error", message: "Failed to add certification", description: describeFetchError(err, "").message || undefined });
      }
    } catch (err) {
      toast({ type: "error", message: "Error adding certification", description: err instanceof Error ? err.message : undefined });
    }
  }
  async function deleteCert(id: string, name: string) {
    openModal({
      variant: "danger",
      title: `Remove "${name}"?`,
      description: "This certification will be removed from your profile.",
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/profile/certifications/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "x-csrf-token": getCsrfToken(),
            },
          });
          if (res.ok) {
            toast({ type: "success", message: "Certification removed" });
            loadProfile();
          } else {
            const body = await res.json().catch(() => null);
            toast({ type: "error", ...describeFetchError(body, "Failed to remove certification") });
          }
        } catch (err) {
          toast({ type: "error", message: "Error removing certification", description: err instanceof Error ? err.message : undefined });
        }
      },
    });
  }

  // CTF
  type CTFEntry = { id: string; platform: string; handle: string; rank: string; rankColor: string; url: string };
  const [ctfList, setCtfList] = useState<CTFEntry[]>([]);
  const [addingCtf, setAddingCtf] = useState(false);
  const [ctfForm, setCtfForm] = useState({ platform: "", handle: "", rank: "", url: "" });

  async function saveCtf() {
    if (!ctfForm.platform.trim() || !ctfForm.handle.trim()) {
      toast({ type: "error", message: "Missing fields", description: "Platform and handle are required." });
      return;
    }
    
    const payload = {
      platform: ctfForm.platform,
      username: ctfForm.handle,
      profileUrl: ctfForm.url ? (ctfForm.url.startsWith("http") ? ctfForm.url : `https://${ctfForm.url}`) : "https://hackthebox.com",
      rank: ctfForm.rank || undefined,
    };

    try {
      const res = await fetch("/api/profile/ctf-profiles", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ type: "success", message: "CTF profile added" });
        loadProfile();
        setAddingCtf(false);
        setCtfForm({ platform: "", handle: "", rank: "", url: "" });
      } else {
        const err = await res.json().catch(() => null);
        toast({ type: "error", message: "Failed to add CTF profile", description: describeFetchError(err, "").message || undefined });
      }
    } catch (err) {
      toast({ type: "error", message: "Error saving CTF profile", description: err instanceof Error ? err.message : undefined });
    }
  }
  async function deleteCtf(id: string, platform: string) {
    openModal({
      variant: "danger",
      title: `Remove ${platform}?`,
      description: "This profile will be removed.",
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/profile/ctf-profiles/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "x-csrf-token": getCsrfToken(),
            },
          });
          if (res.ok) {
            toast({ type: "success", message: "CTF profile removed" });
            loadProfile();
          } else {
            const body = await res.json().catch(() => null);
            toast({ type: "error", ...describeFetchError(body, "Failed to remove CTF profile") });
          }
        } catch (err) {
          toast({ type: "error", message: "Error removing CTF profile", description: err instanceof Error ? err.message : undefined });
        }
      },
    });
  }

  // Resume
  type ResumeEntry = { id: string; label: string; fileName: string; size: string; date: string };
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [addingResume, setAddingResume] = useState(false);
  const [resumeLabel, setResumeLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function handleResumeFile(file: File) {
    if (file.type !== "application/pdf") {
      toast({ type: "error", message: "Invalid file type", description: "Only PDF files are accepted." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ type: "error", message: "File too large", description: "Please upload a PDF under 5 MB." });
      return;
    }
    if (resumes.length >= 5) {
      toast({ type: "error", message: "Resume limit reached", description: "You can save up to 5 resumes. Remove one to add another." });
      return;
    }
    setPendingFile(file);
    setResumeLabel("");
    setAddingResume(true);
  }

  async function saveResume() {
    if (!pendingFile) return;

    const formData = new FormData();
    formData.append("file", pendingFile);

    try {
      const res = await fetch("/api/profile/resumes", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-csrf-token": getCsrfToken(),
        },
        body: formData,
      });

      if (res.ok) {
        toast({ type: "success", message: "Resume added" });
        loadProfile();
        setPendingFile(null);
        setAddingResume(false);
        setResumeLabel("");
      } else {
        const err = await res.json().catch(() => null);
        toast({ type: "error", message: "Failed to add resume", description: describeFetchError(err, "").message || undefined });
      }
    } catch (err) {
      toast({ type: "error", message: "Error uploading resume", description: err instanceof Error ? err.message : undefined });
    }
  }

  async function removeResume(id: string, label: string) {
    openModal({
      variant: "danger",
      title: `Remove "${label}"?`,
      description: "This resume will be permanently removed.",
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/profile/resumes/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "x-csrf-token": getCsrfToken(),
            },
          });
          if (res.ok) {
            toast({ type: "success", message: "Resume removed" });
            loadProfile();
          } else {
            const body = await res.json().catch(() => null);
            toast({ type: "error", ...describeFetchError(body, "Failed to remove resume") });
          }
        } catch (err) {
          toast({ type: "error", message: "Error removing resume", description: err instanceof Error ? err.message : undefined });
        }
      },
    });
  }

  async function loadProfile() {
    try {
      let userEmail = "";
      let userName = "";
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const meData = await meRes.json();
          const userObj = meData.data?.user || meData.data || meData.user || meData;
          userEmail = userObj.email || "";
          userName = [userObj.firstName, userObj.lastName].filter(Boolean).join(" ") || userObj.name || "";
          const id = userObj.id;
          if (id) setUserId(id);
          try {
            const settingsRes = await fetch("/api/settings", { credentials: "include" });
            if (settingsRes.ok) {
              const sData = await settingsRes.json();
              const gen = sData.data?.general || sData.general || sData.data || sData;
              if (gen.profileVisibility) {
                setIsProfilePublic(gen.profileVisibility === "PUBLIC");
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV === "development") console.error(e);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") console.error(e);
      }
      const response = await fetch("/api/profile", { credentials: "include" });
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          const data = result.data;
          const b = data.basicInfo || {};
          const initialBasics = {
            name: [b.firstName, b.lastName].filter(Boolean).join(" ") || userName || (userEmail ? userEmail.split("@")[0] : "User"),
            email: b.email || userEmail || "",
            professionalEmail: b.professionalEmail || "",
            title: b.title || "",
            location: b.location?.displayName || [b.location?.city, b.location?.state, b.location?.country].filter(Boolean).join(", ") || "",
            phone: b.phone || "",
            linkedin: b.linkedin || "",
            github: b.github || "",
            portfolio: b.portfolio || "",
            twitter: b.twitter || "",
          };
          setBasics(initialBasics);
          setBasicsBuffer(initialBasics);

          if (b.profileImage) {
            setPhotoUrl(b.profileImage);
          } else {
            setPhotoUrl(null);
          }

          if (data.summary) {
            setBio(data.summary);
            setBioBuffer(data.summary);
          }
          if (data.skills && Array.isArray(data.skills)) {
            setSkills(data.skills.map((s: any) => ({
              id: s.id,
              name: s.skill?.name || s.name
            })).filter((s: any) => s.name));
          }
          if (data.experiences && Array.isArray(data.experiences)) {
            setExperience(
              [...data.experiences]
                .sort((a: any, b: any) => {
                  const aYear = a.startDate ? new Date(a.startDate).getFullYear() : 0;
                  const bYear = b.startDate ? new Date(b.startDate).getFullYear() : 0;
                  return bYear - aYear;
                })
                .map((e: any) => ({
                  id: e.id,
                  role: e.title || e.role || "",
                  company: e.company || e.companyName || "",
                  period: `${e.startDate ? new Date(e.startDate).getFullYear() : ""} – ${e.endDate ? new Date(e.endDate).getFullYear() : "Present"}`,
                  desc: e.description || "",
                }))
            );
          }
          if (data.certifications && Array.isArray(data.certifications)) {
            setCerts(data.certifications.map((c: any) => ({
              id: c.id,
              name: c.certification?.name || c.name || "",
              issuer: c.certification?.organization || c.issuer || "",
              year: c.issueDate ? String(new Date(c.issueDate).getFullYear()) : "",
              badge: "bg-blue-50 text-blue-700 border-blue-200",
            })));
          }
          if (data.ctfProfiles && Array.isArray(data.ctfProfiles)) {
            setCtfList(data.ctfProfiles.map((c: any) => ({
              id: c.id,
              platform: c.platform,
              handle: c.username || c.handle,
              rank: c.rank || "Hacker",
              rankColor: "text-green-700 bg-green-50 border-green-200",
              url: c.profileUrl || "",
            })));
          }
          if (data.education && Array.isArray(data.education)) {
            setEducation(data.education.map((e: any) => ({
              id: e.id,
              degree: e.degree || "",
              school: e.institute?.name || e.instituteName || e.schoolName || "",
              startYear: e.startDate ? String(new Date(e.startDate).getFullYear()) : "",
              endYear: e.endDate ? String(new Date(e.endDate).getFullYear()) : "Present",
              desc: e.description || "",
            })));
          }
        }
      }

      const resumeRes = await fetch("/api/profile/resumes", { credentials: "include" });
      if (resumeRes.ok) {
        const resumeData = await resumeRes.json();
        if (resumeData.data) {
          setResumes(resumeData.data.resumes.map((r: any) => ({
            id: r.id,
            label: r.fileName.replace(/\.pdf$/i, ""),
            fileName: r.fileName,
            size: r.fileSize ? `${Math.round(r.fileSize / 1024)} KB` : "—",
            date: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "Just now",
          })));
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loadingProfile) {
    return (
      <>
        <SeekerTopbar title="My Profile" />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <ProfilePageSkeleton />
        </main>
      </>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  const profileChecks = [
    { label: "Bio / Summary", done: bio.length > 0 },
    { label: "Experience", done: experience.length > 0 },
    { label: "Education", done: education.length > 0 },
    { label: "Skills", done: skills.length > 0 },
    { label: "Certifications", done: certs.length > 0 },
    { label: "CTF Profile", done: ctfList.length > 0 },
    { label: "Resume", done: resumes.length > 0 },
  ];
  const doneCount = profileChecks.filter((c) => c.done).length;
  const profilePct = Math.round((doneCount / profileChecks.length) * 100);

  return (
    <>
      {isParsingResume && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          <p className="text-white text-sm font-semibold">Parsing your resume…</p>
          <p className="text-white/60 text-xs">Please wait, do not navigate away</p>
        </div>
      )}
      <SeekerTopbar title="My Profile" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div>

          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-5">
            {/* Top row: avatar + info */}
            <div className="flex items-start gap-4">
              {/* Avatar with photo upload */}
              <div className="relative shrink-0 group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 overflow-hidden">
                  {photoUrl
                    ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    : <span className="text-lg sm:text-xl font-bold text-white">{basics.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                  }
                </div>
                <label className="absolute inset-0 rounded-2xl bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{basics.name}</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{basics.title}{basics.location ? ` · ${basics.location}` : ""}</p>
                {basics.email && <p className="text-xs text-slate-400 mt-0.5 truncate">{basics.email}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] font-mono text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">OPEN TO WORK</span>
                  <span className="text-[10px] font-mono text-slate-400">Profile {profilePct}% complete</span>
                  {profilePct < 100 && (
                    <div className="relative">
                      <button
                        onClick={fetchTips}
                        disabled={isLoadingTips}
                        className="flex items-center gap-1 text-[10px] font-mono font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md hover:bg-violet-100 transition-colors disabled:opacity-60"
                      >
                        {isLoadingTips ? (
                          <span className="w-3 h-3 border-2 border-violet-400 border-t-violet-700 rounded-full animate-spin shrink-0" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {isLoadingTips ? "Analyzing..." : "Get AI Tips"}
                      </button>
                      {showTips && profileTips.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-[min(18rem,calc(100vw-2rem))] bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-violet-600" /> AI Suggestions</p>
                            <button onClick={() => setShowTips(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <ul className="space-y-2.5">
                            {profileTips.map((tip, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                                <span className="text-violet-500 mt-0.5">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Public / Private visibility switch & share link */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                  <button
                    type="button"
                    onClick={toggleProfileVisibility}
                    disabled={updatingVisibility}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                      isProfilePublic
                        ? "bg-green-50/80 border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    }`}
                    title={isProfilePublic ? "Click to make Private" : "Click to make Public"}
                  >
                    {isProfilePublic ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-green-600" />
                        <span>Public Profile</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Private Profile</span>
                      </>
                    )}
                    <span className={`w-1.5 h-1.5 rounded-full ${isProfilePublic ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                  </button>

                  {userId && (
                    <>
                      <Link
                        href={`/p/${userId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>View Public Page</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleCopyPublicLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copiedLink ? "Copied Link" : "Copy Public Link"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* AI autofill — full width below on mobile, inline on sm+ */}
            <div className="mt-4 relative rounded-xl overflow-hidden border border-violet-200 bg-linear-to-r from-violet-50 to-purple-50 px-4 py-3 flex items-center justify-between gap-3">
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-grid-purple-dense" />
              <div className="relative z-10 flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-violet-900 leading-tight">Auto-fill from resume</p>
                  <p className="text-[10px] text-violet-400 mt-0.5">We&apos;ll fill your entire profile for you</p>
                </div>
              </div>
              <label className={`relative z-10 shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-sm ${isParsingResume ? "bg-violet-400 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"}`}>
                {isParsingResume ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isParsingResume ? "Parsing..." : "Upload CV"}
                <input
                  type="file"
                  accept=".pdf"
                  className="sr-only"
                  onChange={handleAiResumeParse}
                  disabled={isParsingResume}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 sm:gap-5 items-start">
            {/* Section tabs */}
            <div className="w-full md:w-52 md:shrink-0 flex flex-row md:flex-col gap-1 md:sticky md:top-6 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all shrink-0 whitespace-nowrap ${
                    activeSection === id
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${activeSection === id ? "text-blue-600" : "text-slate-400"}`} />
                  {label}
                </button>
              ))}
            </div>

            {/* Section content */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">

              {/* BASICS */}
              {activeSection === "basics" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Basic Details</h3>
                    {!editingBasics
                      ? <button onClick={() => { setBasicsBuffer(basics); setEditingBasics(true); }} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                      : <div className="flex gap-2">
                          <button onClick={saveBasics} disabled={savingBasics} className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors">
                            {savingBasics ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-3 h-3" />}
                            {savingBasics ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingBasics(false)} disabled={savingBasics} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"><X className="w-3 h-3" /> Cancel</button>
                        </div>
                    }
                  </div>

                  {editingBasics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">Full name</label>
                          <input value={basicsBuffer.name} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, name: e.target.value })} placeholder="Full name" maxLength={100} className={field} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">Job title</label>
                          <input value={basicsBuffer.title} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, title: e.target.value })} placeholder="e.g. Senior Penetration Tester" maxLength={100} className={field} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">Professional Email</label>
                          <input value={basicsBuffer.professionalEmail} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, professionalEmail: e.target.value })} placeholder="you@professional.com" className={field} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">Phone number</label>
                          <input value={basicsBuffer.phone} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, phone: e.target.value })} placeholder="+1 (555) 000-0000" className={field} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">Country</label>
                          <select 
                            value={countryName}
                            onChange={(e) => { setCountryName(e.target.value); setStateName(""); setCityName(""); }}
                            className={`${field} cursor-pointer bg-white`}
                          >
                            <option value="">Select Country</option>
                            {availableCountries.map(c => (
                              <option key={c.isoCode} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">State/Region</label>
                          <select 
                            value={stateName}
                            onChange={(e) => { setStateName(e.target.value); setCityName(""); }}
                            disabled={!selectedCountry || availableStates.length === 0}
                            className={`${field} cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50`}
                          >
                            <option value="">Select State</option>
                            {availableStates.map(s => (
                              <option key={s.isoCode} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">City</label>
                          {availableCities.length > 0 ? (
                            <select 
                              value={cityName}
                              onChange={(e) => setCityName(e.target.value)}
                              disabled={!selectedState}
                              className={`${field} cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50`}
                            >
                              <option value="">Select City</option>
                              {availableCities.map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder="City name" disabled={!selectedCountry} maxLength={100} className={`${field} disabled:opacity-50 disabled:cursor-not-allowed`} />
                          )}
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Social & Portfolio Links</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"><FaLinkedinIn className="w-3.5 h-3.5 text-blue-600" /></div>
                            <input value={basicsBuffer.linkedin} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, linkedin: e.target.value })} placeholder="linkedin.com/in/username" maxLength={200} className={field} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><FaGithub className="w-3.5 h-3.5 text-slate-700" /></div>
                            <input value={basicsBuffer.github} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, github: e.target.value })} placeholder="github.com/username" maxLength={200} className={field} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0"><Globe className="w-3.5 h-3.5 text-emerald-600" /></div>
                            <input value={basicsBuffer.portfolio} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, portfolio: e.target.value })} placeholder="yourportfolio.com (optional)" maxLength={200} className={field} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><FaXTwitter className="w-3.5 h-3.5 text-slate-800" /></div>
                            <input value={basicsBuffer.twitter} onChange={(e) => setBasicsBuffer({ ...basicsBuffer, twitter: e.target.value })} placeholder="x.com/username (optional)" maxLength={200} className={field} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Row 1: name + title */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "Full name", value: basics.name },
                          { label: "Job title", value: basics.title },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-3.5 rounded-xl border bg-slate-50 border-slate-200">
                            <p className="text-[10px] font-medium text-slate-400 mb-0.5">{label}</p>
                            <p className="text-sm font-medium text-slate-800">{value || <span className="text-slate-300 italic">Not set</span>}</p>
                          </div>
                        ))}
                      </div>
                      {/* Row 2: prof email + phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "Professional Email", value: basics.professionalEmail },
                          { label: "Phone", value: basics.phone },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-3.5 rounded-xl border bg-slate-50 border-slate-200">
                            <p className="text-[10px] font-medium text-slate-400 mb-0.5">{label}</p>
                            <p className="text-sm font-medium text-slate-800">{value || <span className="text-slate-300 italic">Not set</span>}</p>
                          </div>
                        ))}
                      </div>
                      {/* Row 3: location full-width */}
                      <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200">
                        <p className="text-[10px] font-medium text-slate-400 mb-0.5">Location</p>
                        <p className="text-sm font-medium text-slate-800">{basics.location || <span className="text-slate-300 italic">Not set</span>}</p>
                      </div>

                      {/* Links */}
                      <div className="border-t border-slate-100 pt-4 space-y-2.5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Links</p>
                        {[
                          { icon: <FaLinkedinIn className="w-3.5 h-3.5 text-blue-600" />, bg: "bg-blue-50 border-blue-100", label: "LinkedIn", value: basics.linkedin },
                          { icon: <FaGithub className="w-3.5 h-3.5 text-slate-700" />, bg: "bg-slate-100 border-slate-200", label: "GitHub", value: basics.github },
                          { icon: <Globe className="w-3.5 h-3.5 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-100", label: "Portfolio", value: basics.portfolio },
                          { icon: <FaXTwitter className="w-3.5 h-3.5 text-slate-800" />, bg: "bg-slate-100 border-slate-200", label: "X / Twitter", value: basics.twitter },
                        ].map(({ icon, bg, label, value }) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-400">{label}</p>
                              {value
                                ? <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{value}</a>
                                : <span className="text-sm text-slate-300 italic">Not set</span>
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BIO */}
              {activeSection === "bio" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">About</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAiGenerateBio}
                          disabled={isGeneratingBio || editingBio}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                          title="Generate bio from your profile data"
                        >
                          {isGeneratingBio ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                          {isGeneratingBio ? "Generating..." : "Generate with AI"}
                        </button>
                        {!editingBio && (
                          <button
                            onClick={() => { setBioBuffer(bio); setEditingBio(true); }}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                    {editingBio ? (
                      <div className="space-y-2">
                        <textarea
                          value={bioBuffer}
                          onChange={(e) => setBioBuffer(e.target.value)}
                          rows={6}
                          className={`${field} resize-none`}
                          placeholder="Write a short professional summary..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveBio}
                            disabled={savingBio}
                            className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {savingBio ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-3 h-3" />}
                            {savingBio ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingBio(false)} disabled={savingBio} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : bio ? (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{bio}</p>
                    ) : (
                      <p className="text-sm text-slate-300 italic">No bio yet. Write one or use &quot;Generate with AI&quot;.</p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Skills</h3>
                      <button
                        onClick={handleAiSuggestSkills}
                        disabled={isGeneratingSkills || resumes.length === 0}
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={resumes.length === 0 ? "Upload a resume first" : "Suggest skills from your profile"}
                      >
                        {isGeneratingSkills ? (
                          <span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-violet-700 rounded-full animate-spin shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {isGeneratingSkills ? "Suggesting..." : "Suggest Skills"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="group flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 px-2.5 py-1 rounded-lg transition-colors cursor-default"
                        >
                          {skill.name}
                          <button onClick={() => removeSkill(skill.id, skill.name)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        value={newSkill}
                        onChange={(e) => { setNewSkill(e.target.value); skillDebounceRef(e.target.value); }}
                        onBlur={() => setTimeout(() => setShowSkillDropdown(false), 150)}
                        onFocus={() => { if (skillSuggestions.length > 0) setShowSkillDropdown(true); }}
                        placeholder="Search skills (e.g. Penetration Testing, Python)..."
                        maxLength={50}
                        disabled={!!addingSkillId}
                        className={`${field} h-9 pr-10 disabled:opacity-60`}
                      />
                      {addingSkillId && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-blue-700 rounded-full animate-spin" />
                      )}
                      {showSkillDropdown && !addingSkillId && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                          {skillSuggestions.map((s) => (
                            <button
                              key={s.id}
                              onMouseDown={() => addSkillById(s.id, s.name)}
                              className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* EXPERIENCE */}
              {activeSection === "experience" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">Work Experience</h3>
                    <button onClick={openAddExp} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {addingExp && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                      <p className="text-xs font-semibold text-blue-700">{editingExp ? "Edit experience" : "New experience"}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input value={expForm.role} onChange={(e) => setExpForm({ ...expForm, role: e.target.value })} placeholder="Job title *" maxLength={100} className={field} />
                        <input value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} placeholder="Company *" maxLength={100} className={field} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">Start year *</label>
                          <div className="relative">
                            <select value={expForm.startYear} onChange={(e) => setExpForm({ ...expForm, startYear: e.target.value })} className={selectField}>
                              <option value="">Select year</option>
                              {startYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">End year</label>
                          <div className="relative">
                            <select value={expForm.endYear} onChange={(e) => setExpForm({ ...expForm, endYear: e.target.value })} className={selectField}>
                              <option value="Present">Present</option>
                              {endYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown />
                          </div>
                        </div>
                      </div>
                      <textarea value={expForm.desc} onChange={(e) => setExpForm({ ...expForm, desc: e.target.value })} placeholder="Description" rows={3} maxLength={1000} className={`${field} resize-none`} />
                      <div className="flex gap-2">
                        <button onClick={saveExp} disabled={savingExp} className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors">
                          {savingExp ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-3 h-3" />}
                          {savingExp ? "Saving..." : editingExp ? "Update" : "Save"}
                        </button>
                        <button onClick={() => setAddingExp(false)} disabled={savingExp} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {experience.map((exp) => (
                    <div key={exp.id} className="group relative p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{exp.role}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{exp.company} · {exp.period}</p>
                          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.desc}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditExp(exp)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteExp(exp.id)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {experience.length === 0 && !addingExp && (
                    <div className="text-center py-10 text-slate-400">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No experience added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* EDUCATION */}
              {activeSection === "education" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">Education</h3>
                    <button onClick={openAddEdu} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {addingEdu && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                      <p className="text-xs font-semibold text-blue-700">{editingEdu ? "Edit education" : "New education"}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} placeholder="Degree / qualification *" maxLength={150} className={field} />
                        <input value={eduForm.school} onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })} placeholder="School / university *" maxLength={150} className={field} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">Start year</label>
                          <div className="relative">
                            <select value={eduForm.startYear} onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })} className={selectField}>
                              <option value="">Select year</option>
                              {startYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-0.5">End year</label>
                          <div className="relative">
                            <select value={eduForm.endYear} onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })} className={selectField}>
                              <option value="">Present / Ongoing</option>
                              {endYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown />
                          </div>
                        </div>
                      </div>
                      <textarea value={eduForm.desc} onChange={(e) => setEduForm({ ...eduForm, desc: e.target.value })} placeholder="Description (optional)" rows={3} maxLength={1000} className={`${field} resize-none`} />
                      <div className="flex gap-2">
                        <button onClick={saveEdu} disabled={savingEdu} className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors">
                          {savingEdu ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" /> : <Check className="w-3 h-3" />}
                          {savingEdu ? "Saving..." : editingEdu ? "Update" : "Save"}
                        </button>
                        <button onClick={() => setAddingEdu(false)} disabled={savingEdu} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {education.map((edu) => (
                    <div key={edu.id} className="group relative p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                            <GraduationCap className="w-4 h-4 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{edu.degree}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{edu.school}{edu.startYear ? ` · ${edu.startYear} – ${edu.endYear || "Present"}` : ""}</p>
                            {edu.desc && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{edu.desc}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditEdu(edu)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteEdu(edu.id)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {education.length === 0 && !addingEdu && (
                    <div className="text-center py-10 text-slate-400">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No education added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* CERTIFICATIONS */}
              {activeSection === "certifications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">Certifications</h3>
                    <button onClick={() => { setCertForm({ certId: "", name: "", issuer: "", year: "" }); setAddingCert(true); }} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {addingCert && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                      <p className="text-xs font-semibold text-blue-700">New certification</p>
                      <div className="relative">
                        <input
                          value={certForm.name}
                          onChange={(e) => { setCertForm({ ...certForm, name: e.target.value, certId: "", issuer: "" }); certDebounceRef(e.target.value); }}
                          onBlur={() => setTimeout(() => setShowCertDropdown(false), 150)}
                          onFocus={() => { if (certSuggestions.length > 0) setShowCertDropdown(true); }}
                          placeholder="Search certification (e.g. OSCP, CEH, CISSP)..."
                          maxLength={150}
                          className={`${field} ${certForm.certId ? "border-green-400 bg-green-50" : ""}`}
                        />
                        {certForm.certId && <p className="text-[10px] text-green-600 mt-1 ml-0.5">✓ {certForm.issuer}</p>}
                        {showCertDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                            {certSuggestions.map((c) => (
                              <button
                                key={c.id}
                                onMouseDown={() => { setCertForm(f => ({ ...f, certId: c.id, name: c.name, issuer: c.organization })); setShowCertDropdown(false); }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors"
                              >
                                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                                <p className="text-[11px] text-slate-400">{c.organization}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input value={certForm.year} onChange={(e) => setCertForm({ ...certForm, year: e.target.value })} placeholder="Year obtained (e.g. 2023)" maxLength={4} className={field} />
                      <div className="flex gap-2">
                        <button onClick={saveCert} className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => { setAddingCert(false); setCertForm({ certId: "", name: "", issuer: "", year: "" }); }} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {certs.map((cert) => (
                      <div key={cert.id} className={`group relative flex flex-col gap-1 px-4 py-3 rounded-2xl border-2 transition-all cursor-default ${cert.badge}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold font-mono tracking-wide">{cert.name}</span>
                          <button
                            onClick={() => deleteCert(cert.id, cert.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity -mr-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100"
                          >
                            <X className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                        <span className="text-[11px] opacity-70 leading-tight">{cert.issuer}{cert.year ? ` · ${cert.year}` : ""}</span>
                      </div>
                    ))}
                  </div>

                  {certs.length === 0 && !addingCert && (
                    <div className="text-center py-10 text-slate-400">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No certifications added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* CTF */}
              {activeSection === "ctf" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">CTF & Platform Profiles</h3>
                    <button onClick={() => { setCtfForm({ platform: "", handle: "", rank: "", url: "" }); setAddingCtf(true); }} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {addingCtf && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                      <p className="text-xs font-semibold text-blue-700">New CTF profile</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input value={ctfForm.platform} onChange={(e) => setCtfForm({ ...ctfForm, platform: e.target.value })} placeholder="Platform (e.g. HackTheBox) *" maxLength={50} className={field} />
                        <input value={ctfForm.handle} onChange={(e) => setCtfForm({ ...ctfForm, handle: e.target.value })} placeholder="Handle / username *" maxLength={100} className={field} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input value={ctfForm.rank} onChange={(e) => setCtfForm({ ...ctfForm, rank: e.target.value })} placeholder="Rank / level" maxLength={50} className={field} />
                        <input value={ctfForm.url} onChange={(e) => setCtfForm({ ...ctfForm, url: e.target.value })} placeholder="Profile URL" maxLength={200} className={field} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveCtf} className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setAddingCtf(false)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {ctfList.map((ctf) => (
                    <div key={ctf.id} className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                          {ctf.platform[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{ctf.platform}</p>
                          <p className="text-xs font-mono text-slate-400">{ctf.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {ctf.rank && <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${ctf.rankColor}`}>{ctf.rank}</span>}
                        {ctf.url && (
                          <a href={ctf.url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => deleteCtf(ctf.id, ctf.platform)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {ctfList.length === 0 && !addingCtf && (
                    <div className="text-center py-10 text-slate-400">
                      <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No CTF profiles added yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* RESUME */}
              {activeSection === "resume" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">Resume / CV</h3>
                    <span className="text-[10px] font-mono text-slate-400">{resumes.length} saved</span>
                  </div>

                  {/* Existing resumes */}
                  {resumes.map((r) => (
                    <div key={r.id} className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{r.label}</p>
                          <p className="text-xs text-slate-400 truncate">{r.fileName} · {r.size} · {r.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeResume(r.id, r.label)}
                        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-lg ml-3"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {/* Label + confirm step after picking file */}
                  {addingResume && pendingFile && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                      <p className="text-xs font-semibold text-blue-700">Name this resume</p>
                      <p className="text-[11px] text-slate-500">{pendingFile.name} · {Math.round(pendingFile.size / 1024)} KB</p>
                      <input
                        autoFocus
                        value={resumeLabel}
                        onChange={(e) => setResumeLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveResume()}
                        placeholder={`e.g. "Red Team Roles", "General Application"…`}
                        className={field}
                      />
                      <div className="flex gap-2">
                        <button onClick={saveResume} className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => { setAddingResume(false); setPendingFile(null); }} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload drop zone */}
                  {!addingResume && (
                    <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">Upload another resume</p>
                        <p className="text-xs text-slate-400 mt-0.5">PDF up to 5 MB</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleResumeFile(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
