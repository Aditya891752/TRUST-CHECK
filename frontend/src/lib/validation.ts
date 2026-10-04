export function validateAnswer(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Answer cannot be empty' };
  }
  if (text.length > 4000) {
    return { valid: false, error: 'Answer must be less than 4000 characters' };
  }
  return { valid: true };
}

export function validateQuestion(text: string): { valid: boolean; error?: string } {
  if (text && text.length > 500) {
    return { valid: false, error: 'Question must be less than 500 characters' };
  }
  return { valid: true };
}
