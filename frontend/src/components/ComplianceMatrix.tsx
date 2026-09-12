'use client';
import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, ShieldAlert,
  Info, ExternalLink, X, ArrowRight, ShieldCheck, Scale, Cpu, UserCheck
} from 'lucide-react';
import { ComplianceCheckResult, AuditResponse } from '../lib/types';


const CATEGORY_ROWS = [
  { id: 'Classification Status', title: '1. Classification & Category Box', desc: 'Layer 1b Cross-Border Mismatch' },
  { id: 'Claim Wording', title: '2. Marketing & Disease Claims', desc: 'Medical / Pesticidal Word Triggers' },
  { id: 'Banned Ingredients', title: '3. Ingredients & Chemical Limits', desc: 'Peroxide, Camphor, Hotlist Caps' },
  { id: 'Mandatory Labeling', title: '4. Mandatory Labeling & Packaging', desc: 'Origin, Responsible Person, French' },
  { id: 'Safety/Certifications', title: '5. Safety & Lab Certifications', desc: 'Tier 3 Escalation (CE, CPC, ASTM)' },
  { id: 'Hazmat/Shipping', title: '6. Hazmat & Dangerous Goods', desc: 'Tier 3 Escalation (UN 38.3 Lithium)' },
];

const MARKET_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  UK: '🇬🇧',
  CA: '🇨🇦',
  JP: '🇯🇵',
  AU: '🇦🇺',
  IN: '🇮🇳',
  DE: '🇩🇪',
  CN: '🇨🇳',
  VN: '🇻🇳',
  SG: '🇸🇬',
};

interface ComplianceMatrixProps {
  auditData?: AuditResponse | null;
  matrix?: Record<string, ComplianceCheckResult[]>;
  destinationMarkets?: string[];
  summaryByCountry?: Record<string, { pass: number; warning: number; violation: number; escalation: number }>;
  selectedCountryFilter?: string | null;
  onSelectFix?: (fixText: string) => void;
}

