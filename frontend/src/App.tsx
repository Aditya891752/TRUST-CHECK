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
import { APOLLO } from './data/mock';

export default function App() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [inputText, setInputText] = useState<string>(APOLLO);
  const [inputQuestion, setInputQuestion] = useState<string>('Tell me about the Apollo 11 lunar mission.');
  const [responseLanguage, setResponseLanguage] = useState<ResponseLanguageOption>('auto');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stage, setStage] = useState<string>('Preparing verification');
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<CheckResponse | null>(null);
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-24">
      {/* Top Navbar */}
      <Navbar apiOnline={apiOnline} latencyMs={184} />

      {/* Main Single-Column Clean Feed Layout matching screenshot */}
      <main className="max-w-[700px] mx-auto px-4 py-4 flex flex-col gap-4">
        {/* 1. Answer to verify card */}
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

        {/* 2. Adversarial Injection Notice (Quarantined) */}
        {report?.notices && report.notices.length > 0 && (
          <InjectionBanner notices={report.notices} />
        )}

        {/* Verification Report & Results Section */}
        {report && (
          <>
            {/* 3. Verification Report Header Card */}
            <ReportHeader id={report.request_id} language={report.language} />

            {/* 4. 4-Box Stats Strip & Progress Bar Card */}
            <SummaryStats claims={report.claims} summary={report.summary} />

            {/* 5. Highlighted Answer Card */}
            <HighlightedAnswer
              originalText={report.answer_normalized || inputText}
              claims={report.claims}
            />

            {/* 6. Claim Inspections List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  Claim inspections ({shownClaims.length} of {report.claims.length} shown)
                </h3>
                {report.claims.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    {showAll ? 'Show fewer ←' : 'View all claims →'}
                  </button>
                )}
              </div>

              {shownClaims.map((claim, idx) => (
                <ClaimCard key={claim.id || idx} claim={claim} index={idx} />
              ))}
            </div>

            {/* 7. Factually Corrected Answer Draft Card */}
            <CorrectedDraft
              correctedAnswer={report.corrected_answer}
              claims={report.claims}
              answerNormalized={report.answer_normalized || inputText}
            />
          </>
        )}
      </main>

      {/* Bottom Sticky Navigation Bar matching screenshot */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-2.5 px-6 z-40">
        <div className="max-w-[500px] mx-auto flex items-center justify-around text-slate-500">
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-slate-900 font-semibold"
          >
            <div className="h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <span className="text-[10px] font-bold">✓</span>
            </div>
            <span className="text-[10px] tracking-tight">Verify</span>
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
            className="flex flex-col items-center gap-1 hover:text-slate-800 transition-colors"
          >
            <span className="text-base">🕒</span>
            <span className="text-[10px] tracking-tight">History</span>
          </button>

          <a
            href="https://github.com/Aditya891752/TRUST-CHECK"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 hover:text-slate-800 transition-colors"
          >
            <span className="text-base">📋</span>
            <span className="text-[10px] tracking-tight">Methodology</span>
          </a>

          <button
            type="button"
            onClick={() => alert('TrustCheck v1.2 — Transparent AI answer reliability checker by Galactic Debuggers.')}
            className="flex flex-col items-center gap-1 hover:text-slate-800 transition-colors"
          >
            <span className="text-base">ℹ️</span>
            <span className="text-[10px] tracking-tight">About</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
