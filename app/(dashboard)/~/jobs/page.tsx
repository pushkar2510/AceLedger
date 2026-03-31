import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { CandidateJobsClient } from "./CandidateJobsClient"
import type { CandidateOpportunity, CandidateJobStatus } from "./_types"

export const metadata = {
  title: "Job Search",
  description: "Browse and apply for active opportunities.",
}

async function fetchCandidateJobs(candidateId: string): Promise<CandidateOpportunity[]> {
  const supabase = await createClient()

  // Find opportunities that are published. We join recruiter_profiles to show company info.
  const { data: rawOpportunities } = await supabase
    .from("opportunities")
    .select(`
      id, recruiter_id, title, description, required_skills, associated_test_id,
      stipend, duration, location, is_remote, application_deadline, status, created_at,
      recruiter_profiles ( company_name, logo_path ),
      applications ( id ) 
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  return (rawOpportunities ?? []).map((o: any) => {
    // Check if the current candidate is in the applications list
    // 'applications' join returns an array of applications. We can filter it later or inline.
    // Wait, the select is applications(id) but this might fetch all applications for the opportunity.
    // That's fine for small scale, but ideally we should filter `applications!inner(id).candidate_id.eq(candidateId)`.
    
    // Simple filter:
    const hasApplied = o.applications && Array.isArray(o.applications) && o.applications.some((app: any) => app.candidate_id === candidateId);

    return {
      id: o.id,
      recruiter_id: o.recruiter_id,
      title: o.title,
      description: o.description,
      required_skills: (o.required_skills as string[]) ?? [],
      associated_test_id: o.associated_test_id ?? undefined,
      stipend: o.stipend ?? undefined,
      duration: o.duration ?? undefined,
      location: o.location ?? undefined,
      is_remote: o.is_remote ?? false,
      application_deadline: o.application_deadline ?? undefined,
      status: (o.status as CandidateJobStatus) ?? "published",
      created_at: o.created_at,
      
      company_name: o.recruiter_profiles?.company_name || "Unknown Company",
      company_logo: o.recruiter_profiles?.logo_path || undefined,
      
      // We will override has_applied efficiently here. Wait, `o.applications` doesn't include candidate_id unless we select it. Let's fix the select in the next pass.
      has_applied: false // We will compute this in a better query
    }
  })
}

// A better query implementation:
async function fetchJobsWithApplyStatus(candidateId: string): Promise<CandidateOpportunity[]> {
  const supabase = await createClient()

  // 1. Fetch published opportunities
  const { data: rawOpportunities, error: oppsError } = await supabase
    .from("opportunities")
    .select(`
      id, recruiter_id, title, description, required_skills, associated_test_id,
      stipend, duration, location, is_remote, application_deadline, status, created_at,
      recruiter_profiles ( company_name, logo_path )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (oppsError) {
    console.error("fetchJobsWithApplyStatus - Error fetching opportunities:", oppsError)
  }

  // 2. Fetch candidate applications to know if they applied
  const { data: applications } = await supabase
    .from("applications")
    .select("opportunity_id")
    .eq("candidate_id", candidateId)

  const appliedOppIds = new Set((applications ?? []).map(a => a.opportunity_id))

  return (rawOpportunities ?? []).map((o: any) => {
    return {
      id: o.id,
      recruiter_id: o.recruiter_id,
      title: o.title,
      description: o.description,
      required_skills: (o.required_skills as string[]) ?? [],
      associated_test_id: o.associated_test_id ?? undefined,
      stipend: o.stipend ?? undefined,
      duration: o.duration ?? undefined,
      location: o.location ?? undefined,
      is_remote: o.is_remote ?? false,
      application_deadline: o.application_deadline ?? undefined,
      status: (o.status as CandidateJobStatus) ?? "published",
      created_at: o.created_at,
      
      // Fallback: recruiter_profiles company_name
      company_name: o.recruiter_profiles?.company_name || "Confidential Company",
      
      has_applied: appliedOppIds.has(o.id)
    }
  })
}

export default async function JobsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "candidate") {
    const jobs = await fetchJobsWithApplyStatus(profile.id)
    return <CandidateJobsClient jobs={jobs} candidateId={profile.id} />
  }

  // Recruiters should use `/~/postings`
  redirect("/~/home")
}
