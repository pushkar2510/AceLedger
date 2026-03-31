import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_ANON_KEY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(`
      id, recruiter_id, title, description, required_skills, associated_test_id,
      stipend, duration, location, is_remote, application_deadline, status, created_at,
      recruiter_profiles ( company_name, website )
    `)
    .eq("status", "published");

  console.log("Raw Ops:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

run();
