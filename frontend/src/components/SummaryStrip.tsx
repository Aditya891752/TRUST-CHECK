interface SummaryStripProps {
  supported: number;
  uncertain: number;
  unsupported: number;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ supported, uncertain, unsupported }) => {
  const total = supported + uncertain + unsupported;
  if (total === 0) return null;

  const supPercent = (supported / total) * 100;
  const uncPercent = (uncertain / total) * 100;
  const unsPercent = (unsupported / total) * 100;

  return (
    <div
      style={{
        marginTop: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-line)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>
          {total} {total === 1 ? 'claim' : 'claims'}:{' '}
          <span style={{ color: 'var(--color-supported-ink)' }}>{supported} supported</span>,{' '}
          <span style={{ color: 'var(--color-uncertain-ink)' }}>{uncertain} uncertain</span>,{' '}
          <span style={{ color: 'var(--color-unsupported-ink)' }}>{unsupported} unsupported</span>
        </p>
      </div>

      {/* Segmented solid bar beneath */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: 'var(--color-line)',
        }}
        aria-hidden="true"
      >
        {supported > 0 && (
          <div style={{ width: `${supPercent}%`, height: '100%', backgroundColor: 'var(--color-supported-ink)' }} />
        )}
        {uncertain > 0 && (
          <div style={{ width: `${uncPercent}%`, height: '100%', backgroundColor: 'var(--color-uncertain-ink)' }} />
        )}
        {unsupported > 0 && (
          <div style={{ width: `${unsPercent}%`, height: '100%', backgroundColor: 'var(--color-unsupported-ink)' }} />
        )}
      </div>
    </div>
  );
};

export default SummaryStrip;
