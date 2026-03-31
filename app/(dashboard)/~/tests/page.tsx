// app/~/tests/page.tsx

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { CandidateTestsClient } from "./CandidateTestsClient"
import { RecruiterTestsClient } from "./RecruiterTestsClient"
import {
  deriveStatus,
  type CandidateTest,
  type CandidateTestAttempt,
  type RecruiterTest,
} from "./_types"

export const metadata = {
  title: "Tests",
  description: "Mock Tests",
}

// ─── Candidate data ───────────────────────────────────────────────────────────

async function fetchCandidateTests(userId: string): Promise<CandidateTest[]> {
  const supabase = await createClient()

  // 1. Fetch public tests
  const { data: publicTests } = await supabase
    .from("tests")
    .select("id, title, description, time_limit_seconds, available_from, available_until, results_available")
    .eq("status", "published")

  // 2. Fetch test invitations
  const { data: invitations } = await (supabase as any)
    .from("test_invitations")
    .select(`
      test_id,
      tests (id, title, description, time_limit_seconds, available_from, available_until, results_available),
      recruiter_profiles!inner(company_name)
    `)
    .eq("candidate_id", userId)
    .eq("status", "pending")

  // 3. Merge them (deduplicate)
  const testMap = new Map<string, any>()
  
  if (publicTests) {
    publicTests.forEach(t => testMap.set(t.id, { ...t, inviter_company: undefined }))
  }

  if (invitations) {
    invitations.forEach((inv: any) => {
      const t = Array.isArray(inv.tests) ? inv.tests[0] : inv.tests;
      const rName = Array.isArray(inv.recruiter_profiles) ? inv.recruiter_profiles[0]?.company_name : inv.recruiter_profiles?.company_name;
      if (t) {
         // If a test is public but they were also explicitly invited, show the invitation badge
         testMap.set(t.id, { ...t, inviter_company: rName || "Unknown Company" })
      }
    })
  }

  const rawTests = Array.from(testMap.values())
  if (!rawTests.length) return []

  const testIds = rawTests.map(t => t.id)

  // 4. Fetch candidate's latest attempts per test
  const { data: rawAttempts } = await supabase
    .from("test_attempts")
    .select("test_id, status, submitted_at, score, total_marks, percentage")
    .eq("student_id", userId)
    .in("test_id", testIds)
    .order("created_at", { ascending: false })

  // 5. Build raw attempt map
  const rawAttemptMap: Record<string, {
    status: "in_progress" | "submitted"
    submitted_at?: string
    score?: number
    total_marks?: number
    percentage?: number
  }> = {}
  for (const a of rawAttempts ?? []) {
    if (rawAttemptMap[a.test_id]) continue
    rawAttemptMap[a.test_id] = {
      status: a.status as "in_progress" | "submitted",
      submitted_at: a.submitted_at ?? undefined,
      score: a.score ?? undefined,
      total_marks: a.total_marks ?? undefined,
      percentage: a.percentage ?? undefined,
    }
  }

  // 6. Shape into CandidateTest[]
  return rawTests.map((t): CandidateTest => {
    const raw = rawAttemptMap[t.id]

    let attempt: CandidateTestAttempt | undefined
    if (raw) {
      attempt = {
        status: raw.status,
        submitted_at: raw.submitted_at,
        score: raw.score,
        total_marks: raw.total_marks,
        percentage: raw.percentage,
      }
    }

    return {
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      time_limit_seconds: t.time_limit_seconds ?? undefined,
      available_from: t.available_from ?? undefined,
      available_until: t.available_until ?? undefined,
      derived_status: deriveStatus(
        "published",
        t.available_from,
        t.available_until
      ) as CandidateTest["derived_status"],
      results_available: t.results_available,
      inviter_company: t.inviter_company,
      attempt,
    }
  }).sort((a, b) => {
    // Sort invited tests first, then by available_from descending
    if (a.inviter_company && !b.inviter_company) return -1
    if (!a.inviter_company && b.inviter_company) return 1
    const da = a.available_from ? new Date(a.available_from).getTime() : 0
    const db = b.available_from ? new Date(b.available_from).getTime() : 0
    return db - da
  })
}

// ─── Recruiter data ───────────────────────────────────────────────────────────

async function fetchRecruiterTests(userId: string): Promise<RecruiterTest[]> {
  const supabase = await createClient()

  const { data: rawTests } = await supabase
    .from("view_test_summary")
    .select("*")
    .eq("recruiter_id", userId)
    .order("id", { ascending: false }) // Fallback order if created_at not in view (it is not, let me check)

  // Note: I should add created_at to view_test_summary if I want to maintain the same order.
  // Actually, I'll update the view definition to include created_at.

  return (rawTests ?? []).map((t): RecruiterTest => ({
    id: t.id ?? "",
    title: t.title ?? "Untitled",
    description: (t as any).description ?? undefined,
    time_limit_seconds: t.time_limit_seconds ?? undefined,
    available_from: t.available_from ?? undefined,
    available_until: t.available_until ?? undefined,
    derived_status: deriveStatus(t.status ?? "draft", t.available_from ?? null, t.available_until ?? null),
    status: (t.status as "draft" | "published") ?? "draft",
    results_available: (t as any).results_available ?? false,
    question_count: t.question_count ?? 0,
    attempt_count: t.attempt_count ?? 0,
  }))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TestsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "candidate") {
    const tests = await fetchCandidateTests(profile.id)
    return <CandidateTestsClient tests={tests} />
  }

  if (profile.account_type === "recruiter") {
    const tests = await fetchRecruiterTests(profile.id)
    return <RecruiterTestsClient tests={tests} />
  }

  redirect("/~/tests")
}
