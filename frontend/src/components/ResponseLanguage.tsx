import React from 'react';

export type ResponseLanguageOption = 'auto' | 'en' | 'hi' | 'hinglish';

interface ResponseLanguageProps {
  value: ResponseLanguageOption;
  onChange: (lang: ResponseLanguageOption) => void;
  disabled?: boolean;
}

const OPTIONS: { value: ResponseLanguageOption; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'hinglish', label: 'Hinglish' },
];

export const ResponseLanguage: React.FC<ResponseLanguageProps> = ({ value, onChange, disabled }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
      <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Response language:</span>
      <div
        role="radiogroup"
        aria-label="Response language"
        style={{
          display: 'inline-flex',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-line)',
          padding: '2px',
        }}
      >
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              style={{
                border: 'none',
                background: isSelected ? 'var(--color-surface)' : 'transparent',
                color: isSelected ? 'var(--color-ink)' : 'var(--color-muted)',
                fontWeight: isSelected ? 600 : 400,
                fontSize: '12px',
                padding: '3px 8px',
                borderRadius: 'calc(var(--radius) - 2px)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
