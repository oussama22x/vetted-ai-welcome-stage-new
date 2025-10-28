export interface ProjectDetail {
  id: string;
  role_title: string;
  status: string | null;
  created_at: string | null;
  job_summary: string | null;
  candidate_source: string | null;
  tier_name: string | null;
  candidate_count: number | null;
  payment_status: string | null;
  hours_elapsed: number | null;
  candidates_completed: number | null;
  total_candidates: number | null;
  completion_percentage: number | null;
  role_definitions: {
    id: string;
    definition_data: unknown;
    audition_scaffolds: {
      id: string;
      scaffold_preview_html: string | null;
      scaffold_data: {
        dimension_justification?: string | null;
        [key: string]: unknown;
      } | null;
    } | null;
  } | null;
}