export default function ComplianceMatrix({
  auditData,
  matrix,
  destinationMarkets,
  summaryByCountry,
  selectedCountryFilter,
  onSelectFix
}: ComplianceMatrixProps) {
  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheckResult | null>(null);

  const activeMatrix = matrix || auditData?.matrix;
  const countries = destinationMarkets || auditData?.destination_markets || [];
  const activeSummary = summaryByCountry || auditData?.summary_by_country || {};
  const overallVerdict = auditData?.overall_verdict || 'COMPLIANCE AUDIT';

  if (!activeMatrix || countries.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Run an inspection audit to populate the simultaneous multi-market compliance matrix.
      </div>
    );
  }

  // Helper to find relevant checks for a (country, category) cell
  const getCellChecks = (country: string, category: string): ComplianceCheckResult[] => {
    const list = activeMatrix[country] || [];
    return list.filter(item => item.category === category);
  };

  // Determine aggregate cell status
  const getCellAggregateStatus = (checks: ComplianceCheckResult[]) => {
    if (checks.some(c => c.status === 'violation')) return 'violation';
    if (checks.some(c => c.status === 'escalation')) return 'escalation';
    if (checks.some(c => c.status === 'warning')) return 'warning';
    return 'pass';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* ── Matrix Header & Overall Verdict Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-sky-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Simultaneous Multi-Market Compliance Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-jurisdiction comparison grid across {countries.length} destination markets. Click any cell to inspect statutory citations.
          </p>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-400">Overall Clearance:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
            overallVerdict === 'COMPLIANT'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : overallVerdict === 'IMPORT_PROHIBITED'
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              : overallVerdict === 'REMEDIATION_REQUIRED'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
          }`}>
            {overallVerdict.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* ── Matrix Grid Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50">
              <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-1/4">
                Regulatory Category
              </th>
              {countries.map(code => {
                const summary = activeSummary[code] || { pass: 0, warning: 0, violation: 0, escalation: 0 };
                const isColSelected = selectedCountryFilter === code;
                return (
                  <th key={code} className={`py-3 px-3 text-center border-l border-slate-800/60 transition-all ${
                    isColSelected ? 'bg-indigo-950/60 ring-2 ring-indigo-500/80 rounded-t-lg' : ''
                  }`}>
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="text-lg">{MARKET_FLAGS[code] || '🌐'}</span>
                      <span className={`text-xs font-black ${isColSelected ? 'text-indigo-300 underline' : 'text-white'}`}>{code}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1 mt-1 text-[10px]">
                      {summary.violation > 0 && (
                        <span className="text-rose-400 font-bold">{summary.violation} fail</span>
                      )}
                      {summary.escalation > 0 && (
                        <span className="text-purple-400 font-bold">{summary.escalation} esc</span>
                      )}
                      {summary.violation === 0 && summary.escalation === 0 && (
                        <span className="text-emerald-400 font-medium">cleared</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {CATEGORY_ROWS.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                
                {/* Category Header Column */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-200">{cat.title}</div>
                  <div className="text-[11px] text-slate-500">{cat.desc}</div>
                </td>

                {/* Country Columns */}
                {countries.map(code => {
                  const checks = getCellChecks(code, cat.id);
                  const status = getCellAggregateStatus(checks);
                  const primaryCheck = checks.find(c => c.status === status) || checks[0];
                  const isColSelected = selectedCountryFilter === code;

                  return (
                    <td key={code} className={`py-3.5 px-3 text-center border-l border-slate-800/60 transition-all ${
                      isColSelected ? 'bg-indigo-950/20 ring-1 ring-indigo-500/30' : ''
                    }`}>
                      {primaryCheck ? (
                        <button
                          type="button"
                          onClick={() => setSelectedCheck(primaryCheck)}
                          className={`w-full py-2 px-2 rounded-xl border transition-all flex flex-col items-center justify-center space-y-1 group ${
                            status === 'violation'
                              ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-900/40 text-rose-300'
                              : status === 'escalation'
                              ? 'bg-purple-950/30 border-purple-500/40 hover:bg-purple-900/40 text-purple-300'
                              : status === 'warning'
                              ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-900/40 text-amber-300'
                              : 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-900/30 text-emerald-300'
                          }`}
                        >
                          {status === 'violation' && <XCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />}
                          {status === 'escalation' && <ShieldAlert className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />}
                          {status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />}
                          {status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />}

                          <span className="text-[10px] font-bold uppercase tracking-tight line-clamp-1">
                            {status === 'escalation' ? 'Escalate' : status}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-600">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Legend Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pass (Compliant)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Warning (Fix Recommended)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Violation (Prohibited / Seizure)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Escalation (Tier 3 Lab/Hazmat Review)</span>
          </div>
        </div>
        <span className="text-slate-500 italic">Strict Grounding Protocol: Zero unsourced assertions</span>
      </div>

      {/* ── Detail Drawer / Modal on Cell Click ── */}
      {selectedCheck && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{MARKET_FLAGS[selectedCheck.country_code] || '🌐'}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {selectedCheck.country_code} · {selectedCheck.category}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedCheck.status === 'violation'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : selectedCheck.status === 'escalation'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                        : selectedCheck.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {selectedCheck.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedCheck.check_code}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedCheck(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statutory Citation (Grounded Truth) */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-sky-400 flex items-center space-x-1">
                  <Scale className="w-3 h-3" />
                  <span>Statutory Citation</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedCheck.trust_tier}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-200">{selectedCheck.rule_citation}</p>
            </div>

            {/* Extracted Finding vs Expected Requirement */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Extracted from Listing Copy:</span>
                <p className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 font-mono">
                  {selectedCheck.extracted_value}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Statutory Legal Requirement:</span>
                <p className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
                  {selectedCheck.expected_requirement}
                </p>
              </div>
            </div>

            {/* Legal Explanation */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-0.5">Regulatory Impact & Rationale:</span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                {selectedCheck.explanation}
              </p>
            </div>

            {/* Fix Suggestion & Action */}
            {selectedCheck.fix_suggestion && (
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/50 space-y-2">
                <span className="text-xs font-bold text-sky-400 block">Recommended Remediation Directive:</span>
                <p className="text-xs text-sky-200">{selectedCheck.fix_suggestion}</p>
              </div>
            )}

            <button
              onClick={() => setSelectedCheck(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
            >
              Close Details
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
