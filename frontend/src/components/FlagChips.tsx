import type { FC } from 'react';
import { Flag } from '../lib/types';

interface FlagChipsProps {
  flags?: Flag[];
}

export const FlagChips: FC<FlagChipsProps> = ({ flags }) => {
  if (!flags || flags.length === 0) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-2)',
        marginBottom: 'var(--space-3)',
      }}
      aria-label="Flagged terms"
    >
      {flags.map((flag, idx) => (
        <span
          key={`flag-${flag.start}-${idx}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-line)',
            borderRadius: '4px',
            padding: '2px var(--space-2)',
            fontSize: '12px',
            color: 'var(--color-ink)',
            fontFamily: flag.type === 'number' || flag.type === 'date' ? 'var(--font-mono)' : 'inherit',
          }}
        >
          <span style={{ color: 'var(--color-muted)', fontWeight: 600 }}>{capitalize(flag.type)}:</span>
          <span>{flag.text}</span>
        </span>
      ))}
    </div>
  );
};

export default FlagChips;
