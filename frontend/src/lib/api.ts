import { CheckRequest, CheckResponse, ApiError } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkAnswer(request: CheckRequest): Promise<CheckResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch {
    const networkErr: ApiError = {
      error: {
        code: 'upstream_unavailable',
        message: 'Could not connect to the TrustCheck server. Please check your connection and try again.',
        request_id: 'client_network_err',
      },
    };
    throw networkErr;
  }

  if (!res.ok) {
    let errData: ApiError;
    try {
      errData = await res.json();
    } catch {
      errData = {
        error: {
          code: res.status === 429 ? 'rate_limited' : 'internal',
          message: res.status === 429 ? 'Too many requests. Please wait a moment.' : 'An error occurred during verification.',
          request_id: 'err_http_' + res.status,
        },
      };
    }
    throw errData;
  }

  return res.json();
}
