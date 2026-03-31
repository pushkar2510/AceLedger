import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { RecruiterPostingsClient } from "./RecruiterPostingsClient"
import type { Opportunity, OpportunityStatus } from "./_types"

export const metadata = {
  title: "Job Postings | ATS",
  description: "Manage Job Postings and Applicant Tracking",
}

async function fetchRecruiterPostings(userId: string): Promise<Opportunity[]> {
  const supabase = await createClient()

  const { data: rawOpportunities } = await supabase
    .from("opportunities")
    .select(`*`)
    .eq("recruiter_id", userId)
    .order("created_at", { ascending: false })

  if (!rawOpportunities?.length) return []

  const oppIds = rawOpportunities.map(o => o.id)
  const { data: appCounts } = await supabase
    .from("applications")
    .select("opportunity_id")
    .in("opportunity_id", oppIds)

  const countMap: Record<string, number> = {}
  for (const row of (appCounts ?? []) as { opportunity_id: string }[]) {
    countMap[row.opportunity_id] = (countMap[row.opportunity_id] ?? 0) + 1
  }

  return rawOpportunities.map((o): Opportunity => ({
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
    max_applications: o.max_applications ?? undefined,
    status: (o.status as OpportunityStatus) ?? "draft",
    created_at: o.created_at,
    updated_at: o.updated_at || o.created_at,
    application_count: countMap[o.id] ?? 0,
  }))
}

export default async function PostingsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "recruiter") {
    const postings = await fetchRecruiterPostings(profile.id)
    return <RecruiterPostingsClient postings={postings} />
  }

  if (profile.account_type === "candidate") {
    redirect("/~/jobs")
  }

  redirect("/~/home")
}
