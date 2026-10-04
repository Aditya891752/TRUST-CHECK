import { describe, it, expect } from 'vitest';
import { parseSSEStream } from './stream';

describe('SSE Stream Parser', () => {
  it('parses complete events in a single chunk', () => {
    const chunk = 'event: meta\ndata: {"request_id": "r1", "language": "en"}\n\n';
    const events: { event: string; data: any }[] = [];
    const remainder = parseSSEStream(chunk, '', (event, data) => events.push({ event, data }));

    expect(remainder).toBe('');
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('meta');
    expect(events[0].data.request_id).toBe('r1');
  });

  it('handles events split across multiple chunks (mid-word and mid-json)', () => {
    const chunk1 = 'event: claim_result\ndata: {"id": "c1", "te';
    const chunk2 = 'xt": "Python released in 1991", "verdict": "supported"}\n\n';

    const events: { event: string; data: any }[] = [];
    let buffer = '';

    buffer = parseSSEStream(chunk1, buffer, (event, data) => events.push({ event, data }));
    expect(events).toHaveLength(0);
    expect(buffer.length).toBeGreaterThan(0);

    buffer = parseSSEStream(chunk2, buffer, (event, data) => events.push({ event, data }));
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('claim_result');
    expect(events[0].data.id).toBe('c1');
    expect(events[0].data.verdict).toBe('supported');
    expect(buffer).toBe('');
  });

  it('ignores ping comments and parses multiple events in one chunk', () => {
    const chunk = ': ping\n\nevent: notice\ndata: {"code": "test"}\n\n: ping\n\nevent: done\ndata: {"summary": {"supported": 1}}\n\n';
    const events: { event: string; data: any }[] = [];
    parseSSEStream(chunk, '', (event, data) => events.push({ event, data }));

    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('notice');
    expect(events[1].event).toBe('done');
  });
});
