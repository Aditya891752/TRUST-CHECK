interface ErrorNoticeProps {
  message: string;
  requestId?: string;
  onRetry?: () => void;
}

export const ErrorNotice: React.FC<ErrorNoticeProps> = ({ message, requestId, onRetry }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-unsupported-bg)',
        border: '1px solid var(--color-line)',
        borderRadius: 'var(--radius)',
        padding: 'var(--space-4)',
        marginTop: 'var(--space-4)',
        color: 'var(--color-unsupported-ink)',
      }}
      role="alert"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: '15px' }}>{message}</p>
          {requestId && (
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>
              Request ID: {requestId}
            </p>
          )}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-2) var(--space-4)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorNotice;
