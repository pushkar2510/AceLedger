"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, GraduationCap,
  Linkedin, Github, Globe, ExternalLink, FlaskConical,
  CheckCircle2, XCircle, Clock, TrendingUp, Briefcase, User,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateDetail {
  profile_id: string
  full_name: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  email: string
  phone_number: string | null
  gender: string | null
  date_of_birth: string | null
  current_address: string | null
  college_name: string | null
  course_name: string | null
  passout_year: number | null
  cgpa: number | null
  ssc_percentage: number | null
  hsc_percentage: number | null
  diploma_percentage: number | null
  skills: string[]
  linkedin_url: string | null
  github_url: string | null
  portfolio_links: string[]
  avatar_path: string | null
  profile_complete: boolean
}

interface TestAttemptInfo {
  id: string
  test_title: string
  status: string
  score: number | null
  total_marks: number | null
  percentage: number | null
  passed: boolean | null
  submitted_at: string | null
  started_at: string
}

interface ApplicationInfo {
  id: string
  opportunity_title: string
  status: string
  applied_at: string
}

interface Props {
  candidate: CandidateDetail
  testAttempts: TestAttemptInfo[]
  applications: ApplicationInfo[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GENDER_MAP: Record<string, string> = { M: "Male", F: "Female", O: "Other" }

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?"
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  reviewed: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  shortlisted: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  rejected: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" },
  hired: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  submitted: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  in_progress: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  auto_submitted: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { bg: "bg-muted", text: "text-muted-foreground" }
  return (
    <Badge variant="secondary" className={`${style.bg} ${style.text} border-0 capitalize`}>
      {status.replace(/_/g, " ")}
    </Badge>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, href }: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
  href?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            {value} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CandidateProfileView({ candidate: c, testAttempts, applications }: Props) {
  const bestAttempt = testAttempts
    .filter(a => a.status === "submitted" && a.percentage != null)
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))[0]

  const avgScore = testAttempts.length > 0
    ? (testAttempts.filter(a => a.percentage != null).reduce((s, a) => s + (a.percentage ?? 0), 0) /
       testAttempts.filter(a => a.percentage != null).length).toFixed(1)
    : null

