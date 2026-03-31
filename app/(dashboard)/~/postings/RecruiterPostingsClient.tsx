"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Plus, PenLine, CheckCircle2, PlayCircle, LayoutList, MapPin,
  Users, CalendarClock, Briefcase, ChevronRight, Loader2,
  User, Mail, GraduationCap, FileText, ArrowRight, ChevronDown,
  X, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Opportunity, OpportunityStatus, RecruiterApplication, ApplicationStatus } from "./_types"
import { updateApplicationStatusAction, updateOpportunityStatusAction } from "./actions"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Kanban column config ─────────────────────────────────────────────────────
const COLUMNS: {
  id: ApplicationStatus
  label: string
  colBg: string
  headerColor: string
  pillClass: string
  dot: string
}[] = [
  { id: "pending",    label: "Applied",     colBg: "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",          headerColor: "text-slate-600 dark:text-slate-400",   pillClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",          dot: "bg-slate-400" },
  { id: "reviewing",  label: "Reviewing",   colBg: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",    headerColor: "text-amber-700 dark:text-amber-400",   pillClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",      dot: "bg-amber-400" },
  { id: "shortlisted",label: "Shortlisted", colBg: "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",       headerColor: "text-blue-700 dark:text-blue-400",     pillClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",          dot: "bg-blue-400" },
  { id: "hired",      label: "Hired",       colBg: "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50", headerColor: "text-emerald-700 dark:text-emerald-400", pillClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500" },
  { id: "rejected",   label: "Rejected",    colBg: "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/60",           headerColor: "text-red-600 dark:text-red-400",       pillClass: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",              dot: "bg-red-400" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(dt?: string | null) {
  if (!dt) return "—"
  return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function statusBadge(status: OpportunityStatus) {
  if (status === "published") return (
    <Badge className="gap-1.5 bg-emerald-500 hover:bg-emerald-500 text-white border-0 text-[11px] px-2 py-0.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
      </span>
      Live
    </Badge>
  )
  if (status === "draft") return (
    <Badge variant="outline" className="gap-1 text-[11px] px-2 py-0.5 text-muted-foreground border-dashed">
      <PenLine className="h-3 w-3" />Draft
    </Badge>
  )
  return (
    <Badge variant="outline" className="gap-1 text-[11px] px-2 py-0.5 text-muted-foreground">
      <CheckCircle2 className="h-3 w-3" />Closed
    </Badge>
  )
}

// ─── Applicant detail sheet ───────────────────────────────────────────────────
function ApplicantSheet({ app, open, onClose, onMove, isUpdating }: {
  app: RecruiterApplication | null
  open: boolean
  onClose: () => void
  onMove: (id: string, status: ApplicationStatus) => void
  isUpdating: boolean
}) {
  if (!app) return null
  const col = COLUMNS.find(c => c.id === app.status) ?? COLUMNS[0]
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[420px] flex flex-col gap-0 p-0 overflow-y-auto">
        <div className="p-5 border-b bg-muted/30">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted border flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-sm leading-tight">{app.candidate_name || "Unknown"}</SheetTitle>
                <SheetDescription className="text-xs">Application details</SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Stage</p>
            <Badge className={cn("border-0 font-medium gap-1.5 text-xs", col.pillClass)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", col.dot)} />{col.label}
            </Badge>
          </div>

          {(app.candidate_email || app.candidate_university) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Contact</p>
              <div className="space-y-1">
                {app.candidate_email && (
                  <a href={`mailto:${app.candidate_email}`} className="flex items-center gap-2 text-sm hover:underline">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{app.candidate_email}
                  </a>
                )}
                {app.candidate_university && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />{app.candidate_university}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Applied</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {app.cover_letter && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Cover Letter</p>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {app.cover_letter}
              </div>
            </div>
          )}

          <div className="pt-3 border-t">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Move to Stage</p>
            <div className="grid grid-cols-2 gap-2">
              {COLUMNS.filter(c => c.id !== app.status).map(c => (
                <button key={c.id} disabled={isUpdating}
                  onClick={() => { onMove(app.id, c.id); onClose() }}
                  className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition hover:opacity-80 disabled:opacity-50", c.pillClass)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />{c.label}
                  <ArrowRight className="h-2.5 w-2.5 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Single applicant card ────────────────────────────────────────────────────
function ApplicantCard({ app, onDragStart, onMove, onOpen, isUpdating }: {
  app: RecruiterApplication
  onDragStart: (e: React.DragEvent, id: string) => void
  onMove: (id: string, status: ApplicationStatus) => void
  onOpen: (app: RecruiterApplication) => void
  isUpdating: boolean
}) {
  return (
    <div draggable onDragStart={e => onDragStart(e, app.id)} onClick={() => onOpen(app)}
      className="group bg-card border rounded-xl p-3 cursor-pointer shadow-xs hover:shadow-md transition-all duration-150 space-y-2 select-none hover:border-primary/30 active:scale-[0.98]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-xs leading-tight truncate">{app.candidate_name || "Unknown"}</p>
          {app.candidate_university && (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 truncate">
              <GraduationCap className="h-2.5 w-2.5 shrink-0" />{app.candidate_university}
            </p>
          )}
        </div>
        {/* drag dots */}
        <div className="flex flex-col gap-0.5 mt-0.5 opacity-20 group-hover:opacity-50 shrink-0">
          {[0,1,2].map(i=><div key={i} className="flex gap-0.5">{[0,1].map(j=><div key={j} className="h-1 w-1 rounded-full bg-foreground"/>)}</div>)}
        </div>
      </div>

      {app.candidate_email && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
          <Mail className="h-2.5 w-2.5 shrink-0" />{app.candidate_email}
        </p>
      )}

      <div className="flex items-center justify-between pt-1.5 border-t gap-2" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {app.cover_letter && <FileText className="h-2.5 w-2.5 text-muted-foreground/40" />}
          <span className="text-[10px] text-muted-foreground">{fmtDate(app.applied_at)}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isUpdating}
              className="h-5 px-1.5 text-[10px] text-muted-foreground gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Move <ChevronDown className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuLabel className="text-xs py-1">Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNS.filter(c => c.id !== app.status).map(c => (
              <DropdownMenuItem key={c.id} className="text-xs cursor-pointer gap-2" onClick={() => onMove(app.id, c.id)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />{c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── Inline Kanban Board ──────────────────────────────────────────────────────
function InlineKanban({ applications, onMove, isUpdating }: {
  applications: RecruiterApplication[]
  onMove: (id: string, status: ApplicationStatus) => void
  isUpdating: boolean
}) {
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null)
  const [selectedApp, setSelectedApp] = useState<RecruiterApplication | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Keep selectedApp in sync with updated application list
  useEffect(() => {
    if (selectedApp) {
      const updated = applications.find(a => a.id === selectedApp.id)
      if (updated) setSelectedApp(updated)
    }
  }, [applications])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("appId", id)
    e.dataTransfer.effectAllowed = "move"
  }
  const handleDragOver = (e: React.DragEvent, colId: ApplicationStatus) => {
    e.preventDefault()
    if (dragOver !== colId) setDragOver(colId)
  }
  const handleDrop = (e: React.DragEvent, colId: ApplicationStatus) => {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData("appId")
    const app = applications.find(a => a.id === id)
    if (app && app.status !== colId) onMove(id, colId)
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed rounded-2xl bg-muted/10">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium">No applicants yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Applications appear here once candidates apply</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2.5 overflow-x-auto pb-3 items-start">
        {COLUMNS.map(col => {
          const cards = applications.filter(a => a.status === col.id || (col.id === "pending" && a.status === "applied"))
          const isTarget = dragOver === col.id
          return (
            <div key={col.id}
              className={cn("min-w-[200px] w-full flex-shrink-0 flex flex-col rounded-xl border-2 p-2.5 transition-all duration-150", col.colBg, isTarget && "ring-2 ring-primary/40 scale-[1.02]")}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}>

              {/* header */}
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", col.dot)} />
                  <span className={cn("font-semibold text-xs", col.headerColor)}>{col.label}</span>
                </div>
                <span className={cn("text-[10px] font-bold h-4 min-w-4 flex items-center justify-center rounded-full px-1", col.pillClass)}>
                  {cards.length}
                </span>
              </div>

              {/* cards */}
              <div className="flex flex-col gap-1.5 flex-1 min-h-[60px]">
                {cards.length === 0 ? (
                  <div className={cn("flex-1 flex items-center justify-center rounded-lg border-2 border-dashed text-[10px] text-muted-foreground/40 min-h-[60px] transition-all", isTarget && "border-primary/40 bg-primary/5 text-primary/60")}>
                    {isTarget ? "Drop here" : "Empty"}
                  </div>
                ) : cards.map(app => (
                  <ApplicantCard key={app.id} app={app}
                    onDragStart={handleDragStart}
                    onMove={onMove}
                    onOpen={a => { setSelectedApp(a); setSheetOpen(true) }}
                    isUpdating={isUpdating} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <ApplicantSheet app={selectedApp} open={sheetOpen} onClose={() => setSheetOpen(false)}
        onMove={onMove} isUpdating={isUpdating} />
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  postings: Opportunity[]
}

export function RecruiterPostingsClient({ postings: initialPostings }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [postings, setPostings] = useState<Opportunity[]>(initialPostings)
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "closed">("all")
  const [selectedId, setSelectedId] = useState<string | null>(initialPostings[0]?.id ?? null)
  const [applications, setApplications] = useState<RecruiterApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const selected = postings.find(p => p.id === selectedId) ?? null

  // ── Fetch applications for the selected posting ───────────────────────────
  const fetchApplications = useCallback(async (oppId: string) => {
    setLoadingApps(true)
    try {
      const { data: appData, error } = await supabase
        .from("applications")
        .select("id, opportunity_id, candidate_id, status, resume_path, cover_letter, applied_at, updated_at")
        .eq("opportunity_id", oppId)
        .order("applied_at", { ascending: false })

      if (error) throw error

      const apps = (appData ?? []) as any[]
      if (apps.length === 0) { setApplications([]); return }

      const candidateIds = [...new Set(apps.map(a => a.candidate_id).filter(Boolean))] as string[]

      const [{ data: profileData }, { data: detailData }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, email").in("id", candidateIds),
        supabase.from("candidate_profiles").select("profile_id, college_name").in("profile_id", candidateIds),
      ])

      const profileMap: Record<string, { display_name: string; email: string }> = {}
      const detailMap: Record<string, string> = {}
      for (const p of (profileData ?? []) as any[]) if (p.id) profileMap[p.id] = { display_name: p.display_name ?? "", email: p.email ?? "" }
      for (const d of (detailData ?? []) as any[]) if (d.profile_id) detailMap[d.profile_id] = d.college_name ?? ""

      setApplications(apps.map(a => ({
        id: a.id,
        opportunity_id: a.opportunity_id ?? "",
        candidate_id: a.candidate_id ?? "",
        status: a.status as ApplicationStatus,
        resume_path: a.resume_path ?? undefined,
        cover_letter: a.cover_letter ?? undefined,
        applied_at: a.applied_at,
        updated_at: a.updated_at,
        candidate_name: profileMap[a.candidate_id]?.display_name || "Unknown",
        candidate_email: profileMap[a.candidate_id]?.email || undefined,
        candidate_university: detailMap[a.candidate_id] || undefined,
      })))

      // Update application count on the posting
      setPostings(prev => prev.map(p => p.id === oppId ? { ...p, application_count: apps.length } : p))
    } catch (e: any) {
      toast.error("Failed to load applications", { description: e.message })
    } finally {
      setLoadingApps(false)
    }
  }, [supabase])

  // Fetch whenever selected changes
  useEffect(() => {
    if (selectedId) fetchApplications(selectedId)
    else setApplications([])
  }, [selectedId, fetchApplications])

  // ── Status update (optimistic) ────────────────────────────────────────────
  const handleMove = useCallback(async (appId: string, newStatus: ApplicationStatus) => {
    const prev = [...applications]
    // Optimistic update
    setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus, updated_at: new Date().toISOString() } : a))
    setIsUpdating(true)
    try {
      await updateApplicationStatusAction(appId, newStatus)
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label ?? newStatus}`)
    } catch (e: any) {
      setApplications(prev) // rollback
      toast.error("Update failed", { description: e.message })
    } finally {
      setIsUpdating(false)
    }
  }, [applications])

  // ── Filtered postings ─────────────────────────────────────────────────────
  const filtered = postings.filter(p => {
    if (filter === "all") return true
    if (filter === "closed") return p.status === "closed" || p.status === "archived"
    return p.status === filter
  })

  const counts = {
    all: postings.length,
    published: postings.filter(p => p.status === "published").length,
    draft: postings.filter(p => p.status === "draft").length,
    closed: postings.filter(p => p.status === "closed" || p.status === "archived").length,
  }

  const tabs: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "published", label: "Live" },
    { id: "draft", label: "Drafts" },
    { id: "closed", label: "Closed" },
  ]

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">

      {/* ── Left: Job List ──────────────────────────────────────────────────── */}
      <div className="w-[280px] shrink-0 flex flex-col border-r bg-muted/20 overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold">Job Postings</h1>
            <Button size="sm" className="h-7 gap-1 text-xs px-2" onClick={() => router.push("/~/postings/new/edit")}>
              <Plus className="h-3 w-3" />New
            </Button>
          </div>
          {/* Tab filter */}
          <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={cn("flex-1 text-[10px] font-medium px-1 py-1 rounded-md transition-all",
                  filter === t.id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
                {t.label}
                {counts[t.id] > 0 && <span className="ml-0.5 opacity-60">({counts[t.id]})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Job list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
              <Briefcase className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No postings</p>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => router.push("/~/postings/new/edit")}>
                <Plus className="h-3 w-3 mr-1" />Create one
              </Button>
            </div>
          ) : filtered.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={cn("w-full text-left px-4 py-3 transition-colors border-b border-transparent hover:bg-muted/60",
                selectedId === p.id && "bg-background border-r-2 border-primary")}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{p.title}</p>
                {statusBadge(p.status)}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" />{p.application_count ?? 0}
                </span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />{p.is_remote ? "Remote" : (p.location ?? "—")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: ATS Kanban ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Briefcase className="h-10 w-10 opacity-20" />
            <p className="text-sm">Select a job posting to manage applicants</p>
          </div>
        ) : (
          <>
            {/* Kanban header */}
            <div className="px-6 pt-5 pb-4 border-b flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusBadge(selected.status)}
                  <h2 className="text-base font-semibold truncate">{selected.title}</h2>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{applications.length} applicant{applications.length !== 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{applications.filter(a => a.status === "shortlisted").length} shortlisted</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-purple-500" />{applications.filter(a => a.status === "hired").length} hired</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => fetchApplications(selected.id)} disabled={loadingApps} title="Refresh">
                  <RefreshCw className={cn("h-3.5 w-3.5", loadingApps && "animate-spin")} />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" asChild>
                  <Link href={`/~/postings/${selected.id}/edit`}><PenLine className="h-3 w-3" />Edit</Link>
                </Button>
                {selected.status !== "archived" && selected.status !== "closed" && (
                  <Button variant="destructive" size="sm" className="h-7 text-xs"
                    onClick={async () => {
                      try { await updateOpportunityStatusAction(selected.id, "archived"); setPostings(ps => ps.map(p => p.id === selected.id ? { ...p, status: "archived" as OpportunityStatus } : p)); toast.success("Job closed") }
                      catch (e: any) { toast.error(e.message) }
                    }}>
                    Close Job
                  </Button>
                )}
              </div>
            </div>

            {/* Kanban hint */}
            <div className="px-6 pt-3 pb-1 text-[11px] text-muted-foreground flex items-center gap-2">
              <span>Drag cards between columns or hover a card to use the quick-move menu</span>
              {isUpdating && <span className="flex items-center gap-1 text-primary"><Loader2 className="h-2.5 w-2.5 animate-spin" />Saving…</span>}
            </div>

            {/* Board area */}
            <div className="flex-1 overflow-auto px-6 pb-6 pt-2">
              {loadingApps ? (
                <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading applicants…
                </div>
              ) : (
                <InlineKanban applications={applications} onMove={handleMove} isUpdating={isUpdating} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
