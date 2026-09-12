'use client';
import React from 'react';
import { Layers, ArrowRight, TrendingDown, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';
import { HSTariffArbitrageResult } from '../lib/types';

interface HSTariffArbitrageCardProps {
  hsTariff?: HSTariffArbitrageResult;
}

export default function HSTariffArbitrageCard({ hsTariff }: HSTariffArbitrageCardProps) {
  if (!hsTariff) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Dynamic HS Code & Tariff Arbitrage Engine
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium border bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                WCO 6-Digit & 10-Digit HTS
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates customs tariff classification shifts and calculates exact duty savings achieved through compliance scrubbing
            </p>
          </div>
        </div>

        {/* Total Arbitrage Savings Pill */}
        {(hsTariff.total_arbitrage_savings_usd || 0) > 0 ? (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 shadow-sm">
            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold block text-emerald-600 dark:text-emerald-400">
                Duty Savings Arbitrage
              </span>
              <span className="text-base font-extrabold">
                +${(hsTariff.total_arbitrage_savings_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Optimized HS Classification
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Classification Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Declared HS Code Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Declared Standard Classification
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                Target Code
              </span>
            </div>
            <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mb-1">
              {hsTariff.declared_hs_code}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              {hsTariff.declared_hs_description}
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-between text-xs">
              <span className="text-slate-500">Applicable Duty:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{hsTariff.declared_duty_rate}</span>
            </div>
          </div>

          {/* Involuntary Reclassification Risk Box */}
          <div className={`p-4 rounded-xl border ${hsTariff.is_misclassified ? 'border-red-200 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Customs Reclassification Shift
              </span>
              {hsTariff.is_misclassified ? (
                <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  Triggered by Claims
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  No Shift
                </span>
              )}
            </div>
            <div className="font-mono text-xl font-bold text-red-600 dark:text-red-400 mb-1">
              {hsTariff.reclassified_hs_code}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              {hsTariff.reclassified_hs_description}
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-between text-xs">
              <span className="text-slate-500">Border Duty Cliff:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{hsTariff.reclassified_duty_rate}</span>
            </div>
          </div>
        </div>

        {/* Remediation Action Callout */}
        <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 rounded-lg flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
          <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Tariff Arbitrage Remediation Directive:</span>
            <span>{hsTariff.remediation_action}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
