"use client"

import * as React from "react"
import Link from "next/link"
import { updateOpportunityStatusAction, updateApplicationStatusAction } from "../actions"
import type { Opportunity, RecruiterApplication, ApplicationStatus } from "../_types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowLeft,
  Briefcase,
  Users,
  MapPin,
  CalendarClock,
  Clock,
  PenLine,
  CheckCircle2,
  MoreHorizontal,
  Mail,
  FileText
} from "lucide-react"

import { KanbanBoard } from "./KanbanBoard"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatDateTime(dt?: string): string {
  if (!dt) return "—"
  return new Date(dt).toLocaleString("en-US", { dateStyle: "medium" })
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20" },
    applied: { label: "Applied", color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
    reviewing: { label: "Reviewing", color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" },
    shortlisted: { label: "Shortlisted", color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
    hired: { label: "Hired", color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
  }
  const config = map[status]
  
  return (
    <Badge variant="secondary" className={`capitalize font-medium border-0 ${config.color}`}>
      {config.label}
    </Badge>
  )
}

export function OpportunityDetailClient({
  opportunity,
  applications: initialApplications,
}: {
  opportunity: Opportunity
  applications: RecruiterApplication[]
}) {
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [applications, setApplications] = React.useState<RecruiterApplication[]>(initialApplications)

  // Sync state if server prop changes
  React.useEffect(() => {
    setApplications(initialApplications)
  }, [initialApplications])

  const handleUpdateAppStatus = async (appId: string, newStatus: ApplicationStatus) => {
    // Optimistic Update
    const previousState = [...applications]
    setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: newStatus } : app))

    try {
      setIsUpdating(true)
      await updateApplicationStatusAction(appId, newStatus)
      toast.success(`Application updated to ${newStatus}`)
    } catch (error) {
      // Revert on error
      setApplications(previousState)
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCloseJob = async () => {
    try {
      setIsUpdating(true)
      await updateOpportunityStatusAction(opportunity.id, "archived")
      toast.success("Job posting closed successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to close posting")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen w-full pb-12">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 md:px-8 max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/~/postings">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Postings
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{opportunity.title}</h1>
              <Badge variant={opportunity.status === "published" ? "default" : "secondary"}>
                {opportunity.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {opportunity.is_remote ? "Remote" : opportunity.location || "Location not set"}</span>
              <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Deadline: {formatDateTime(opportunity.application_deadline)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/~/postings/${opportunity.id}/edit`}>
                <PenLine className="h-4 w-4 mr-1.5" /> Edit
              </Link>
            </Button>
            {opportunity.status !== "archived" && (
              <Button variant="destructive" size="sm" onClick={handleCloseJob} disabled={isUpdating}>
                Close Job
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-8 md:px-8 max-w-6xl mx-auto space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-500" />
                {applications.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
                {applications.filter(a => a.status === 'shortlisted').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-purple-500" />
                {applications.filter(a => a.status === 'hired').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Applicants ATS Board</h2>
            <p className="text-sm text-muted-foreground">Drag and drop candidates to update their status.</p>
          </div>
          <KanbanBoard applications={applications} onStatusChange={handleUpdateAppStatus} isUpdating={isUpdating} />
        </div>
      </div>
    </div>
  )
}
