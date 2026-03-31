"use client"

import { useState, useEffect } from "react"
import { CandidateOpportunity } from "./_types"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Search, MapPin, Clock, Building, Briefcase, IndianRupee, Sparkles } from "lucide-react"
import { ApplyDialog } from "./ApplyDialog"

interface CandidateJobsClientProps {
  jobs: CandidateOpportunity[];
  candidateId: string;
}

export function CandidateJobsClient({ jobs: initialJobs, candidateId }: CandidateJobsClientProps) {
  const [jobs, setJobs] = useState<CandidateOpportunity[]>(initialJobs)
  const [search, setSearch] = useState("")
  const [filterRemote, setFilterRemote] = useState(false)

  useEffect(() => {
    setJobs(initialJobs)
  }, [initialJobs])

  // Handlers for updating job list after applying
  const handleApplied = (jobId: string) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, has_applied: true } : j))
  }

  // Filter logic
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                          j.company_name.toLowerCase().includes(search.toLowerCase()) ||
                          j.required_skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesRemote = filterRemote ? j.is_remote : true;
    return matchesSearch && matchesRemote;
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Job Search</h1>
        <p className="text-sm text-muted-foreground">Discover active opportunities from top companies.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search by job title, company, or skills..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={filterRemote ? "default" : "outline"} 
            onClick={() => setFilterRemote(!filterRemote)}
            className="h-10 text-sm"
          >
            Remote Only
          </Button>
          <Button variant="outline" className="h-10 text-sm" onClick={() => { setSearch(""); setFilterRemote(false); }}>
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/20 border-2 border-dashed rounded-lg">
            No opportunities found matching your criteria.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="group relative flex flex-col rounded-xl border bg-card p-6 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-1.5 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                    <Building className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{job.company_name}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{job.is_remote ? "Remote" : (job.location || "Location N/A")}</span>
                </div>
                {job.duration && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{job.duration}</span>
                  </div>
                )}
                {job.stipend && (
                  <div className="flex items-center gap-1.5 truncate">
                    <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{job.stipend}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 truncate">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{job.required_skills.length > 0 ? job.required_skills[0] : "Various"}</span>
                </div>
              </div>

              {job.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6 line-clamp-2 overflow-hidden h-6">
                  {job.required_skills.slice(0, 3).map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                  {job.required_skills.length > 3 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      +{job.required_skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4 border-t flex flex-col gap-3">
                <span className="text-xs text-muted-foreground">
                  Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
                
                <div className="flex items-center gap-2 w-full">
                  <Button variant="outline" size="sm" asChild className="flex-1 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-900">
                    <Link href={`/~/resume-analyzer?job_id=${job.id}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Analyze Fit
                    </Link>
                  </Button>

                  {job.has_applied ? (
                    <Button variant="secondary" disabled className="flex-1 h-9 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                      Applied
                    </Button>
                  ) : (
                    <div className="flex-1">
                      <ApplyDialog job={job} candidateId={candidateId} onApplySuccess={() => handleApplied(job.id)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
