import { authenticatedFetch } from "./auth-fetch";
import { API_BASE_URL } from "./config";
import type {
  StudyCertification,
  StudyTopic,
  StudyLab,
  StudyLabAttempt,
  LabCheckerResult,
  StudyQuestion,
  StudyExamSession,
  StudyExamAnswer,
  StudyFlashcard,
  StudyNote,
  StudyOrganization,
  StudyInterviewBrief,
  StudyMockInterview,
  AvailableApplication,
  StudyLog,
  StudyGoal,
  StudyProgress,
  PublicStudyBadgeData,
} from "@/types/study";

const STUDY_BASE = `${API_BASE_URL}/api/v1/study`;

// ── Certifications & Overview ──────────────────────────────────
export async function getStudyCertifications(): Promise<StudyCertification[]> {
  const res = await authenticatedFetch(`${STUDY_BASE}/certifications/`);
  if (!res.ok) throw new Error("Failed to fetch certifications");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getStudyCertification(idOrCode: number | string): Promise<StudyCertification> {
  const res = await authenticatedFetch(`${STUDY_BASE}/certifications/${idOrCode}/`);
  if (!res.ok) throw new Error("Failed to fetch certification details");
  return res.json();
}

export async function getStudyProgress(certId: number): Promise<StudyProgress> {
  const res = await authenticatedFetch(`${STUDY_BASE}/certifications/${certId}/progress/`);
  if (!res.ok) throw new Error("Failed to fetch study progress");
  return res.json();
}

// ── Topics ─────────────────────────────────────────────────────
export async function getStudyTopics(params?: { cert?: string; domain?: number }): Promise<StudyTopic[]> {
  const query = new URLSearchParams();
  if (params?.cert) query.set("cert", params.cert);
  if (params?.domain) query.set("domain", params.domain.toString());
  
  const res = await authenticatedFetch(`${STUDY_BASE}/topics/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch study topics");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

// ── Labs & Attempts ────────────────────────────────────────────
export async function getStudyLabs(params?: { cert?: string; topic?: number; difficulty?: string }): Promise<StudyLab[]> {
  const query = new URLSearchParams();
  if (params?.cert) query.set("cert", params.cert);
  if (params?.topic) query.set("topic", params.topic.toString());
  if (params?.difficulty) query.set("difficulty", params.difficulty);

  const res = await authenticatedFetch(`${STUDY_BASE}/labs/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch labs");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getStudyLab(id: number): Promise<StudyLab> {
  const res = await authenticatedFetch(`${STUDY_BASE}/labs/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch lab details");
  return res.json();
}

export async function submitLabAttempt(labId: number, data: Partial<StudyLabAttempt>): Promise<StudyLabAttempt> {
  const res = await authenticatedFetch(`${STUDY_BASE}/lab-attempts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lab: labId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to record lab attempt");
  return res.json();
}

export async function updateLabAttempt(attemptId: number, data: Partial<StudyLabAttempt>): Promise<StudyLabAttempt> {
  const res = await authenticatedFetch(`${STUDY_BASE}/lab-attempts/${attemptId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update lab attempt");
  return res.json();
}

export async function checkLabConfig(
  labId: number,
  data: { submitted_config: string; time_spent_seconds?: number }
): Promise<{ attempt: StudyLabAttempt; checker_results: LabCheckerResult }> {
  const res = await authenticatedFetch(`${STUDY_BASE}/labs/${labId}/check_config/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to evaluate configuration");
  return res.json();
}

export async function resetLabAttempt(labId: number): Promise<{ status: string; message: string }> {
  const res = await authenticatedFetch(`${STUDY_BASE}/labs/${labId}/reset_attempt/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset lab attempt");
  return res.json();
}

// ── Questions & Question Banks ─────────────────────────────────
export async function getStudyQuestions(params?: {
  cert?: string;
  topic?: number;
  type?: string;
  difficulty?: string;
  favorites?: boolean;
}): Promise<StudyQuestion[]> {
  const query = new URLSearchParams();
  if (params?.cert) query.set("cert", params.cert);
  if (params?.topic) query.set("topic", params.topic.toString());
  if (params?.type) query.set("type", params.type);
  if (params?.difficulty) query.set("difficulty", params.difficulty);
  if (params?.favorites) query.set("favorites", "true");

  const res = await authenticatedFetch(`${STUDY_BASE}/questions/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch questions");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function toggleFavoriteQuestion(questionId: number): Promise<{ is_favorite: boolean }> {
  const res = await authenticatedFetch(`${STUDY_BASE}/questions/${questionId}/toggle_favorite/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to toggle favorite");
  return res.json();
}

export async function reportQuestion(questionId: number, reason: string): Promise<{ status: string }> {
  const res = await authenticatedFetch(`${STUDY_BASE}/questions/${questionId}/report_issue/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to report question issue");
  return res.json();
}

export async function generateQuestions(topicId: number, count = 10, difficulty = "medium"): Promise<{
  message: string;
  created_count: number;
  questions: StudyQuestion[];
}> {
  const res = await authenticatedFetch(`${STUDY_BASE}/questions/generate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic_id: topicId, count, difficulty }),
  });
  if (!res.ok) throw new Error("Failed to generate questions");
  return res.json();
}

export async function getRetryQueue(certCode?: string): Promise<StudyQuestion[]> {
  const query = certCode ? `?cert=${encodeURIComponent(certCode)}` : "";
  const res = await authenticatedFetch(`${STUDY_BASE}/questions/retry_queue/${query}`);
  if (!res.ok) throw new Error("Failed to fetch retry queue");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

// ── Exam Sessions ──────────────────────────────────────────────
export async function getExamSessions(): Promise<StudyExamSession[]> {
  const res = await authenticatedFetch(`${STUDY_BASE}/exam-sessions/`);
  if (!res.ok) throw new Error("Failed to fetch exam sessions");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getExamSession(id: number): Promise<StudyExamSession> {
  const res = await authenticatedFetch(`${STUDY_BASE}/exam-sessions/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch exam session");
  return res.json();
}

export async function startExamSession(data: {
  certification_code: string;
  mode: "practice" | "timed_mock" | "retry_wrong" | "weak_drill";
  topic_id?: number | null;
  question_count?: number;
}): Promise<{
  session_id: number;
  certification_code: string;
  certification_name: string;
  mode: string;
  topic_name?: string | null;
  total_questions: number;
  duration_minutes: number;
  questions: StudyQuestion[];
  started_at: string;
}> {
  const res = await authenticatedFetch(`${STUDY_BASE}/exam-sessions/start/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to start exam session");
  return res.json();
}

export async function submitExamAnswer(
  sessionId: number,
  data: {
    question_id: number;
    user_answers: string[];
    time_spent_seconds?: number;
    flagged_for_review?: boolean;
  }
): Promise<{
  answer_id: number;
  question_id: number;
  is_correct: boolean;
  user_answers: string[];
  correct_answers: string[];
  explanation: string;
  distractor_notes?: Record<string, string>;
  trigger_words?: string;
  step_by_step_solution?: string;
  reference_doc_url?: string;
}> {
  const res = await authenticatedFetch(`${STUDY_BASE}/exam-sessions/${sessionId}/submit_answer/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit exam answer");
  return res.json();
}

export async function finishExamSession(sessionId: number): Promise<StudyExamSession> {
  const res = await authenticatedFetch(`${STUDY_BASE}/exam-sessions/${sessionId}/finish/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to finish exam session");
  return res.json();
}

export async function getExamReview(sessionId: number): Promise<{
  session: StudyExamSession;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  score_pct: number;
  passed: boolean;
  domain_breakdown: Record<string, { total: number; correct: number; pct: number }>;
  wrong_questions: Array<{
    question_id: number;
    question_text: string;
    scenario_context?: string;
    code_output?: string;
    question_type: string;
    options: Array<{ id: string; text: string }>;
    user_answers: string[];
    correct_answers: string[];
    is_correct: boolean;
    flagged_for_review: boolean;
    time_spent_seconds: number;
    explanation: string;
    distractor_notes?: Record<string, string>;
    trigger_words?: string;
    step_by_step_solution?: string;
    reference_doc_url?: string;
    domain_number: number;
    domain_name: string;
    topic_name: string;
    difficulty: string;
  }>;
  all_questions: Array<any>;
}> {
  const res = await authenticatedFetch(`${STUDY_BASE}/exam-sessions/${sessionId}/review/`);
  if (!res.ok) throw new Error("Failed to fetch exam review");
  return res.json();
}

// ── Flashcards ─────────────────────────────────────────────────
export async function getStudyFlashcards(params?: { cert?: string; topic?: number; due?: boolean }): Promise<StudyFlashcard[]> {
  const query = new URLSearchParams();
  if (params?.cert) query.set("cert", params.cert);
  if (params?.topic) query.set("topic", params.topic.toString());
  if (params?.due) query.set("due", "true");

  const res = await authenticatedFetch(`${STUDY_BASE}/flashcards/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch flashcards");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function createStudyFlashcard(data: Partial<StudyFlashcard>): Promise<StudyFlashcard> {
  const res = await authenticatedFetch(`${STUDY_BASE}/flashcards/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create flashcard");
  return res.json();
}

export async function reviewFlashcard(cardId: number, quality: number): Promise<StudyFlashcard> {
  const res = await authenticatedFetch(`${STUDY_BASE}/flashcards/${cardId}/review/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quality }),
  });
  if (!res.ok) throw new Error("Failed to submit review");
  return res.json();
}

// ── Notes & Mistakes Journal ───────────────────────────────────
export async function getStudyNotes(params?: { topic?: number; mistakes?: boolean }): Promise<StudyNote[]> {
  const query = new URLSearchParams();
  if (params?.topic) query.set("topic", params.topic.toString());
  if (params?.mistakes) query.set("mistakes", "true");

  const res = await authenticatedFetch(`${STUDY_BASE}/notes/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function createStudyNote(data: Partial<StudyNote>): Promise<StudyNote> {
  const res = await authenticatedFetch(`${STUDY_BASE}/notes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create study note");
  return res.json();
}

export async function updateStudyNote(id: number, data: Partial<StudyNote>): Promise<StudyNote> {
  const res = await authenticatedFetch(`${STUDY_BASE}/notes/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update study note");
  return res.json();
}

export async function deleteStudyNote(id: number): Promise<void> {
  const res = await authenticatedFetch(`${STUDY_BASE}/notes/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete study note");
}

// ── Organizations & Interview Prep ─────────────────────────────
export async function getStudyOrganizations(): Promise<StudyOrganization[]> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/`);
  if (!res.ok) throw new Error("Failed to fetch organizations");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function createStudyOrganization(data: Partial<StudyOrganization>): Promise<StudyOrganization> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create organization");
  return res.json();
}

export async function updateStudyOrganization(id: number, data: Partial<StudyOrganization>): Promise<StudyOrganization> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update organization");
  return res.json();
}

export async function deleteStudyOrganization(id: number): Promise<void> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete organization");
}

export async function generateInterviewBrief(
  orgId: number,
  data?: { raw_text?: string }
): Promise<StudyInterviewBrief> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/${orgId}/generate_brief/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw new Error("Failed to generate interview brief");
  return res.json();
}

export async function getAvailableApplications(): Promise<AvailableApplication[]> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/available_applications/`);
  if (!res.ok) throw new Error("Failed to fetch available applications");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function importJobApplication(applicationId: number): Promise<StudyOrganization> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/import_application/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: applicationId }),
  });
  if (!res.ok) throw new Error("Failed to import job application");
  return res.json();
}

// ── Mock Interviews ────────────────────────────────────────────
export async function getMockInterviews(orgId?: number): Promise<StudyMockInterview[]> {
  const query = orgId ? `?organization=${orgId}` : "";
  const res = await authenticatedFetch(`${STUDY_BASE}/mock-interviews/${query}`);
  if (!res.ok) throw new Error("Failed to fetch mock interviews");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getMockInterview(id: number): Promise<StudyMockInterview> {
  const res = await authenticatedFetch(`${STUDY_BASE}/mock-interviews/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch mock interview");
  return res.json();
}

export async function startMockInterview(
  orgId: number,
  data?: { role_title?: string; mode?: string }
): Promise<StudyMockInterview & { interviewer_response?: string }> {
  const res = await authenticatedFetch(`${STUDY_BASE}/organizations/${orgId}/start_mock_interview/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw new Error("Failed to start mock interview");
  return res.json();
}

export async function respondToMockInterview(
  mockId: number,
  data: { candidate_message: string; mode?: string }
): Promise<{
  interviewer_response: string;
  transcript: Array<{ role: "interviewer" | "candidate" | "system"; content: string; timestamp?: string }>;
  turn_count: number;
  is_completed: boolean;
}> {
  const res = await authenticatedFetch(`${STUDY_BASE}/mock-interviews/${mockId}/respond/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit response in mock interview");
  return res.json();
}

export async function finishMockInterview(mockId: number): Promise<StudyMockInterview> {
  const res = await authenticatedFetch(`${STUDY_BASE}/mock-interviews/${mockId}/finish/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to finish mock interview");
  return res.json();
}

// ── Study Logs & Activity ──────────────────────────────────────
export async function getStudyLogs(): Promise<StudyLog[]> {
  const res = await authenticatedFetch(`${STUDY_BASE}/study-logs/`);
  if (!res.ok) throw new Error("Failed to fetch study logs");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function logStudySession(data: {
  certification?: number | null;
  topic?: number | null;
  session_type: "lab" | "quiz" | "exam" | "flashcard" | "reading" | "interview_prep" | "pomodoro";
  duration_minutes: number;
  date?: string;
  notes?: string;
}): Promise<StudyLog> {
  const res = await authenticatedFetch(`${STUDY_BASE}/study-logs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to log study session");
  return res.json();
}

// ── Public Badge Endpoint ──────────────────────────────────────
export async function getPublicStudyBadge(): Promise<PublicStudyBadgeData> {
  const res = await fetch(`${STUDY_BASE}/public-badge/`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch public badge");
  return res.json();
}
