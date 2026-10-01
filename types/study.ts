export interface StudyTopic {
  id: number;
  certification: number;
  certification_code?: string;
  domain_number: number;
  domain_name: string;
  domain_weight_pct: number;
  name: string;
  slug: string;
  order: number;
  description: string;
  blueprint_ref: string;
  icon: string;
  lab_count?: number;
  question_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudyCertification {
  id: number;
  code: string; // e.g. "CCNA-200-301" | "AWS-SAA-C03"
  name: string;
  vendor: string;
  exam_code: string;
  description: string;
  icon: string;
  total_exam_time_minutes: number;
  total_exam_questions: number;
  passing_score_pct: number;
  is_active: boolean;
  total_topics?: number;
  total_questions?: number;
  total_labs?: number;
  topics?: StudyTopic[];
}

export interface LabAddressingEntry {
  device: string;
  interface: string;
  ip: string;
  subnet: string;
  vlan?: string;
  default_gateway?: string;
}

export interface LabStepTask {
  step_num: number;
  title: string;
  instructions: string;
  verify_prompt?: string;
}

export interface LabConfigRule {
  pattern: string;
  description: string;
  section: string;
  required: boolean;
}

export interface LabAwsVerificationCheck {
  service: string;
  check_type: string;
  resource_name?: string;
  resource_tag?: string;
  params?: Record<string, any>;
  expected: any;
}

export interface StudyLabAttempt {
  id: number;
  user: number;
  lab: number;
  lab_title?: string;
  status: "not_started" | "in_progress" | "completed";
  notes: string;
  time_spent_seconds: number;
  submitted_config?: string;
  checker_results?: {
    score?: number;
    passed_rules?: string[];
    missing_rules?: string[];
    wrong_lines?: string[];
    summary?: string;
  };
  teardown_confirmed: boolean;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudyLab {
  id: number;
  topic: number;
  topic_name?: string;
  certification_code?: string;
  title: string;
  slug: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time_minutes: number;
  objectives: string[];
  topology_type: "svg" | "image";
  topology_data: string;
  prerequisites: string;
  addressing_table: LabAddressingEntry[];
  step_by_step_tasks: LabStepTask[];
  hints: string[];
  solution: string;
  setup_template?: string;
  setup_template_type?: "cisco_initial" | "cloudformation" | "terraform" | "none";
  packet_tracer_file?: string | null;
  gns3_eve_file?: string | null;
  expected_config_rules?: LabConfigRule[];
  aws_verification_checks?: LabAwsVerificationCheck[];
  teardown_instructions?: string;
  estimated_cost_usd: number | string;
  free_tier_eligible: boolean;
  order: number;
  user_attempt?: StudyLabAttempt | null;
  created_at?: string;
  updated_at?: string;
}

export interface QuestionOption {
  id: string; // "A" | "B" | "C" | "D"
  text: string;
}

export interface StudyQuestion {
  id: number;
  certification: number;
  certification_code?: string;
  topic: number;
  topic_name?: string;
  question_type:
    | "single_choice"
    | "multi_select"
    | "scenario_output"
    | "drag_and_drop"
    | "subnetting_calc";
  text: string;
  scenario_context?: string;
  code_output?: string;
  options: QuestionOption[];
  correct_answers: string[]; // ["A"] or ["B", "C"]
  explanation: string;
  distractor_notes?: Record<string, string>; // { "B": "Why B is wrong", ... }
  trigger_words?: string;
  step_by_step_solution?: string;
  reference_doc_url?: string;
  difficulty: "easy" | "medium" | "hard";
  tags?: string[];
  source: "ai" | "manual";
  similarity_hash?: string;
  is_favorite: boolean;
  is_reported?: boolean;
  report_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudyExamAnswer {
  id: number;
  session: number;
  question: number;
  question_details?: StudyQuestion;
  user_answers: string[];
  is_correct: boolean;
  flagged_for_review: boolean;
  time_spent_seconds: number;
  notes?: string;
  created_at?: string;
}

export interface StudyExamSession {
  id: number;
  user: number;
  certification: number;
  certification_code?: string;
  certification_name?: string;
  mode: "practice" | "timed_mock" | "retry_wrong" | "weak_drill";
  topic?: number | null;
  topic_name?: string | null;
  total_questions: number;
  duration_minutes: number;
  time_spent_seconds: number;
  score_pct: number | string;
  passed: boolean;
  domain_breakdown?: Record<
    string,
    { total: number; correct: number; pct: number }
  >;
  is_completed: boolean;
  started_at: string;
  completed_at?: string | null;
  answers?: StudyExamAnswer[];
}

export interface StudyFlashcard {
  id: number;
  user: number;
  topic: number;
  topic_name?: string;
  certification_code?: string;
  question?: number | null;
  front: string;
  back: string;
  repetition_level: number;
  interval_days: number;
  ease_factor: number | string;
  due_date: string;
  last_reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudyNote {
  id: number;
  user: number;
  topic: number;
  topic_name?: string;
  title: string;
  content: string;
  is_mistake_journal: boolean;
  related_question?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationContact {
  name: string;
  role: string;
  email?: string;
  linkedin?: string;
}

export interface StudyInterviewBrief {
  id: number;
  organization: number;
  company_summary: string;
  tech_stack: string[];
  role_requirements_map: Array<{
    requirement: string;
    candidate_skill_or_project?: string;
    match_strength?: "High" | "Medium" | "Growth Area" | string;
    recommended_angle?: string;
    matched_skills?: string[];
    portfolio_proof?: string;
  }>;
  technical_questions: Array<{
    question: string;
    category?: string;
    suggested_answer: string;
    deep_dive_topics?: string[];
  }>;
  behavioral_star_questions: Array<{
    question: string;
    competency?: string;
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    star_situation?: string;
    star_task?: string;
    star_action?: string;
    star_result?: string;
  }>;
  questions_to_ask: string[];
  study_plan_30_60_90: {
    day_30?: {
      title?: string;
      focus_areas?: string[];
      recommended_cert_domains?: string[];
    } | string[];
    day_60?: {
      title?: string;
      focus_areas?: string[];
      recommended_cert_domains?: string[];
    } | string[];
    day_90?: {
      title?: string;
      focus_areas?: string[];
      recommended_cert_domains?: string[];
    } | string[];
    [key: string]: any;
  };
  raw_input_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudyOrganization {
  id: number;
  user: number;
  company_name: string;
  company_url?: string;
  job_posting_url?: string;
  role: string;
  status: "Wishlist" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  application_date?: string | null;
  interview_date?: string | null;
  contacts?: OrganizationContact[];
  notes?: string;
  linked_topics?: number[];
  linked_topic_details?: StudyTopic[];
  brief?: StudyInterviewBrief | null;
  mock_interviews_count?: number;
  latest_mock_score?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface AvailableApplication {
  id: number;
  company: string;
  role: string;
  status: string;
  link?: string;
  date_applied?: string | null;
  job_requirements?: string;
  already_imported: boolean;
}

export interface StudyMockInterview {
  id: number;
  user: number;
  organization: number;
  company_name?: string;
  role_title: string;
  transcript: Array<{
    role: "interviewer" | "candidate" | "system";
    content: string;
    timestamp?: string;
  }>;
  feedback?: {
    overall_score?: number;
    verdict?: string;
    technical_score?: number;
    communication_score?: number;
    strengths?: string[];
    weaknesses?: string[];
    areas_to_improve?: string[];
    recommended_study_topics?: string[];
    detailed_feedback?: string;
    overall_rating?: string;
    key_takeaways?: string[];
    [key: string]: any;
  };
  overall_score: number;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudyLog {
  id: number;
  user: number;
  certification?: number | null;
  certification_code?: string;
  topic?: number | null;
  topic_name?: string;
  session_type:
    | "lab"
    | "quiz"
    | "exam"
    | "flashcard"
    | "reading"
    | "interview_prep"
    | "pomodoro";
  duration_minutes: number;
  date: string;
  notes?: string;
  created_at?: string;
}

export interface StudyGoal {
  id: number;
  user: number;
  certification: number;
  certification_code?: string;
  target_exam_date: string;
  daily_goal_minutes: number;
  weekly_goal_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudyProgress {
  certification: string;
  name: string;
  total_topics: number;
  total_labs: number;
  completed_labs: number;
  lab_completion_pct: number;
  total_questions_attempted: number;
  accuracy_pct: number;
  mock_exams_taken: number;
  mock_exam_average: number;
  readiness_score: number;
}

export interface PublicStudyBadgeData {
  certifications: Array<{
    code: string;
    name: string;
    vendor: string;
    exam_code: string;
    progress_pct: number;
    status: string;
  }>;
  streak_days: number;
  total_study_hours: number;
  last_updated: string;
}
