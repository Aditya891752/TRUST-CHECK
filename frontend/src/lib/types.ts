export interface CheckRequest {
  answer: string;
  question?: string;
  response_language?: 'auto' | 'en' | 'hi' | 'hinglish';
}

export interface Evidence {
  id: string;
  title: string;
  url: string;
  snippet: string;
  retrieved_at: string;
  stance?: 'supports' | 'contradicts' | 'neutral' | string;
  quote?: string | null;
}

export interface Flag {
  type: 'date' | 'number' | 'name' | string;
  text: string;
  start: number;
  end: number;
}

export interface Claim {
  id: string;
  text: string;
  span: { start: number; end: number } | null;
  verdict: 'supported' | 'uncertain' | 'unsupported';
  reasoning: string;
  evidence: Evidence[];
  flags?: Flag[];
}

export interface Notice {
  code: string;
  message: string;
  excerpt?: string | null;
}

export interface CheckResponse {
  request_id: string;
  language?: string;
  answer_normalized?: string;
  summary: { supported: number; uncertain: number; unsupported: number };
  claims: Claim[];
  notices?: Notice[];
}

export interface ApiError {
  error: { code: string; message: string; request_id: string };
}
