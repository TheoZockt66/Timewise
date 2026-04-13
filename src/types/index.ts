// ─── Kern-Entitäten (bilden die DB-Tabellen 1:1 ab) ───

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Keyword {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  label?: string;
  description?: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface EventKeyword {
  event_id: string;
  keyword_id: string;
}

export interface Goal {
  id: string;
  user_id: string;
  label?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  target_study_time?: string | null;
  created_at: string;
}

export interface GoalKeyword {
  goal_id: string;
  keyword_id: string;
}

// ─── Auth Types ───

// Antwort-Typ für Login und Registrierung
export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number; // Unix-Timestamp in Sekunden
  };
}

// Eingabe-Typ für Login und Registrierung
export interface AuthCredentials {
  email: string;
  password: string;
}

// ─── API Types (erweiterte Antworten mit berechneten Feldern) ───

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface EventWithKeywords extends Event {
  keywords: Keyword[];
  duration_minutes: number;
}

export interface GoalWithProgress extends Goal {
  keywords: Keyword[];
  logged_minutes: number;
  target_minutes: number;
  percentage: number;
  is_achieved: boolean;
  remaining_minutes: number;
  days_remaining: number;
}

export interface AggregatedTime {
  period: string;
  total_minutes: number;
  by_keyword: {
    keyword_id: string;
    keyword_label: string;
    keyword_color: string;
    minutes: number;
  }[];
}
