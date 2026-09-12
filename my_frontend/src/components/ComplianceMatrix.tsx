'use client';

import React, { useState } from 'react';
import { ComplianceCheckResult } from '../lib/types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, X, ChevronRight, Scale, Info } from 'lucide-react';

interface ComplianceMatrixProps {
  matrix: Record<string, ComplianceCheckResult[]>;
  destinationMarkets: string[];
  summaryByCountry: Record<string, { total?: number; pass: number; warning: number; violation: number; escalation: number }>;
  activeFilter?: string;
  onFilterChange?: (country: string) => void;
}

const CATEGORIES = [
  { id: 'Classification Status', label: 'Classification & Category', desc: 'Cross-border mismatch detection' },
  { id: 'Claim Wording', label: 'Marketing & Claims', desc: 'Medical / pesticidal word triggers' },
  { id: 'Banned Ingredients', label: 'Ingredients & Chemical Limits', desc: 'Restricted substances & caps' },
  { id: 'Mandatory Labeling', label: 'Mandatory Labeling', desc: 'Origin, responsible person, bilingual' },
  { id: 'Safety/Certifications', label: 'Safety & Certifications', desc: 'CE, CPC, ASTM requirements' },
  { id: 'Hazmat/Shipping', label: 'Hazmat & Shipping', desc: 'UN 38.3 lithium, dangerous goods' },
];

const FLAGS: Record<string, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵' };

export default function ComplianceMatrix({
  matrix,
  destinationMarkets,
  summaryByCountry,
  activeFilter = 'ALL',
  onFilterChange,
}: ComplianceMatrixProps) {
  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheckResult | null>(null);

  const displayedCountries = activeFilter === 'ALL' 
    ? destinationMarkets 
    : destinationMarkets.filter(c => c === activeFilter);

  const getCellChecks = (country: string, category: string) => {
    return (matrix[country] || []).filter(item => item.category === category);
  };

  const getCellStatus = (checks: ComplianceCheckResult[]) => {
    if (checks.some(c => c.status === 'violation')) return 'violation';
    if (checks.some(c => c.status === 'escalation')) return 'escalation';
    if (checks.some(c => c.status === 'warning')) return 'warning';
    if (checks.length === 0) return 'none';
    return 'pass';
  };

  const statusColors = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
      case 'violation': return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'escalation': return 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100';
      default: return 'bg-slate-50 border-slate-200 text-slate-400';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'violation': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'escalation': return <ShieldAlert className="w-4 h-4 text-indigo-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Country Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 mr-1">Filter:</span>
        <button
          onClick={() => onFilterChange && onFilterChange('ALL')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
            activeFilter === 'ALL' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
          }`}
        >
          All Markets ({destinationMarkets.length})
        </button>
        {destinationMarkets.map(code => (
          <button
            key={code}
            onClick={() => onFilterChange && onFilterChange(code)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              activeFilter === code ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            <span>{FLAGS[code] || '🌐'}</span>
            <span>{code}</span>
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto matrix-container bg-white rounded-2xl border border-slate-100 shadow-card">
        <table className="w-full text-sm border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="py-3.5 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">Category</th>
              {displayedCountries.map(code => {
                const s = summaryByCountry[code] || { pass: 0, warning: 0, violation: 0, escalation: 0 };
                return (
                  <th key={code} className="py-3.5 px-3 text-center border-l border-slate-100">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xl">{FLAGS[code] || '🌐'}</span>
                      <span className="text-xs font-black text-slate-800">{code}</span>
                      <span className={`text-[10px] font-bold ${
                        s.violation > 0 ? 'text-red-600' : s.escalation > 0 ? 'text-indigo-600' : s.warning > 0 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {s.violation > 0 ? `${s.violation} fail` : s.escalation > 0 ? `${s.escalation} esc` : s.warning > 0 ? `${s.warning} warn` : 'cleared'}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {CATEGORIES.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <p className="font-semibold text-slate-800 text-sm">{cat.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.desc}</p>
                </td>
                {displayedCountries.map(code => {
                  const checks = getCellChecks(code, cat.id);
                  const status = getCellStatus(checks);
                  const primaryCheck = checks.find(c => c.status === status) || checks[0];

                  if (status === 'none' || !primaryCheck) return (
                    <td key={code} className="py-4 px-3 text-center border-l border-slate-50 text-slate-300">
                      —
                    </td>
                  );

                  return (
                    <td key={code} className="py-4 px-3 text-center border-l border-slate-50">
                      <button
                        onClick={() => setSelectedCheck(primaryCheck)}
                        className={`w-full py-2.5 px-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${statusColors(status)}`}
                      >
                        <StatusIcon status={status} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          {status === 'escalation' ? 'Review' : status === 'pass' ? 'Pass' : status === 'warning' ? 'Warn' : 'Fail'}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Rule Drawer */}
      {selectedCheck && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setSelectedCheck(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-slide-in-right p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-2xl mr-2">{FLAGS[selectedCheck.country_code] || '🌐'}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedCheck.country_code} · {selectedCheck.category}</span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{selectedCheck.check_code}</h3>
              </div>
              <button onClick={() => setSelectedCheck(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Explanation</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedCheck.explanation}</p>
            </div>

            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
              <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Rule Citation</p>
              <p className="text-sm font-mono font-semibold text-slate-800">{selectedCheck.rule_citation}</p>
            </div>

            {selectedCheck.fix_suggestion && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Fix Suggestion</p>
                <p className="text-sm text-blue-800 leading-relaxed">{selectedCheck.fix_suggestion}</p>
              </div>
            )}

            <button onClick={() => setSelectedCheck(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm mt-auto">
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
