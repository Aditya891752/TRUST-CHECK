import { CheckRequest, CheckResponse, ApiError } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function checkAnswer(request: CheckRequest): Promise<CheckResponse> {
  const res = await fetch(`${API_BASE}/api/v1/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    let errData: ApiError;
    try {
      errData = await res.json();
    } catch {
      throw new Error('An unknown error occurred');
    }
    throw errData;
  }

  return res.json();
}
