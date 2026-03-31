import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { RecruiterApplicationsClient } from "./RecruiterApplicationsClient"
import { CandidateApplicationsClient } from "./CandidateApplicationsClient"

export const metadata = {
  title: "Applications",
  description: "Manage your applications and hiring pipeline",
}

export type ApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";

export interface ATSApplication {
  id: string;
  opportunity_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  resume_path?: string;
  cover_letter?: string;
  applied_at: string;
  
  candidate_name: string;
  candidate_email: string;
  candidate_image?: string;
  
  opportunity_title: string;
}

export interface CandidateApplication {
  id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  applied_at: string;
  
  opportunity_title: string;
  company_name: string;
  location?: string;
  is_remote?: boolean;
}

async function fetchApplications(recruiterId: string): Promise<ATSApplication[]> {
  const supabase = await createClient()

  // We need to fetch applications for opportunities owned by this recruiter
  const { data: rawApps } = await supabase
    .from("applications")
    .select(`
      id, opportunity_id, candidate_id, status, resume_path, cover_letter, applied_at,
      opportunities!inner(title, recruiter_id),
      profiles!applications_candidate_id_fkey(email, display_name, avatar_path),
      candidate_profiles!applications_candidate_id_fkey(full_name, profile_image_path)
    `)
    .eq("opportunities.recruiter_id", recruiterId)
    .order("applied_at", { ascending: false })

  return (rawApps || []).map((app: any) => ({
    id: app.id,
    opportunity_id: app.opportunity_id,
    candidate_id: app.candidate_id,
    status: app.status as ApplicationStatus,
    resume_path: app.resume_path,
    cover_letter: app.cover_letter,
    applied_at: app.applied_at,
    
    // Fallback logic for candidate details
    candidate_name: app.candidate_profiles?.full_name || app.profiles?.display_name || "Unknown Candidate",
    candidate_email: app.profiles?.email || "",
    candidate_image: app.candidate_profiles?.profile_image_path || app.profiles?.avatar_path || undefined,
    
    opportunity_title: app.opportunities?.title || "Unknown Opportunity",
  }))
}

async function fetchCandidateApplications(candidateId: string): Promise<CandidateApplication[]> {
  const supabase = await createClient()

  const { data: rawApps } = await supabase
    .from("applications")
    .select(`
      id, opportunity_id, status, applied_at,
      opportunities!inner (
        title, location, is_remote,
        recruiter_profiles ( company_name ),
        profiles ( display_name )
      )
    `)
    .eq("candidate_id", candidateId)
    .order("applied_at", { ascending: false })

  return (rawApps || []).map((app: any) => {
    const opp = app.opportunities;
    // Handle cases where the relation might be an array or single object (should be single but Supabase sometimes nests it depending on exact FK setup if not explicit)
    const opportunityGroup = Array.isArray(opp) ? opp[0] : opp;
    
    const companyName = opportunityGroup?.recruiter_profiles?.company_name || 
                        opportunityGroup?.profiles?.display_name || 
                        "Unknown Company";

    return {
      id: app.id,
      opportunity_id: app.opportunity_id,
      status: app.status as ApplicationStatus,
      applied_at: app.applied_at,
      
      opportunity_title: opportunityGroup?.title || "Unknown Job",
      company_name: companyName,
      location: opportunityGroup?.location || undefined,
      is_remote: opportunityGroup?.is_remote || false,
    }
  })
}

export default async function ApplicationsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "recruiter") {
    const apps = await fetchApplications(profile.id)
    return <RecruiterApplicationsClient initialApplications={apps} />
  }

  if (profile.account_type === "candidate") {
    const apps = await fetchCandidateApplications(profile.id)
    return <CandidateApplicationsClient initialApplications={apps} />
  }

  redirect("/~/home")
}
