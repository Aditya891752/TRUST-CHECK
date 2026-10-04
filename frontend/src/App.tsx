import { useState, useEffect } from 'react';
import './styles/tokens.css';
import { checkHealth, checkAnswer } from './lib/api';
import { CheckResponse, ApiError } from './lib/types';
import CheckForm from './components/CheckForm';
import ProgressStatus from './components/ProgressStatus';
import ErrorNotice from './components/ErrorNotice';
import SummaryStrip from './components/SummaryStrip';
import HighlightedAnswer from './components/HighlightedAnswer';
import ClaimCard from './components/ClaimCard';
import { NoticeBanner } from './components/NoticeBanner';

function App() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stage, setStage] = useState<string>('Preparing verification');
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<CheckResponse | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const [lastPayload, setLastPayload] = useState<{ answer: string; question?: string } | null>(null);

  useEffect(() => {
    checkHealth().then((ok) => setApiOnline(ok));
  }, []);

  const handleCheck = async (answer: string, question?: string) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setCurrentAnswer(answer);
    setLastPayload({ answer, question });

    // Stage 1: Extraction
    setStage('Extracting atomic factual claims...');
    setProgress(25);

    const progressTimer1 = setTimeout(() => {
      setStage('Searching for external web evidence...');
      setProgress(55);
    }, 1200);

    const progressTimer2 = setTimeout(() => {
      setStage('Comparing claims against retrieved evidence...');
      setProgress(85);
    }, 2800);

    try {
      const data = await checkAnswer({ answer, question });
      setProgress(100);
      setReport(data);
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr && apiErr.error) {
        setError({
          message: apiErr.error.message || 'Verification could not be completed.',
          requestId: apiErr.error.request_id,
        });
      } else {
        setError({
          message: 'Could not connect to the TrustCheck server. Please ensure the API is running and try again.',
        });
      }
    } finally {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastPayload) {
      handleCheck(lastPayload.answer, lastPayload.question);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)', minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--color-line)',
          paddingBottom: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-ink)',
              letterSpacing: '-0.5px',
            }}
          >
            TrustCheck
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: 'var(--space-1)' }}>
            Transparent AI answer reliability checker
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: apiOnline === true ? 'var(--color-supported-ink)' : apiOnline === false ? 'var(--color-unsupported-ink)' : 'var(--color-muted)',
            }}
            aria-hidden="true"
          />
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
            {apiOnline === true ? 'API live' : apiOnline === false ? 'API offline' : 'checking...'}
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main>
        <section style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>
            Verify AI answers with retrieved evidence
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-muted)', lineHeight: '22px' }}>
            Paste any AI response below. TrustCheck extracts checkable factual claims, retrieves independent evidence,
            and provides grounded verdicts with transparent reasoning.
          </p>
        </section>

        {/* Input Form */}
        <CheckForm onSubmit={handleCheck} isLoading={isLoading} />

        {/* Progress State */}
        {isLoading && <ProgressStatus stage={stage} progressPercent={progress} />}

        {/* Error Notice */}
        {error && <ErrorNotice message={error.message} requestId={error.requestId} onRetry={handleRetry} />}

        {/* Results Report */}
        {report && (
          <section id="verification-report" style={{ marginTop: 'var(--space-8)' }}>
            {/* Injection / System Notices */}
            <NoticeBanner notices={report.notices} />

            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>
              Verification Report
            </h2>

            {/* Summary Strip */}
            <SummaryStrip
              supported={report.summary.supported}
              uncertain={report.summary.uncertain}
              unsupported={report.summary.unsupported}
            />

            {/* Highlighted Answer */}
            {currentAnswer && <HighlightedAnswer originalText={currentAnswer} claims={report.claims} />}

            {/* Claim Cards List */}
            <div style={{ marginTop: 'var(--space-6)' }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Claims & evidence ({report.claims.length})
              </h3>

              {report.claims.length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-6)',
                    color: 'var(--color-muted)',
                    textAlign: 'center',
                  }}
                >
                  No factual claims were found in the provided text.
                </div>
              ) : (
                report.claims.map((claim, idx) => <ClaimCard key={claim.id || idx} claim={claim} index={idx} />)
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'var(--space-16)',
          borderTop: '1px solid var(--color-line)',
          paddingTop: 'var(--space-6)',
          fontSize: '13px',
          color: 'var(--color-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>TrustCheck · Galactic Debuggers · Vibeathon 2026</span>
        <span>Evidence-grounded explainability</span>
      </footer>
    </div>
  );
}

export default App;
