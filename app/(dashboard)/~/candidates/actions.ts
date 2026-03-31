"use server"

import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"

export async function fetchRecruiterTestsAction() {
  const profile = await getUserProfile()
  if (!profile || profile.account_type !== "recruiter") return { error: "Unauthorized" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tests")
    .select("id, title")
    .eq("recruiter_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (error) return { error: error.message }
  return { tests: data }
}

export async function inviteCandidateToTestAction(candidateId: string, testId: string, message?: string) {
  const profile = await getUserProfile()
  if (!profile || profile.account_type !== "recruiter") return { error: "Unauthorized" }

  const supabase = (await createClient()) as any

  const { error } = await supabase
    .from("test_invitations")
    .insert({
      test_id: testId,
      candidate_id: candidateId,
      recruiter_id: profile.id,
      message: message || null
    })

  if (error) {
    if (error.code === '23505') {
       return { error: "Candidate is already invited to this test." }
    }
    return { error: error.message }
  }

  return { success: true }
}
