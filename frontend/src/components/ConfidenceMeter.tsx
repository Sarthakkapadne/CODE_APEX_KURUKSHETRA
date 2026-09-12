'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, FileText, Database, GitFork, Info } from 'lucide-react';
import { FactorBreakdown, FactorScore } from '../lib/types';

interface ConfidenceMeterProps {
  score: number;
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  label: string;
  verdictSummary: string;
  factors: FactorBreakdown;
  isSimulated?: boolean;
  simulatedGain?: number;
  onFactorClick?: (factorKey: string) => void;
}

export default function ConfidenceMeter({
  score,
  tier,
  label,
  verdictSummary,
  factors,
  isSimulated = false,
  simulatedGain = 0,
  onFactorClick,
}: ConfidenceMeterProps) {
  // Determine color scheme based on score
  const getTierStyles = (tierValue: string) => {
    switch (tierValue) {
      case 'HIGH':
        return {
          stroke: '#10b981', // emerald-500
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          glow: 'rgba(16, 185, 129, 0.25)',
          icon: ShieldCheck,
        };
      case 'MEDIUM':
        return {
          stroke: '#f59e0b', // amber-500
          text: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          glow: 'rgba(245, 158, 11, 0.25)',
          icon: AlertTriangle,
        };
      case 'LOW':
      default:
        return {
          stroke: '#f43f5e', // rose-500
          text: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          glow: 'rgba(244, 63, 94, 0.25)',
          icon: ShieldAlert,
        };
    }
  };

  const currentStyles = getTierStyles(tier);
  const TierIcon = currentStyles.icon;

  // Circular gauge parameters
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const factorList: { key: string; label: string; icon: React.ElementType; factor: FactorScore }[] = [
    { key: 'rule_coverage', label: 'Rule Coverage (30%)', icon: CheckCircle2, factor: factors.rule_coverage },
    { key: 'evidence_verification', label: 'Evidence Verification (30%)', icon: FileText, factor: factors.evidence_verification },
    { key: 'product_data_completeness', label: 'Product Data Completeness (20%)', icon: Database, factor: factors.product_data_completeness },
    { key: 'dependency_health', label: 'Dependency Health (20%)', icon: GitFork, factor: factors.dependency_health },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-6">
      {/* Header with Title & Simulation Indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${currentStyles.bg} ${currentStyles.border}`}>
            <TierIcon className={`w-6 h-6 ${currentStyles.text}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Compliance Confidence Meter
              {isSimulated && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  Simulation Active (+{simulatedGain}%)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Explainable multi-factor regulatory assurance for target customs clearance.
            </p>
          </div>
        </div>

        {/* Confidence Tier Pill */}
        <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold border tracking-wider uppercase flex items-center gap-1.5 ${currentStyles.badge}`}>
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentStyles.stroke }} />
          <span>{label}</span>
        </div>
      </div>

      {/* Main Radial Dial and Factor Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Radial SVG Dial (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/50 relative">
          <div className="relative flex items-center justify-center">
            <svg
              className="transform -rotate-90"
              width="200"
              height="200"
              viewBox="0 0 200 200"
            >
              {/* Background track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="#1e293b"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress stroke */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke={currentStyles.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.4s ease',
                  filter: `drop-shadow(0 0 8px ${currentStyles.glow})`,
                }}
              />
            </svg>

            {/* Score in Dial Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-slate-100 tracking-tight font-mono">
                {score.toFixed(1)}%
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStyles.text}`}>
                {tier} CONFIDENCE
              </span>
            </div>
          </div>

          <div className="mt-3 text-center px-2">
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {verdictSummary}
            </p>
          </div>
        </div>

        {/* Right Column: 4-Factor Breakdown Bars (8 cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Factor Breakdown Formula</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Score = (30% R) + (30% E) + (20% D) + (20% H)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {factorList.map(({ key, label: factorLabel, icon: FactorIcon, factor }) => {
              const fScore = factor.score;
              const fWeight = factor.weight * 100;
              const fWeightedScore = factor.weighted_score;

              let barColor = 'bg-emerald-500';
              let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
              if (fScore < 50) {
                barColor = 'bg-rose-500';
                badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
              } else if (fScore < 80) {
                barColor = 'bg-amber-500';
                badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
              }

              return (
                <div
                  key={key}
                  onClick={() => onFactorClick && onFactorClick(key)}
                  className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FactorIcon className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                        {factorLabel}
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                      {fScore.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, fScore))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[180px]">{factor.explanation}</span>
                    <span className="font-mono text-slate-500 shrink-0 font-medium">
                      +{fWeightedScore.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
