import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { OpportunityDetailClient } from "./OpportunityDetailClient"
import type { Opportunity, OpportunityStatus, RecruiterApplication, ApplicationStatus } from "../_types"

export async function generateMetadata({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await params;
  if (opportunityId === "new") return { title: "New Job Posting" }
  return { title: "Job Posting Details" }
}

async function fetchOpportunityDetails(opportunityId: string, recruiterId: string) {
  const supabase = await createClient()

  // Find the opportunity
  const { data: rawOpportunity, error: oppError } = await supabase
    .from("opportunities")
    .select(`*`)
    .eq("id", opportunityId)
    .eq("recruiter_id", recruiterId)
    .single()

  if (!rawOpportunity) return null

  // Find all applications — use two separate queries to avoid PostgREST join ambiguity
  const { data: rawApplications, error: appError } = await supabase
    .from("applications")
    .select("id, opportunity_id, candidate_id, status, resume_path, cover_letter, applied_at, updated_at")
    .eq("opportunity_id", opportunityId)
    .order("applied_at", { ascending: false })

  if (appError) {
    console.error("[fetchOpportunityDetails] applications error:", appError.message)
  }

  const apps = rawApplications ?? []
  
  // Fetch candidate names in a separate query when we have applicants
  let candidateMap: Record<string, { display_name: string; email: string }> = {}
  let candidateDetailMap: Record<string, { college_name: string }> = {}
  
  if (apps.length > 0) {
    const candidateIds = apps.map(a => a.candidate_id).filter((id): id is string => !!id)
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", candidateIds)
    
    const { data: candidateData } = await supabase
      .from("candidate_profiles")
      .select("profile_id, college_name")
      .in("profile_id", candidateIds)
    
    if (profileData) {
      for (const p of (profileData as any[])) {
        if (p.id) candidateMap[p.id] = { display_name: p.display_name ?? '', email: p.email ?? '' }
      }
    }
    if (candidateData) {
      for (const cp of (candidateData as any[])) {
        if (cp.profile_id) {
          candidateDetailMap[cp.profile_id] = { college_name: cp.college_name ?? '' }
        }
      }
    }
  }

  const opportunity: Opportunity = {
    id: rawOpportunity.id,
    recruiter_id: rawOpportunity.recruiter_id,
    title: rawOpportunity.title,
    description: rawOpportunity.description,
    required_skills: (rawOpportunity.required_skills as string[]) ?? [],
    associated_test_id: rawOpportunity.associated_test_id ?? undefined,
    stipend: rawOpportunity.stipend ?? undefined,
    duration: rawOpportunity.duration ?? undefined,
    location: rawOpportunity.location ?? undefined,
    is_remote: rawOpportunity.is_remote ?? false,
    application_deadline: rawOpportunity.application_deadline ?? undefined,
    max_applications: rawOpportunity.max_applications ?? undefined,
    status: (rawOpportunity.status as OpportunityStatus) ?? "draft",
    created_at: rawOpportunity.created_at,
    updated_at: rawOpportunity.updated_at || rawOpportunity.created_at,
    application_count: apps.length,
  }

  const applications: RecruiterApplication[] = (apps as any[]).map((app) => ({
    id: app.id,
    opportunity_id: app.opportunity_id ?? '',
    candidate_id: app.candidate_id ?? '',
    status: app.status as ApplicationStatus,
    resume_path: app.resume_path ?? undefined,
    cover_letter: app.cover_letter ?? undefined,
    applied_at: app.applied_at,
    updated_at: app.updated_at,
    candidate_name: candidateMap[app.candidate_id as string]?.display_name || "Unknown Candidate",
    candidate_email: candidateMap[app.candidate_id as string]?.email || undefined,
    candidate_university: candidateDetailMap[app.candidate_id as string]?.college_name || undefined,
  }))

  return { opportunity, applications }
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>
}) {
  const { opportunityId } = await params

  // "new" logic handled by edit/page.tsx routing if they go there, 
  // but if they hit here with "new" we should just redirect to edit
  if (opportunityId === "new") {
    redirect("/~/postings/new/edit")
  }

  const profile = await getUserProfile()
  if (!profile || profile.account_type !== "recruiter") {
    redirect("/~/home")
  }

  const data = await fetchOpportunityDetails(opportunityId, profile.id)
  
  if (!data) {
    notFound()
  }

  return (
    <OpportunityDetailClient
      opportunity={data.opportunity}
      applications={data.applications}
    />
  )
}
