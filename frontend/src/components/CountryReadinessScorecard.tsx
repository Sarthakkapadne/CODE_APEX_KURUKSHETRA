'use client';

import React from 'react';
import { AuditResponse } from '../lib/types';
import { Globe, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

interface CountryReadinessScorecardProps {
  auditData: AuditResponse;
  onCountrySelect?: (countryCode: string) => void;
}

const MARKET_INFO: Record<string, { name: string; flag: string }> = {
  US: { name: 'United States', flag: '🇺🇸' },
  EU: { name: 'European Union', flag: '🇪🇺' },
  UK: { name: 'United Kingdom', flag: '🇬🇧' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  JP: { name: 'Japan', flag: '🇯🇵' },
};

export default function CountryReadinessScorecard({
  auditData,
  onCountrySelect,
}: CountryReadinessScorecardProps) {
  const summary = auditData.summary_by_country || {};
  const markets = auditData.destination_markets || ['US', 'EU', 'UK', 'CA', 'JP'];

  // Calculate readiness score per country
  const countryScores = markets.map(code => {
    const s = summary[code] || { pass: 0, warning: 0, violation: 0, escalation: 0 };
    const total = (s.pass || 0) + (s.warning || 0) + (s.violation || 0) + (s.escalation || 0);

    let score = 100;
    if (total > 0) {
      score = Math.max(0, Math.round(((s.pass + s.warning * 0.7) / total) * 100));
      if (s.violation > 0) score = Math.min(score, 45); // Cap at 45% if hard violation
    }

    let statusText = '100% Ready for Sale';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let barColor = 'bg-emerald-500';

    if (s.violation > 0) {
      statusText = `${s.violation} Document${s.violation > 1 ? 's' : ''} Missing`;
      statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
      barColor = 'bg-rose-500';
    } else if (s.escalation > 0) {
      statusText = 'Legal Review Required';
      statusColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
      barColor = 'bg-indigo-500';
    } else if (s.warning > 0) {
      statusText = `Needs ${s.warning} Copy Fix${s.warning > 1 ? 'es' : ''}`;
      statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      barColor = 'bg-amber-500';
    }

    return {
      code,
      name: MARKET_INFO[code]?.name || code,
      flag: MARKET_INFO[code]?.flag || '🌐',
      score,
      statusText,
      statusColor,
      barColor,
      pass: s.pass || 0,
      warning: s.warning || 0,
      violation: s.violation || 0,
    };
  });

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-black text-slate-900">Country Market Readiness</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Calculated readiness score per destination country</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {markets.length} Target Markets
        </span>
      </div>

      <div className="space-y-4">
        {countryScores.map(c => (
          <button
            key={c.code}
            onClick={() => onCountrySelect && onCountrySelect(c.code)}
            className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-primary-300 hover:bg-slate-50/50 transition-all group space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.flag}</span>
                <div>
                  <p className="font-bold text-sm text-slate-800 group-hover:text-primary-700 transition-colors">
                    {c.name} ({c.code})
                  </p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-0.5 ${c.statusColor}`}>
                    {c.statusText}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 font-mono">{c.score}%</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-500 ${c.barColor}`}
                style={{ width: `${c.score}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
