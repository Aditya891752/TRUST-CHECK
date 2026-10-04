import { describe, it, expect } from 'vitest';
import { validateAnswer, validateQuestion } from './validation';

describe('Validation utilities', () => {
  it('validates normal answers correctly', () => {
    expect(validateAnswer('The capital of France is Paris.').valid).toBe(true);
  });

  it('rejects empty or whitespace answers', () => {
    expect(validateAnswer('').valid).toBe(false);
    expect(validateAnswer('   \n  ').valid).toBe(false);
  });

  it('rejects answers over 4000 characters', () => {
    const longText = 'a'.repeat(4001);
    expect(validateAnswer(longText).valid).toBe(false);
  });

  it('validates optional question length', () => {
    expect(validateQuestion('When was Python released?').valid).toBe(true);
    expect(validateQuestion('q'.repeat(501)).valid).toBe(false);
  });
});
