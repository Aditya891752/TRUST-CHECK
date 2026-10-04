import type { CheckRequest, Claim, Notice, CorrectedAnswer } from './types';

export interface StreamHandlers {
  onMeta?: (meta: { request_id: string; language: string; answer_normalized: string }) => void;
  onNotice?: (notice: Notice) => void;
  onClaims?: (claims: Claim[]) => void;
  onClaimResult?: (claim: Claim) => void;
  onCorrectedAnswer?: (correctedAnswer: CorrectedAnswer | null) => void;
  onDone?: (summary: { supported: number; uncertain: number; unsupported: number }) => void;
  onError?: (error: { code: string; message: string; request_id?: string }) => void;
}

/**
 * Pure SSE stream chunk parser. Handles:
 * - Events split across arbitrary byte chunk boundaries
 * - Multiple events in a single chunk
 * - Comment lines starting with ':' (e.g. ': ping')
 * Returns remaining unparsed buffer for the next chunk.
 */
export function parseSSEStream(
  chunk: string,
  buffer: string,
  onEvent: (event: string, data: any) => void
): string {
  let combined = buffer + chunk;

  while (true) {
    const delimiterIndex = combined.indexOf('\n\n');
    const crlfDelimiterIndex = combined.indexOf('\r\n\r\n');

    let boundary = -1;
    let delimiterLen = 2;
    if (delimiterIndex !== -1 && (crlfDelimiterIndex === -1 || delimiterIndex < crlfDelimiterIndex)) {
      boundary = delimiterIndex;
      delimiterLen = 2;
    } else if (crlfDelimiterIndex !== -1) {
      boundary = crlfDelimiterIndex;
      delimiterLen = 4;
    }

    if (boundary === -1) {
      break;
    }

    const eventBlock = combined.slice(0, boundary);
    combined = combined.slice(boundary + delimiterLen);

    const lines = eventBlock.split(/\r?\n/);
    let eventName = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith(':')) {
        continue;
      }
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length > 0) {
      try {
        const parsed = JSON.parse(dataLines.join('\n'));
        onEvent(eventName, parsed);
      } catch {
        // Ignore invalid JSON payload
      }
    }
  }

  return combined;
}

export async function checkStream(
  request: CheckRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const rawUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const baseUrl = rawUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/check/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let errData: any;
    try {
      errData = await response.json();
    } catch {
      // Non-JSON response
    }
    const message = errData?.error?.message || errData?.detail || `Server error (${response.status})`;
    const code = errData?.error?.code || 'stream_error';
    const requestId = errData?.error?.request_id;
    throw { error: { code, message, request_id: requestId } };
  }

  if (!response.body) {
    throw new Error('Response body stream is not available');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let terminalReceived = false;

  const handleEvent = (event: string, data: any) => {
    switch (event) {
      case 'meta':
        handlers.onMeta?.(data);
        break;
      case 'notice':
        handlers.onNotice?.(data);
        break;
      case 'claims':
        handlers.onClaims?.(data.claims || []);
        break;
      case 'claim_result':
        handlers.onClaimResult?.(data);
        break;
      case 'corrected_answer':
        handlers.onCorrectedAnswer?.(data);
        break;
      case 'done':
        terminalReceived = true;
        handlers.onDone?.(data.summary);
        break;
      case 'error':
        terminalReceived = true;
        handlers.onError?.(data.error);
        break;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer = parseSSEStream(chunk, buffer, handleEvent);
    }

    if (buffer.trim()) {
      parseSSEStream('\n\n', buffer, handleEvent);
    }

    if (!terminalReceived && !signal?.aborted) {
      throw new Error('Stream closed unexpectedly before completion.');
    }
  } finally {
    reader.releaseLock();
  }
}
