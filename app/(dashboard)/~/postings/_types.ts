export type OpportunityStatus = "draft" | "published" | "archived" | "closed";

export interface Opportunity {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  required_skills: string[];
  associated_test_id?: string;
  stipend?: string;
  duration?: string;
  location?: string;
  is_remote: boolean;
  application_deadline?: string;
  max_applications?: number;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;

  // Derived/Joined fields
  application_count?: number;
}

export type ApplicationStatus = "pending" | "applied" | "reviewing" | "shortlisted" | "rejected" | "hired";

export interface RecruiterApplication {
  id: string;
  opportunity_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  resume_path?: string;
  cover_letter?: string;
  applied_at: string;
  updated_at: string;

  // Joined candidate profile
  candidate_name?: string;
  candidate_email?: string;
  candidate_university?: string;
}
