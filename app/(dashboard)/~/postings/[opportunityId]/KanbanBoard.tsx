"use client"

import * as React from "react"
import { ApplicationStatus, RecruiterApplication } from "../_types"
import { Mail, GraduationCap, FileText, ChevronDown, User, CalendarClock, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Column config — only valid DB statuses ──────────────────────────────────
// DB allows: pending | applied | reviewing | shortlisted | hired | rejected
// We display 5 clean columns:
export const COLUMNS: {
  id: ApplicationStatus
  label: string
  colBg: string
  headerColor: string
  pillClass: string
  dotColor: string
}[] = [
  {
    id: "pending",
    label: "Applied",
    colBg: "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
    headerColor: "text-slate-600 dark:text-slate-400",
    pillClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dotColor: "bg-slate-400",
  },
  {
    id: "reviewing",
    label: "Reviewing",
    colBg: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
    headerColor: "text-amber-700 dark:text-amber-400",
    pillClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    dotColor: "bg-amber-400",
  },
  {
    id: "shortlisted",
    label: "Shortlisted",
    colBg: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
    headerColor: "text-blue-700 dark:text-blue-400",
    pillClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    dotColor: "bg-blue-400",
  },
  {
    id: "hired",
    label: "Hired",
    colBg: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50",
    headerColor: "text-emerald-700 dark:text-emerald-400",
    pillClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  {
    id: "rejected",
    label: "Rejected",
    colBg: "bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/50",
    headerColor: "text-red-600 dark:text-red-400",
    pillClass: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    dotColor: "bg-red-400",
  },
]

function formatDate(dt?: string) {
  if (!dt) return "—"
  return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

// ─── Applicant Detail Sheet ───────────────────────────────────────────────────
function ApplicantSheet({
  app,
  open,
  onClose,
  onStatusChange,
  isUpdating,
}: {
  app: RecruiterApplication | null
  open: boolean
  onClose: () => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
  isUpdating?: boolean
}) {
  if (!app) return null
  const col = COLUMNS.find(c => c.id === app.status) ?? COLUMNS[0]

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[440px] overflow-y-auto flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="p-6 border-b bg-muted/30">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base leading-tight truncate">{app.candidate_name || "Unknown Candidate"}</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">Application details</SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Current stage */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Current Stage</p>
            <Badge className={cn("border-0 font-medium gap-1.5", col.pillClass)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", col.dotColor)} />
              {col.label}
            </Badge>
          </div>

          {/* Contact */}
          {(app.candidate_email || app.candidate_university) && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Contact</p>
              <div className="space-y-1.5">
                {app.candidate_email && (
                  <a href={`mailto:${app.candidate_email}`} className="flex items-center gap-2 text-sm hover:underline">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {app.candidate_email}
                  </a>
                )}
                {app.candidate_university && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    {app.candidate_university}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applied date */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Applied On</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Cover Letter */}
          {app.cover_letter && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Cover Letter</p>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground max-h-48 overflow-y-auto">
                {app.cover_letter}
              </div>
            </div>
          )}

          {/* Move stage */}
          <div className="pt-2 border-t">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Move to Stage</p>
            <div className="grid grid-cols-2 gap-2">
              {COLUMNS.filter(c => c.id !== app.status).map(c => (
                <button
                  key={c.id}
                  disabled={isUpdating}
                  onClick={() => { onStatusChange(app.id, c.id); onClose() }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50",
                    c.pillClass
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dotColor)} />
                  {c.label}
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
function ApplicantCard({
  app,
  col,
  onDragStart,
  onStatusChange,
  onOpen,
  isUpdating,
}: {
  app: RecruiterApplication
  col: typeof COLUMNS[number]
  onDragStart: (e: React.DragEvent, id: string) => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
  onOpen: (app: RecruiterApplication) => void
  isUpdating?: boolean
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, app.id)}
      onClick={() => onOpen(app)}
      className="group relative bg-card border rounded-xl p-3 shadow-xs hover:shadow-md transition-all duration-150 space-y-2 select-none cursor-pointer hover:border-primary/30 active:scale-[0.98] active:cursor-grabbing"
    >
      {/* Name */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{app.candidate_name || "Unknown"}</p>
          {app.candidate_university && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
              <GraduationCap className="h-2.5 w-2.5 shrink-0" />
              {app.candidate_university}
            </p>
          )}
        </div>
        {/* Drag handle indicator */}
        <div className="flex flex-col gap-0.5 mt-0.5 shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
          {[0,1,2].map(i => <div key={i} className="flex gap-0.5">{[0,1].map(j => <div key={j} className="h-1 w-1 rounded-full bg-muted-foreground" />)}</div>)}
        </div>
      </div>

      {/* Email */}
      {app.candidate_email && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
          <Mail className="h-2.5 w-2.5 shrink-0" />
          {app.candidate_email}
        </p>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-2 border-t gap-2"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          {app.cover_letter && <FileText className="h-2.5 w-2.5 text-muted-foreground/50" />}
          <span className="text-[10px] text-muted-foreground">{formatDate(app.applied_at)}</span>
        </div>

        {/* Quick move dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Move <ChevronDown className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[150px]">
            <DropdownMenuLabel className="text-xs py-1">Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNS.filter(c => c.id !== app.status).map(c => (
              <DropdownMenuItem
                key={c.id}
                className="text-xs cursor-pointer gap-2"
                onClick={() => onStatusChange(app.id, c.id)}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", c.dotColor)} />
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── Main KanbanBoard ─────────────────────────────────────────────────────────
interface KanbanBoardProps {
  applications: RecruiterApplication[]
  onStatusChange: (appId: string, newStatus: ApplicationStatus) => void
  isUpdating?: boolean
}

export function KanbanBoard({ applications, onStatusChange, isUpdating }: KanbanBoardProps) {
  const [dragOver, setDragOver] = React.useState<ApplicationStatus | null>(null)
  const [selectedApp, setSelectedApp] = React.useState<RecruiterApplication | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("appId", id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, colId: ApplicationStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragOver !== colId) setDragOver(colId)
  }

  const handleDrop = (e: React.DragEvent, colId: ApplicationStatus) => {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData("appId")
    const app = applications.find(a => a.id === id)
    if (app && app.status !== colId) onStatusChange(id, colId)
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border-2 border-dashed rounded-2xl bg-muted/20">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium">No applicants yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Applications will appear here once candidates apply</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 items-start w-full min-h-[400px]">
        {COLUMNS.map(col => {
          // "applied" and "pending" both show in the first column
          const cards = applications.filter(a =>
            a.status === col.id || (col.id === "pending" && a.status === "applied")
          )
          const isTarget = dragOver === col.id

          return (
            <div
              key={col.id}
              className={cn(
                "min-w-[240px] w-full flex-shrink-0 flex flex-col rounded-2xl border-2 p-3 transition-all duration-150",
                col.colBg,
                isTarget && "ring-2 ring-primary/50 border-primary/50 scale-[1.015]"
              )}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", col.dotColor)} />
                  <span className={cn("font-semibold text-sm", col.headerColor)}>{col.label}</span>
                </div>
                <span className={cn("text-[11px] font-bold h-5 min-w-5 flex items-center justify-center rounded-full px-1.5", col.pillClass)}>
                  {cards.length}
                </span>
              </div>

              {/* Drop zone / cards */}
              <div className="flex flex-col gap-2 flex-1 min-h-[80px]">
                {cards.length === 0 ? (
                  <div className={cn(
                    "flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-xs text-muted-foreground/40 min-h-[80px] transition-all",
                    isTarget && "border-primary/40 text-primary/60 bg-primary/5"
                  )}>
                    {isTarget ? "↓ Drop here" : "Empty"}
                  </div>
                ) : (
                  cards.map(app => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      col={col}
                      onDragStart={handleDragStart}
                      onStatusChange={onStatusChange}
                      onOpen={a => { setSelectedApp(a); setSheetOpen(true) }}
                      isUpdating={isUpdating}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ApplicantSheet
        app={selectedApp}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStatusChange={onStatusChange}
        isUpdating={isUpdating}
      />
    </>
  )
}
