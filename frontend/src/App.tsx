import { useState, useEffect, useRef } from 'react';
import './styles/tokens.css';
import { checkHealth, checkAnswer } from './lib/api';
import { checkStream } from './lib/stream';
import { CheckResponse, ApiError, Claim } from './lib/types';
import CheckForm from './components/CheckForm';
import ProgressStatus from './components/ProgressStatus';
import ErrorNotice from './components/ErrorNotice';
import SummaryStrip from './components/SummaryStrip';
import HighlightedAnswer from './components/HighlightedAnswer';
import ClaimCard from './components/ClaimCard';
import { NoticeBanner } from './components/NoticeBanner';
import CorrectedAnswer from './components/CorrectedAnswer';

import type { ResponseLanguageOption } from './components/ResponseLanguage';

function App() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stage, setStage] = useState<string>('Preparing verification');
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<CheckResponse | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [pendingSelection, setPendingSelection] = useState<string>('');
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const [lastPayload, setLastPayload] = useState<{ answer: string; question?: string; responseLanguage?: ResponseLanguageOption } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkHealth().then((ok) => setApiOnline(ok));

    // Listen for Chrome Extension context menu or storage selection
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['trustcheck_pending_text'], (res: any) => {
        if (res?.trustcheck_pending_text) {
          setPendingSelection(res.trustcheck_pending_text);
          chrome.storage.local.remove(['trustcheck_pending_text']);
        }
      });

      const messageListener = (msg: any) => {
        if (msg?.type === 'TRUSTCHECK_NEW_SELECTION' && msg.text) {
          setPendingSelection(msg.text);
        }
      };

      chrome.runtime?.onMessage?.addListener(messageListener);
      return () => {
        chrome.runtime?.onMessage?.removeListener?.(messageListener);
      };
    }
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStage('Verification cancelled');
  };

  const handleCheck = async (answer: string, question?: string, responseLanguage?: ResponseLanguageOption) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setCurrentAnswer(answer);
    setLastPayload({ answer, question, responseLanguage });

    setStage('Initializing verification stream...');
    setProgress(10);

    let claimsReceived = false;

    try {
      await checkStream(
        {
          answer,
          question,
          response_language: responseLanguage,
        },
        {
          onMeta: (meta) => {
            setStage('Extracting atomic factual claims...');
            setProgress(25);
            setReport((prev) => ({
              request_id: meta.request_id,
              language: meta.language,
              answer_normalized: meta.answer_normalized,
              summary: prev?.summary || { supported: 0, uncertain: 0, unsupported: 0 },
              claims: prev?.claims || [],
              notices: prev?.notices || [],
              corrected_answer: prev?.corrected_answer || null,
            }));
          },
          onNotice: (notice) => {
            setReport((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                notices: [...(prev.notices || []), notice],
              };
            });
          },
          onClaims: (claims) => {
            claimsReceived = true;
            setStage(`Verifying ${claims.length} claims in parallel...`);
            setProgress(35);
            setReport((prev) => ({
              request_id: prev?.request_id || '',
              language: prev?.language,
              answer_normalized: prev?.answer_normalized || answer,
              summary: { supported: 0, uncertain: 0, unsupported: 0 },
              claims,
              notices: prev?.notices || [],
              corrected_answer: null,
            }));
          },
          onClaimResult: (claimResult: Claim) => {
            setReport((prev) => {
              if (!prev) return prev;
              const updatedClaims = prev.claims.map((c) =>
                c.id === claimResult.id ? claimResult : c
              );
              const supported = updatedClaims.filter((c) => c.verdict === 'supported').length;
              const uncertain = updatedClaims.filter((c) => c.verdict === 'uncertain').length;
              const unsupported = updatedClaims.filter((c) => c.verdict === 'unsupported').length;
              const verifiedCount = updatedClaims.filter((c) => Boolean(c.verdict)).length;
              const totalClaims = updatedClaims.length || 1;

              const pct = 35 + Math.round((verifiedCount / totalClaims) * 55);
              setProgress(Math.min(pct, 95));
              setStage(`Verified ${verifiedCount} of ${totalClaims} claims...`);

              return {
                ...prev,
                claims: updatedClaims,
                summary: { supported, uncertain, unsupported },
              };
            });
          },
          onCorrectedAnswer: (corrected) => {
            setReport((prev) => (prev ? { ...prev, corrected_answer: corrected } : prev));
          },
          onDone: (summary) => {
            setProgress(100);
            setStage('Verification complete');
            setReport((prev) => (prev ? { ...prev, summary } : prev));
          },
          onError: (streamErr) => {
            setError({
              message: streamErr.message || 'Verification stream error.',
              requestId: streamErr.request_id,
            });
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }

      // If stream failed before claims were received, fallback to standard non-streaming verification once
      if (!claimsReceived) {
        setStage('Connecting via standard verification...');
        try {
          const fallbackData = await checkAnswer({
            answer,
            question,
            response_language: responseLanguage,
          });
          setProgress(100);
          setReport(fallbackData);
          return;
        } catch (fallbackErr: any) {
          const apiErr = fallbackErr as ApiError;
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
          return;
        }
      }

      const apiErr = err as ApiError;
      if (apiErr && apiErr.error) {
        setError({
          message: apiErr.error.message || 'Stream verification could not be completed.',
          requestId: apiErr.error.request_id,
        });
      } else {
        setError({
          message: err?.message || 'Verification stream interrupted. Please retry.',
        });
      }
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleRetry = () => {
    if (lastPayload) {
      handleCheck(lastPayload.answer, lastPayload.question, lastPayload.responseLanguage);
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
        <CheckForm onSubmit={handleCheck} isLoading={isLoading} initialAnswer={pendingSelection} />

        {/* Progress State */}
        {isLoading && <ProgressStatus stage={stage} progressPercent={progress} onCancel={handleCancel} />}

        {/* Error Notice */}
        {error && <ErrorNotice message={error.message} requestId={error.requestId} onRetry={handleRetry} />}

        {/* Results Report */}
        {report && (
          <section
            id="verification-report"
            lang={report.language === 'hi' ? 'hi' : undefined}
            style={{ marginTop: 'var(--space-8)' }}
          >
            {/* Injection / System Notices */}
            <NoticeBanner notices={report.notices} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Verification Report
              </h2>
              {report.language && (
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--color-line)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  Detected: {report.language === 'hi' ? 'Hindi (हिन्दी)' : report.language === 'hinglish' ? 'Hinglish' : 'English'}
                </span>
              )}
            </div>

            {/* Summary Strip */}
            <SummaryStrip
              supported={report.summary.supported}
              uncertain={report.summary.uncertain}
              unsupported={report.summary.unsupported}
            />

            {/* Highlighted Answer */}
            {currentAnswer && (
              <HighlightedAnswer
                originalText={report.answer_normalized || currentAnswer}
                claims={report.claims}
              />
            )}

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

            {/* Corrected Answer Draft (Feature F1) */}
            <CorrectedAnswer
              correctedAnswer={report.corrected_answer}
              claims={report.claims}
              answerNormalized={report.answer_normalized || currentAnswer}
            />
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
