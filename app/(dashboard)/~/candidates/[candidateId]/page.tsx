import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { CandidateProfileView } from "./CandidateProfileView"

export async function generateMetadata({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("candidate_profiles")
    .select("full_name")
    .eq("profile_id", candidateId)
    .maybeSingle()

  return {
    title: data?.full_name ? `${data.full_name} — Candidate Profile` : "Candidate Profile",
  }
}

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

async function fetchCandidateDetail(candidateId: string, recruiterId: string) {
  const supabase = await createClient()

  // 1. Candidate profile + email from profiles
  const { data: candidate } = await supabase
    .from("candidate_profiles")
    .select(`
      profile_id, full_name, first_name, middle_name, last_name,
      phone_number, gender, date_of_birth, current_address,
      college_name, course_name, passout_year, cgpa,
      ssc_percentage, hsc_percentage, diploma_percentage,
      skills, linkedin_url, github_url, portfolio_links,
      profile_image_path, profile_complete,
      profiles ( email )
    `)
    .eq("profile_id", candidateId)
    .maybeSingle()

  if (!candidate) return null

  const c = candidate as any

  // 2. Test attempts for recruiter's tests
  const { data: recruiterTests } = await supabase
    .from("tests")
    .select("id, title")
    .eq("recruiter_id", recruiterId)

  let testAttempts: TestAttemptInfo[] = []
  if (recruiterTests && recruiterTests.length > 0) {
    const testIds = recruiterTests.map(t => t.id)
    const testTitleMap = Object.fromEntries(recruiterTests.map(t => [t.id, t.title]))

    const { data: attempts } = await supabase
      .from("test_attempts")
      .select("id, test_id, status, score, total_marks, percentage, passed, submitted_at, started_at")
      .eq("student_id", candidateId)
      .in("test_id", testIds)
      .order("started_at", { ascending: false })

    if (attempts) {
      testAttempts = attempts.map(a => ({
        id: a.id,
        test_title: testTitleMap[a.test_id] || "Unknown Test",
        status: a.status,
        score: a.score,
        total_marks: a.total_marks,
        percentage: a.percentage,
        passed: a.passed,
        submitted_at: a.submitted_at,
        started_at: a.started_at,
      }))
    }
  }

  // 3. Applications to this recruiter's opportunities
  const { data: rawApps } = await supabase
    .from("applications")
    .select(`
      id, status, applied_at,
      opportunities!inner ( title, recruiter_id )
    `)
    .eq("candidate_id", candidateId)
    .eq("opportunities.recruiter_id", recruiterId)
    .order("applied_at", { ascending: false })

  const applications: ApplicationInfo[] = (rawApps || []).map((a: any) => ({
    id: a.id,
    opportunity_title: a.opportunities?.title || "Unknown Opportunity",
    status: a.status,
    applied_at: a.applied_at,
  }))

  const detail: CandidateDetail = {
    profile_id: c.profile_id,
    full_name: c.full_name || "Unknown Candidate",
    first_name: c.first_name,
    middle_name: c.middle_name,
    last_name: c.last_name,
    email: c.profiles?.email || "",
    phone_number: c.phone_number,
    gender: c.gender,
    date_of_birth: c.date_of_birth,
    current_address: c.current_address,
    college_name: c.college_name,
    course_name: c.course_name,
    passout_year: c.passout_year,
    cgpa: c.cgpa,
    ssc_percentage: c.ssc_percentage,
    hsc_percentage: c.hsc_percentage,
    diploma_percentage: c.diploma_percentage,
    skills: c.skills || [],
    linkedin_url: c.linkedin_url,
    github_url: c.github_url,
    portfolio_links: c.portfolio_links || [],
    avatar_path: c.profile_image_path,
    profile_complete: c.profile_complete ?? false,
  }

  return { detail, testAttempts, applications }
}

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ candidateId: string }>
}) {
  const { candidateId } = await params
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type !== "recruiter") redirect("/~/home")

  const data = await fetchCandidateDetail(candidateId, profile.id)
  if (!data) notFound()

  return (
    <CandidateProfileView
      candidate={data.detail}
      testAttempts={data.testAttempts}
      applications={data.applications}
    />
  )
}
