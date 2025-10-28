export interface ProjectDetail {
  id: string;
  role_title: string;
  status: string | null;
  created_at: string | null;
  shareable_link_id: string | null;
  job_summary: string | null;
  candidate_source: string | null;
  tier_name: string | null;
  candidate_count: number | null;
  payment_status: string | null;
  hours_elapsed: number | null;
  candidates_completed: number | null;
  total_candidates: number | null;
  completion_percentage: number | null;
  role_definitions: Array<{
    id: string;
    definition_data: unknown;
    audition_scaffolds: Array<{
      id: string;
      scaffold_preview_html: string | null;
      dimension_justification?: string | null;
    }> | null;
  }> | null;
}
