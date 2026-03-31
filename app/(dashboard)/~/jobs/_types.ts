export type CandidateJobStatus = "published" | "archived" | "closed";

export interface CandidateOpportunity {
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
  status: CandidateJobStatus;
  created_at: string;
  
  // Joined fields
  company_name: string;
  company_logo?: string;
  
  // Status context
  has_applied: boolean;
}
