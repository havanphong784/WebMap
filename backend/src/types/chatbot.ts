export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatSessionRecord {
  id: string;
  user_id: string;
  title: string;
  created_at: Date | string;
  updated_at: Date | string;
  last_message?: string | null;
  message_count?: number;
}

export interface ChatMessageRecord {
  id?: number | string;
  session_id: string;
  user_id: string;
  role: ChatMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: Date | string;
  feedback_rating?: number | null;
}

export interface ChatFeedbackRecord {
  id?: number | string;
  user_id: string;
  session_id?: string | null;
  assistant_message_id: number | string;
  rating: number;
  reason?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface SavedTripStop {
  id: number | string;
  name?: string;
  address?: string;
  category?: string;
  lat?: number;
  lng?: number;
  stop_order: number;
}

export interface SavedTripRecord {
  id: string;
  user_id: string;
  session_id?: string | null;
  title: string;
  duration_hours?: number | null;
  budget?: string | number | null;
  preferences?: string[];
  route_geometry?: unknown;
  route_distance_meters?: number | null;
  route_duration_seconds?: number | null;
  route_source?: string | null;
  created_at?: Date | string;
  stops?: SavedTripStop[];
}

export interface AiUsageLogRecord {
  id?: number | string;
  user_id?: string | null;
  session_id?: string | null;
  provider?: string;
  model: string;
  request_type?: string;
  experiment_variant?: string | null;
  prompt_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  duration_ms?: number | null;
  status: 'success' | 'fallback' | 'error' | string;
  error_message?: string | null;
  created_at?: Date | string;
}

export interface ChatbotStreamChunk {
  event: 'chunk' | 'complete' | 'error';
  data: string | Record<string, unknown>;
}

export interface ChatbotStreamSession {
  sessionId: string;
  userId: string;
  chunks: ChatbotStreamChunk[];
}

export interface ChatbotContext {
  weather?: unknown;
  locations?: Array<Record<string, unknown>>;
  userLocation?: { lat: number; lng: number } | Record<string, unknown>;
  history?: Array<{ role: string; content: string }>;
  [key: string]: unknown;
}

export interface ChatbotResponse {
  text: string | null;
  durationMs: number;
  usageMetadata: Record<string, unknown>;
  model: string;
  status: 'success' | 'fallback' | 'error';
  errorMessage?: string;
}

export interface ChatbotProfile {
  preferredTags: Array<{ tag: string; weight: number }>;
  preferredCategories: Array<{ category: string; weight: number }>;
  recentTrips: unknown[];
  recentMessages: string[];
}

export interface ChatbotExperimentMetrics {
  days: number;
  variants: Array<Record<string, unknown>>;
}

export interface ChatRequestBody {
  message: string;
  context?: ChatbotContext;
  sessionId?: string;
}

export interface ChatFeedbackRequestBody {
  sessionId?: string;
  assistantMessageId: number | string;
  rating: number;
  reason?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}
