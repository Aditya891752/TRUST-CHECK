export interface CheckRequest {
  answer: string;
  question?: string;
}

export interface Evidence {
  id: string;
  title: string;
  url: string;
  snippet: string;
  retrieved_at: string;
}

export interface Claim {
  id: string;
  text: string;
  span: { start: number; end: number } | null;
  verdict: 'supported' | 'uncertain' | 'unsupported';
  reasoning: string;
  evidence: Evidence[];
}

export interface CheckResponse {
  request_id: string;
  summary: { supported: number; uncertain: number; unsupported: number };
  claims: Claim[];
}

export interface ApiError {
  error: { code: string; message: string; request_id: string };
}
