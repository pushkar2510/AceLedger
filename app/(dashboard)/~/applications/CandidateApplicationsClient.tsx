"use client"

import { useState } from "react"
import type { CandidateApplication, ApplicationStatus } from "./page"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Building, Calendar, Search } from "lucide-react"

export function CandidateApplicationsClient({ initialApplications }: { initialApplications: CandidateApplication[] }) {
  const [search, setSearch] = useState("")

  const statusColors: Record<ApplicationStatus, string> = {
    pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    reviewed: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    shortlisted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  }

  const filteredApps = initialApplications.filter(app => 
    app.opportunity_title.toLowerCase().includes(search.toLowerCase()) || 
    app.company_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Applications</h1>
        <p className="text-sm text-muted-foreground">Track the status of roles you have applied for.</p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search by job title or company..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-full bg-background"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filteredApps.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-muted/20 border-2 border-dashed rounded-lg">
            No applications found.
          </div>
        ) : (
          filteredApps.map((app) => (
            <div key={app.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <h3 className="font-semibold text-lg leading-tight truncate">
                    {app.opportunity_title}
                  </h3>
                  <Badge variant="secondary" className={`${statusColors[app.status]} border-0 capitalize whitespace-nowrap`}>
                    {app.status}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{app.company_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{app.is_remote ? "Remote" : (app.location || "Location N/A")}</span>
                  </div>

                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Applied {format(new Date(app.applied_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