  return (
    <div className="w-full min-h-screen pb-16">
      {/* Top bar */}
      <div className="px-4 pt-6 md:px-8">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 mb-4">
          <Link href="/~/candidates">
            <ArrowLeft className="h-4 w-4" /> Back to Talent Pool
          </Link>
        </Button>
      </div>

      {/* Hero header */}
      <div className="px-4 pb-6 md:px-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar className="h-20 w-20 border-2 shrink-0">
            <AvatarImage src={c.avatar_path ?? undefined} className="object-cover" />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
              {getInitials(c.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{c.full_name}</h1>
              {c.profile_complete && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Complete Profile
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{c.email}</p>
            {c.course_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                {c.course_name}
                {c.college_name && ` · ${c.college_name}`}
                {c.passout_year && ` · ${c.passout_year}`}
              </p>
            )}
          </div>

          <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
            {c.linkedin_url && (
              <Button variant="outline" size="icon" asChild className="h-9 w-9">
                <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            )}
            {c.github_url && (
              <Button variant="outline" size="icon" asChild className="h-9 w-9">
                <a href={c.github_url} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            )}
            {c.email && (
              <Button variant="outline" size="icon" asChild className="h-9 w-9">
                <a href={`mailto:${c.email}`} aria-label="Email">
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Stats row */}
      <div className="px-4 py-6 md:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="CGPA" value={c.cgpa != null ? c.cgpa : "—"} />
          <StatCard label="Test Attempts" value={testAttempts.length} />
          <StatCard label="Best Score" value={bestAttempt ? `${bestAttempt.percentage}%` : "—"} sub={bestAttempt ? bestAttempt.test_title : undefined} />
          <StatCard label="Avg Score" value={avgScore ? `${avgScore}%` : "—"} />
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 md:px-8 grid gap-6 lg:grid-cols-3">
        {/* Left column: Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              <InfoRow icon={Mail} label="Email" value={c.email} href={`mailto:${c.email}`} />
              <InfoRow icon={Phone} label="Phone" value={c.phone_number} />
              <InfoRow icon={User} label="Gender" value={c.gender ? GENDER_MAP[c.gender] ?? c.gender : null} />
              <InfoRow icon={Calendar} label="Date of Birth" value={c.date_of_birth ? formatDate(c.date_of_birth) : null} />
              <InfoRow icon={MapPin} label="Address" value={c.current_address} />
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {c.college_name && (
                <div>
                  <p className="text-xs text-muted-foreground">College / University</p>
                  <p className="text-sm font-medium">{c.college_name}</p>
                </div>
              )}
              {c.course_name && (
                <div>
                  <p className="text-xs text-muted-foreground">Course / Branch</p>
                  <p className="text-sm font-medium">{c.course_name}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {c.passout_year && (
                  <div>
                    <p className="text-xs text-muted-foreground">Graduation Year</p>
                    <p className="text-sm font-medium">{c.passout_year}</p>
                  </div>
                )}
                {c.cgpa != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">CGPA</p>
                    <p className="text-sm font-medium">{c.cgpa}</p>
                  </div>
                )}
              </div>
              {(c.ssc_percentage || c.hsc_percentage || c.diploma_percentage) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-3">
                    {c.ssc_percentage != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">SSC</p>
                        <p className="text-sm font-medium">{c.ssc_percentage}%</p>
                      </div>
                    )}
                    {c.hsc_percentage != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">HSC</p>
                        <p className="text-sm font-medium">{c.hsc_percentage}%</p>
                      </div>
                    )}
                    {c.diploma_percentage != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Diploma</p>
                        <p className="text-sm font-medium">{c.diploma_percentage}%</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          {(c.linkedin_url || c.github_url || c.portfolio_links.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Links & Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 divide-y">
                <InfoRow icon={Linkedin} label="LinkedIn" value={c.linkedin_url ? c.linkedin_url.replace(/https?:\/\/(www\.)?linkedin\.com\//i, "") : null} href={c.linkedin_url ?? undefined} />
                <InfoRow icon={Github} label="GitHub" value={c.github_url ? c.github_url.replace(/https?:\/\/(www\.)?github\.com\//i, "") : null} href={c.github_url ?? undefined} />
                {c.portfolio_links.filter(Boolean).map((link, i) => (
                  <InfoRow key={i} icon={Globe} label={`Portfolio ${c.portfolio_links.length > 1 ? i + 1 : ""}`} value={link.replace(/https?:\/\//, "")} href={link} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Skills + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          {c.skills.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Skills</CardTitle>
                <CardDescription>{c.skills.length} skill{c.skills.length !== 1 ? "s" : ""} listed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {c.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs font-normal px-2.5 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4" /> Test History
              </CardTitle>
              <CardDescription>
                {testAttempts.length === 0
                  ? "This candidate has not taken any of your tests yet."
                  : `${testAttempts.length} attempt${testAttempts.length !== 1 ? "s" : ""} on your tests`}
              </CardDescription>
            </CardHeader>
            {testAttempts.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  {testAttempts.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-3 gap-4">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium truncate">{a.test_title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.submitted_at ? formatDate(a.submitted_at) : formatDate(a.started_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {a.status === "submitted" && a.score != null && (
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {a.score}/{a.total_marks}
                            </p>
                            {a.percentage != null && (
                              <p className="text-xs text-muted-foreground">{a.percentage}%</p>
                            )}
                          </div>
                        )}
                        {a.passed === true && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        )}
                        {a.passed === false && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Application History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Application History
              </CardTitle>
              <CardDescription>
                {applications.length === 0
                  ? "This candidate has not applied to any of your opportunities."
                  : `${applications.length} application${applications.length !== 1 ? "s" : ""} to your opportunities`}
              </CardDescription>
            </CardHeader>
            {applications.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  {applications.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-3 gap-4">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium truncate">{a.opportunity_title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Applied {formatDate(a.applied_at)}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
