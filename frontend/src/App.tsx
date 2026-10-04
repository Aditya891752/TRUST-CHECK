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
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-16">
      {/* Top Navbar */}
      <Navbar apiOnline={apiOnline} latencyMs={184} />

      {/* Main 2-Column Dashboard Workspace */}
      <main className="mx-auto max-w-[1600px] flex flex-col lg:flex-row gap-6 p-4 sm:p-6 items-start">
        {/* Left Column (35%): Input Workspace */}
        <div className="w-full lg:w-[35%] lg:sticky lg:top-20">
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
        </div>

        {/* Right Column (65%): Verification Results & Inspection */}
        <div className="w-full lg:w-[65%] flex flex-col gap-4 sm:gap-5">
          {/* Active Streaming Progress State */}
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

          {/* Active Report View */}
          {report ? (
            <div className="flex flex-col gap-4 sm:gap-5 animate-fadeIn">
              {/* Report Header */}
              <ReportHeader id={report.request_id} language={report.language} />

              {/* Reliability Stats Strip */}
              <SummaryStats claims={report.claims} summary={report.summary} />

              {/* Adversarial Prompt Injection Notice Banner (F5) */}
              <InjectionBanner notices={report.notices} />

              {/* Interactive Highlighted Text */}
              <HighlightedAnswer
                originalText={report.answer_normalized || inputText}
                claims={report.claims}
              />

              {/* Claim Cards List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-navy">
                    Claim inspections ({shownClaims.length} of {report.claims.length} shown)
                  </h3>
                  {report.claims.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAll(!showAll)}
                      className="text-xs sm:text-sm text-emerald-700 font-semibold hover:underline"
                    >
                      {showAll ? 'Show fewer ←' : 'View all claims →'}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {report.claims.length === 0 ? (
                    <div className="card p-6 text-center text-gray-500 bg-white border border-line rounded-xl">
                      No checkable factual claims found in the provided text.
                    </div>
                  ) : (
                    shownClaims.map((claim, idx) => (
                      <ClaimCard key={claim.id || idx} claim={claim} index={idx} />
                    ))
                  )}
                </div>
              </div>

              {/* Factually Corrected Answer Draft (F1) */}
              <CorrectedDraft
                correctedAnswer={report.corrected_answer}
                claims={report.claims}
                answerNormalized={report.answer_normalized || inputText}
              />
            </div>
          ) : (
            !isLoading && (
              /* Welcome Placeholder when no report is active */
              <div className="card p-8 sm:p-12 bg-white border border-line rounded-xl text-center flex flex-col items-center justify-center shadow-xs">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
                  <ShieldCheck size={26} />
                </div>
                <h3 className="text-xl font-bold text-navy">Ready to verify</h3>
                <p className="text-sm text-gray-500 max-w-md mt-2 leading-relaxed">
                  Paste any AI-generated answer or pick a test sample on the left. TrustCheck decomposes answers into factual statements, checks independent web sources, and detects hallucinations.
                </p>
                <button
                  type="button"
                  onClick={handleCheck}
                  className="mt-6 inline-flex items-center gap-2 bg-navy hover:bg-slate-800 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors shadow-xs"
                >
                  <Sparkles size={16} className="text-emerald-400" />
                  <span>Verify pre-loaded Apollo 11 sample</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
