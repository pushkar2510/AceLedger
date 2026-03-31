"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MapPin, GraduationCap, CheckCircle2, FlaskConical, ExternalLink, ChevronDown, Briefcase, FileText } from "lucide-react"
import { AssignTestDialog } from "./AssignTestDialog"

export function RecruiterCandidatesClient({ candidates }: { candidates: any[] }) {
  const [search, setSearch] = useState("")
  const [showOnlyTested, setShowOnlyTested] = useState(false)
  const [assignTestCandidate, setAssignTestCandidate] = useState<any | null>(null)

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const matchSearch =
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
        c.course_name?.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (showOnlyTested && !c.has_taken_test) return false

      return true
    })
  }, [candidates, search, showOnlyTested])

  return (
    <div className="w-full min-h-screen pb-12">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 md:px-8 border-b">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">Talent Pool / Candidates</h1>
            <p className="text-sm text-muted-foreground">
              Discover and source active candidates for your opportunities.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills, or degree..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 h-9">
            <Switch
              id="tested-filter"
              checked={showOnlyTested}
              onCheckedChange={setShowOnlyTested}
            />
            <Label htmlFor="tested-filter" className="text-sm cursor-pointer select-none">
              Prioritize Tested Candidates
            </Label>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 md:px-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Search className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">No candidates found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(c => (
              <Card key={c.profile_id} className="group hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={c.avatar_path} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {c.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {c.has_taken_test && (
                      <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-0 flex shrink-0 cursor-default">
                        <FlaskConical className="h-3 w-3" /> Tested
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="font-semibold text-base leading-tight truncate">
                      {c.full_name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.email}
                    </p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {c.course_name && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.course_name} ({c.passout_year})</span>
                      </div>
                    )}
                    {c.cgpa > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>CGPA: {c.cgpa}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-5 pb-1 max-h-[50px] overflow-hidden relative">
                    {c.skills?.slice(0, 4).map((skill: string) => (
                      <Badge key={skill} variant="outline" className="text-[10px] px-1.5 font-normal">
                        {skill}
                      </Badge>
                    ))}
                    {c.skills?.length > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 font-normal border-dashed text-muted-foreground">
                        +{c.skills.length - 4}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" asChild className="h-8">
                      <Link href={`/~/candidates/${c.profile_id}`}>View Profile</Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-8 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Invite <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/~/postings/new/edit?invite=${c.profile_id}`} className="cursor-pointer">
                            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                            To Job Posting
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAssignTestCandidate(c)} className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          Assign Test
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AssignTestDialog 
        isOpen={!!assignTestCandidate} 
        onOpenChange={(open) => !open && setAssignTestCandidate(null)} 
        candidate={assignTestCandidate} 
      />
    </div>
  )
}
