'use client';
import React from 'react';
import { DollarSign, TrendingUp, Award, HelpCircle, ArrowUpRight } from 'lucide-react';
import { TradeEconomicsItem } from '../lib/types';

interface TradeEconomicsAdvisorProps {
  economics: TradeEconomicsItem[];
}

const MARKET_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  UK: '🇬🇧',
  CA: '🇨🇦',
  JP: '🇯🇵',
};

export default function TradeEconomicsAdvisor({ economics }: TradeEconomicsAdvisorProps) {
  if (!economics || economics.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Trade Economics & Market Expansion Advisor
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              STRATEGIC USP
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked market entry recommendations based on import de minimis duty limits, VAT/GST schemes, and clearance friction.
          </p>
        </div>
      </div>

      {/* ── Ranked Market Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {economics.map(item => {
          const isTop1 = item.entry_friction_rank === 1;
          const isHighFriction = item.customs_complexity_score >= 8;

          return (
            <div
              key={item.country_code}
              className={`p-4 rounded-xl border relative transition-all ${
                isTop1
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-900/20'
                  : isHighFriction
                  ? 'bg-slate-950/60 border-slate-800 hover:border-amber-700/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Rank Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{MARKET_FLAGS[item.country_code] || '🌐'}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.country_name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">{item.country_code} Market</span>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center space-x-1 ${
                  isTop1
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {isTop1 && <Award className="w-3.5 h-3.5" />}
                  <span>Rank #{item.entry_friction_rank}</span>
                </div>
              </div>

              {/* De Minimis & Tax Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs mb-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">De Minimis Threshold:</span>
                  <span className="font-mono font-bold text-slate-200 text-xs">
                    {item.de_minimis_threshold} {item.de_minimis_currency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Customs Friction:</span>
                  <span className={`font-mono font-bold text-xs ${
                    item.customs_complexity_score <= 3
                      ? 'text-emerald-400'
                      : item.customs_complexity_score <= 6
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {item.customs_complexity_score}/10 {item.customs_complexity_score <= 3 ? '(Low)' : (item.customs_complexity_score <= 6 ? '(Moderate)' : '(High)')}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-semibold block">Fiscal Simplification Scheme:</span>
                  <span className="text-[11px] text-sky-300 font-medium">
                    {item.simplification_scheme}
                  </span>
                </div>
              </div>

              {/* Strategic Recommendation */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {item.recommendation_summary}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
