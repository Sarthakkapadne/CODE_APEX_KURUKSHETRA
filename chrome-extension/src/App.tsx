import { useState, useEffect } from 'react';
import { Sparkles, Globe, Loader2, ArrowRight, ShieldCheck, AlertTriangle, XCircle, Lock, ExternalLink, Cpu } from 'lucide-react';
import './index.css';

declare const chrome: any;

interface AuditResult {
  overall_verdict: string;
  title: string;
  destination_markets: string[];
  compliance_hash?: string;
  matrix?: Record<string, any[]>;
  customs_radar?: {
    threat_level: string;
    seizure_probability_pct: number;
    estimated_financial_exposure_usd: number;
  };
  hs_tariff?: {
    reclassified_hs_code: string;
    reclassified_duty_rate: string;
  };
  remediation?: {
    compliant_title: string;
    diff_items: Array<{ original_phrase: string; compliant_phrase: string; reason: string }>;
  };
}

const getApiBase = () => {
  try {
    return localStorage.getItem('lexport_api_base') || 'http://127.0.0.1:8000';
  } catch {
    return 'http://127.0.0.1:8000';
  }
};
const API_BASE = getApiBase();

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [activeTabUrl, setActiveTabUrl] = useState('');
  const [extractedTitle, setExtractedTitle] = useState('Product Listing');
  const [extractedDesc, setExtractedDesc] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['US', 'EU', 'UK']);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geminiRequested, setGeminiRequested] = useState(false);

  // Extract from active tab DOM if inside Chrome Extension
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs && tabs[0]) {
          const tab = tabs[0];
          setActiveTabUrl(tab.url || '');
          if (tab.title) setExtractedTitle(tab.title);

          if (tab.id && chrome.scripting) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                func: () => {
                  const h1 = (document.querySelector('h1') as HTMLElement)?.innerText;
                  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
                  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
                  return {
                    title: h1 || document.title,
                    description: metaDesc || ogDesc || (document.body as HTMLElement).innerText.slice(0, 500),
                  };
                },
              },
              (results: any[]) => {
                if (results && results[0] && results[0].result) {
                  const data = results[0].result;
                  if (data.title) setExtractedTitle(data.title);
                  if (data.description) setExtractedDesc(data.description);
                }
              }
            );
          }
        }
      });
    }
  }, []);

  const handleAudit = async (enableGemini: boolean) => {
    setIsScanning(true);
    setError(null);
    setGeminiRequested(enableGemini);

    try {
      // If title is empty, fallback to demo preset
      const titleToUse = extractedTitle && extractedTitle !== 'Product Listing'
        ? extractedTitle
        : 'Ayurvedic Healing Turmeric Skin Cream';
      const descToUse = extractedDesc || 'Natural herbal healing formula curing eczema, psoriasis and arthritis inflammation.';

      const payload = {
        title: titleToUse,
        description: descToUse,
        brand_name: 'LexPort Verified Seller',
        price: 34.99,
        currency: 'USD',
        country_of_origin: 'India',
        destination_markets: selectedMarkets,
        source_url: activeTabUrl || undefined,
        enable_gemini: enableGemini, // Explicit user gating
      };

      const res = await fetch(`${API_BASE}/compliance/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Backend returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({
        overall_verdict: data.overall_verdict,
        title: titleToUse,
        destination_markets: data.destination_markets || selectedMarkets,
        compliance_hash: data.compliance_hash,
        matrix: data.matrix,
        customs_radar: data.customs_radar,
        hs_tariff: data.hs_tariff,
        remediation: data.remediation,
      });
    } catch (err: any) {
      console.error('Audit failed:', err);
      setError(err.message || 'Connection failed. Is LexPort backend running on port 8000?');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleMarket = (code: string) => {
    if (selectedMarkets.includes(code)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter(m => m !== code));
      }
    } else {
      setSelectedMarkets([...selectedMarkets, code]);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Compliant
          </span>
        );
      case 'REMEDIATION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Remediation Required
          </span>
        );
      case 'IMPORT_PROHIBITED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Import Prohibited
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> {verdict}
          </span>
        );
    }
  };

  return (
    <div className="w-[410px] min-h-[560px] bg-slate-50 text-slate-800 font-sans flex flex-col p-4 border border-slate-200 shadow-2xl relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-30px] right-[-20px] w-48 h-48 bg-primary-200/40 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="absolute bottom-[-30px] left-[-20px] w-32 h-32 bg-indigo-200/40 rounded-full blur-2xl z-0 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-blue">
            <Globe className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900">LexPort Co-Pilot</h1>
            <p className="text-[10px] text-slate-500 font-medium">3-Tier Cross-Border Auditor</p>
          </div>
        </div>

        <a
          href="http://localhost:3000/audit/new"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100"
        >
          <span>Studio</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {error && (
        <div className="relative z-10 mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" /> Error Connecting to Backend
          </p>
          <p className="text-[11px] text-rose-600">{error}</p>
        </div>
      )}

      {!result ? (
        <div className="relative z-10 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Product</span>
                <span className="text-[10px] font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">Active DOM</span>
              </div>
              <p className="text-xs font-bold text-slate-800 line-clamp-2">{extractedTitle}</p>
              {activeTabUrl && (
                <p className="text-[10px] text-slate-400 truncate font-mono">{activeTabUrl}</p>
              )}
            </div>

            {/* Market Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Export Markets</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { code: 'US', label: '🇺🇸 US' },
                  { code: 'EU', label: '🇪🇺 EU' },
                  { code: 'UK', label: '🇬🇧 UK' },
                  { code: 'CA', label: '🇨🇦 CA' },
                  { code: 'JP', label: '🇯🇵 JP' },
                ].map(m => (
                  <button
                    key={m.code}
                    onClick={() => toggleMarket(m.code)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      selectedMarkets.includes(m.code)
                        ? 'bg-primary-600 border-primary-600 text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            {/* Primary: Gemini AI Deep Audit */}
            <button
              onClick={() => handleAudit(true)}
              disabled={isScanning}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-blue flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isScanning && geminiRequested ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Running Gemini 3.5 Flash Reasoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run Gemini AI Compliance Audit</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </>
              )}
            </button>

            {/* Secondary: Instant Offline Rule Evaluation */}
            <button
              onClick={() => handleAudit(false)}
              disabled={isScanning}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isScanning && !geminiRequested ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span>Checking Local Rules...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fast Deterministic Mode (Offline)</span>
                  <Cpu className="w-3 h-3 text-slate-400 ml-auto" />
                </>
              )}
            </button>
            <p className="text-[9px] text-center text-slate-400">
              Powered by Google Gemini 3.5 Flash & 6-Category Statutory Engine
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col justify-between space-y-3 animate-fade-in overflow-y-auto">
          <div className="space-y-3">
            {/* Verdict Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                {getVerdictBadge(result.overall_verdict)}
                {result.compliance_hash && (
                  <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    {result.compliance_hash.slice(0, 8)}
                  </span>
                )}
              </div>
              <p className="text-xs font-black text-slate-800 leading-tight">{result.title}</p>
              <div className="flex items-center gap-1 flex-wrap pt-1">
                {result.destination_markets.map(m => (
                  <span key={m} className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Customs Radar Quick Metric */}
            {result.customs_radar && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Customs Seizure Threat</span>
                  <span className="font-black text-amber-900">{result.customs_radar.threat_level}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Exposure</span>
                  <span className="font-mono font-bold text-slate-800">
                    ${result.customs_radar.estimated_financial_exposure_usd.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Compliant Rewrite Copy */}
            {result.remediation && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Compliant Rewrite</span>
                <p className="text-[11px] font-semibold text-emerald-900">{result.remediation.compliant_title}</p>
                {result.remediation.diff_items.length > 0 && (
                  <p className="text-[10px] text-emerald-700 pt-0.5">
                    Substituted: <span className="line-through">{result.remediation.diff_items[0].original_phrase}</span> → <b>{result.remediation.diff_items[0].compliant_phrase}</b>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <a
              href="http://localhost:3000/audit/new"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-blue flex items-center justify-center gap-1.5 transition-all"
            >
              <span>View Full Dossier in Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setResult(null)}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Scan Another Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
