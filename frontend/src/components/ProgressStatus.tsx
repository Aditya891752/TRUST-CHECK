interface ProgressStatusProps {
  stage: string; // e.g. "Extracting claims", "Searching for evidence", "Verifying claims"
  progressPercent: number; // 0 to 100
}

export const ProgressStatus: React.FC<ProgressStatusProps> = ({ stage, progressPercent }) => {
  return (
    <div
      style={{
        marginTop: 'var(--space-6)',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-line)',
      }}
      aria-live="polite"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{stage}</span>
        <span style={{ fontSize: '14px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          {progressPercent}%
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--color-bg)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: 'var(--color-primary)',
            transition: 'width 200ms ease',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressStatus;
