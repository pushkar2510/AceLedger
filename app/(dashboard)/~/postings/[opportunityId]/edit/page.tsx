import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { PostingsEditClient } from "./PostingsEditClient"
import type { Opportunity, OpportunityStatus } from "../../_types"

export const metadata = {
  title: "Edit Job Posting",
  description: "Create or edit a job posting",
}

export default async function EditPostingPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const profile = await getUserProfile()
  if (!profile || profile.account_type !== "recruiter") {
    redirect("/~/home")
  }

  const { opportunityId } = await params

  let posting: Opportunity | null = null

  if (opportunityId !== "new") {
    const supabase = await createClient()
    const { data } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", opportunityId)
      .single()

    if (!data || data.recruiter_id !== profile.id) {
      redirect("/~/postings")
    }

    posting = {
      ...data,
      status: data.status as OpportunityStatus,
      required_skills: (data.required_skills as string[]) ?? [],
      updated_at: data.updated_at || data.created_at
    } as Opportunity
  } else {
    // New posting template
    posting = {
      id: "new",
      recruiter_id: profile.id,
      title: "",
      description: "",
      required_skills: [],
      is_remote: false,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return <PostingsEditClient posting={posting as Opportunity} />
}
