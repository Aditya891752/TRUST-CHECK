import { useState } from 'react';
import { Evidence } from '../lib/types';

interface EvidenceListProps {
  evidence: Evidence[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidence }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!evidence || evidence.length === 0) {
    return (
      <div style={{ marginTop: 'var(--space-3)', fontSize: '13px', color: 'var(--color-muted)' }}>
        No external evidence citations found.
      </div>
    );
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--color-line)', paddingTop: 'var(--space-3)' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
        }}
        aria-expanded={isOpen}
      >
        <span>{isOpen ? '▼ Hide evidence' : `▶ View evidence (${evidence.length} ${evidence.length === 1 ? 'source' : 'sources'})`}</span>
      </button>

      {isOpen && (
        <ul style={{ listStyle: 'none', marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {evidence.map((item, idx) => (
            <li
              key={item.id || idx}
              style={{
                backgroundColor: 'var(--color-bg)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{item.title || 'Source reference'}</span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--color-primary)',
                      textDecoration: 'underline',
                      wordBreak: 'break-all',
                    }}
                  >
                    {getDomain(item.url)} ↗
                  </a>
                )}
              </div>
              {item.snippet && (
                <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-muted)', lineHeight: '18px' }}>
                  "{item.snippet}"
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EvidenceList;
