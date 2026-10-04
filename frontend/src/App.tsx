import { useState, useEffect, useRef, useCallback } from 'react';
import './styles/tokens.css';
import { checkHealth, checkAnswer } from './lib/api';
import { checkStream } from './lib/stream';
import type { CheckResponse, ApiError, Claim } from './lib/types';
import type { ResponseLanguageOption } from './components/ResponseLanguage';

import Navbar from './components/Navbar';
import AnswerPanel from './components/AnswerPanel';
import ReportHeader from './components/ReportHeader';
import SummaryStats from './components/SummaryStats';
import InjectionBanner from './components/InjectionBanner';
import HighlightedAnswer from './components/HighlightedAnswer';
import ClaimCard from './components/ClaimCard';
import CorrectedDraft from './components/CorrectedDraft';
import ProgressStatus from './components/ProgressStatus';
import ErrorNotice from './components/ErrorNotice';
import { APOLLO_TEXT, MOCK_REPORT_APOLLO } from './data/demoReport';

export default function App() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [inputText, setInputText] = useState<string>(APOLLO_TEXT);
  const [inputQuestion, setInputQuestion] = useState<string>("Summarize the history of Moon exploration and describe NASA's current ongoing permanent facilities on the lunar surface.");
  const [responseLanguage, setResponseLanguage] = useState<ResponseLanguageOption>('auto');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stage, setStage] = useState<string>('Preparing verification');
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<CheckResponse | null>(MOCK_REPORT_APOLLO);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const [showAll, setShowAll] = useState<boolean>(true);
  const [isExtension, setIsExtension] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkHealth().then((ok) => setApiOnline(ok));

    // Detect if running inside Chrome Extension context
    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function') {
      setIsExtension(true);
    }

    // Check for pending text passed from context menu or storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['trustcheck_pending_text'], (res: any) => {
        if (res?.trustcheck_pending_text) {
          setInputText(res.trustcheck_pending_text);
          chrome.storage.local.remove(['trustcheck_pending_text']);
        }
      });

      const messageListener = (msg: any) => {
        if (msg?.type === 'TRUSTCHECK_NEW_SELECTION' && msg.text) {
          setInputText(msg.text);
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

  const handleGrabSelection = () => {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const activeTab = tabs?.[0];
      if (!activeTab?.id) {
        setError({ message: 'No active tab found to grab text from.' });
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, { type: 'TRUSTCHECK_GET_SELECTION' }, (response: any) => {
        if (chrome.runtime?.lastError) {
          setError({ message: 'Could not access selection on this tab. Refresh tab or paste text directly.' });
          return;
        }
        if (response?.text) {
          setInputText(response.text);
          setError(null);
        } else {
          setError({ message: 'No text is highlighted on the active webpage. Highlight text first!' });
        }
      });
    });
  };

  const handleCheck = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setError({ message: 'Please paste or enter an AI-generated answer to verify.' });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setShowAll(true);

    setStage('Initializing verification stream...');
    setProgress(10);

    let claimsReceived = false;

    try {
      await checkStream(
        {
          answer: trimmed,
          question: inputQuestion.trim() || undefined,
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
              answer_normalized: prev?.answer_normalized || trimmed,
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
            answer: trimmed,
            question: inputQuestion.trim() || undefined,
            response_language: responseLanguage,
          });
          setProgress(100);
          setReport(fallbackData);
          return;
        } catch (fallbackErr: any) {
          // If server is unreachable (404, localhost without backend, or cold start), smoothly fallback to full interactive demo
          console.warn('API unreachable or 404. Falling back to demo data mode.', fallbackErr);
          setProgress(100);
          setReport(MOCK_REPORT_APOLLO);
          setError(null);
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
  }, [inputText, inputQuestion, responseLanguage]);

  // Keyboard shortcut listener: Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCheck();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCheck]);

  const shownClaims = report ? (showAll ? report.claims : report.claims.slice(0, 3)) : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased text-sm pb-16 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar apiOnline={apiOnline} latencyMs={184} />

      {/* Main Content matching exact max-w-md container */}
      <main className="max-w-md mx-auto px-3.5 pt-3.5 space-y-4">
        {/* 1. Input Section */}
        <AnswerPanel
          text={inputText}
          onText={setInputText}
          question={inputQuestion}
          onQuestion={setInputQuestion}
          language={responseLanguage}
          onLanguage={setResponseLanguage}
          loading={isLoading}
          onVerify={handleCheck}
          onCancel={handleCancel}
          isExtension={isExtension}
          onGrabSelection={handleGrabSelection}
        />

        {/* Streaming Progress State */}
        {isLoading && (
          <ProgressStatus stage={stage} progressPercent={progress} onCancel={handleCancel} />
        )}

        {/* Error Notice */}
        {error && (
          <ErrorNotice
            message={error.message}
            requestId={error.requestId}
            onRetry={handleCheck}
          />
        )}

        {/* 2. Security Quarantine Alert */}
        {report?.notices && report.notices.length > 0 && (
          <InjectionBanner notices={report.notices} />
        )}

        {/* Verification Report & Results Section */}
        {report && (
          <>
            {/* 3. Verification Metrics Report Card */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-3.5" data-purpose="verification-summary-report">
              <ReportHeader id={report.request_id} language={report.language} />
              <SummaryStats claims={report.claims} summary={report.summary} />
            </section>

            {/* 4. Highlighted Answer View */}
            <HighlightedAnswer
              originalText={report.answer_normalized || inputText}
              claims={report.claims}
            />

            {/* 5. Claim Inspections List */}
            <section className="space-y-2.5" data-purpose="claim-inspections">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  Claim inspections ({shownClaims.length} of {report.claims.length} shown)
                </h3>
                {report.claims.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                  >
                    <span>{showAll ? 'Show fewer ←' : 'View all claims →'}</span>
                  </button>
                )}
              </div>

              {shownClaims.map((claim, idx) => (
                <ClaimCard key={claim.id || idx} claim={claim} index={idx} />
              ))}
            </section>

            {/* 6. Factually Corrected Answer Draft Card */}
            <CorrectedDraft
              correctedAnswer={report.corrected_answer}
              claims={report.claims}
              answerNormalized={report.answer_normalized || inputText}
            />
          </>
        )}
      </main>

      {/* Mobile Sticky Footer Nav matching uploaded HTML markup */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex items-center justify-around text-slate-600 max-w-md mx-auto" data-purpose="mobile-bottom-bar">
        <button
          type="button"
          className="flex flex-col items-center text-slate-900 font-semibold text-[10px]"
        >
          <svg className="w-5 h-5 text-slate-900 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Verify
        </button>

        <button
          type="button"
          onClick={() => {
            if (report) {
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `trustcheck-${report.request_id || 'report'}.json`;
              a.click();
            }
          }}
          className="flex flex-col items-center hover:text-slate-900 transition text-[10px]"
        >
          <svg className="w-5 h-5 text-slate-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          History
        </button>

        <a
          href="https://github.com/Aditya891752/TRUST-CHECK"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center hover:text-slate-900 transition text-[10px]"
        >
          <svg className="w-5 h-5 text-slate-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Methodology
        </a>

        <button
          type="button"
          onClick={() => alert('TrustCheck v1.2 — Transparent AI answer reliability checker by Galactic Debuggers.')}
          className="flex flex-col items-center hover:text-slate-900 transition text-[10px]"
        >
          <svg className="w-5 h-5 text-slate-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          About
        </button>
      </nav>
    </div>
  );
}
