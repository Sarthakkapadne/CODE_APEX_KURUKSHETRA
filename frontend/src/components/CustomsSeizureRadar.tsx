'use client';
import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, FileWarning, DollarSign, 
  Building2, Scale, X, ExternalLink, Clock, CheckCircle2 
} from 'lucide-react';
import { CustomsSeizureRadarResult, CBPNoticeOfAction } from '../lib/types';

interface CustomsSeizureRadarProps {
  radar?: CustomsSeizureRadarResult;
}

export default function CustomsSeizureRadar({ radar }: CustomsSeizureRadarProps) {
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  if (!radar) return null;

  const isCritical = radar.threat_level === 'CRITICAL_SEIZURE_RISK';
  const isElevated = radar.threat_level === 'ELEVATED_DETENTION_RISK';
  const isModerate = radar.threat_level === 'MODERATE_CUSTOMS_HOLD';

  const threatColor = isCritical 
    ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400' 
    : isElevated 
    ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400'
    : isModerate
    ? 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-400'
    : 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';

  const gaugeColor = isCritical ? '#EF4444' : isElevated ? '#F59E0B' : isModerate ? '#EAB308' : '#10B981';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Customs Seizure Risk Radar
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                Port-of-Entry Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates border interception likelihood, inter-agency holds (CBP/FDA/CBSA), and statutory fine exposure
            </p>
          </div>
        </div>

        {/* Threat Level Pill */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${threatColor}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {radar.threat_level.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gauge & Probability */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Circular Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={gaugeColor}
                strokeWidth="10"
                strokeDasharray={`${(radar.seizure_probability_pct / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {radar.seizure_probability_pct.toFixed(1)}%
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Seizure Likelihood
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px]">
            {isCritical 
              ? 'Immediate border quarantine & physical seizure expected upon arrival.' 
              : isElevated 
              ? 'High risk of administrative detention and demand for redelivery.'
              : 'Low friction anticipated. Ensure commercial invoice matches HTS code.'}
          </p>

          {radar.simulated_notice && (
            <button
              onClick={() => setShowNoticeModal(true)}
              className="mt-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <FileWarning className="w-3.5 h-3.5" />
              View Simulated Notice of Action
            </button>
          )}
        </div>

        {/* Middle Column: Financial Exposure & Fee Breakdown */}
        <div className="flex flex-col justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Total Financial Exposure Risk
              </span>
              <span className="text-xs text-slate-400">1,000 unit batch</span>
            </div>

            <div className="text-2xl font-black text-red-600 dark:text-red-400 mb-4">
              ${radar.estimated_financial_exposure_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-400">Commercial Inventory Value:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ${(radar.breakdown_fees.inventory_risk_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-400">Port Demurrage (14d Quarantine):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ${(radar.breakdown_fees.port_demurrage_quarantine_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 dark:text-slate-400">CBP Civil Penalties (19 U.S.C. § 1592):</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  ${(radar.breakdown_fees.statutory_civil_penalties_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Enforcing Agencies:</span>
            {radar.target_enforcement_agencies.map((agency, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                {agency}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Detention Triggers & Seizure Avoidance */}
        <div className="flex flex-col justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Primary Interception Triggers
            </h4>
            <div className="space-y-2 mb-4">
              {radar.primary_detention_triggers.length > 0 ? (
                radar.primary_detention_triggers.map((trigger, i) => (
                  <div key={i} className="p-2 bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 rounded text-xs text-red-800 dark:text-red-300 flex items-start gap-1.5">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{trigger}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No immediate physical interception triggers detected.</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Directives to Clear Border
            </h4>
            <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              {radar.seizure_avoidance_directives.map((dir, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{dir}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Simulated Government Notice Modal (CBP Form 29 / CBSA Form E635) */}
      {showNoticeModal && radar.simulated_notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto font-sans">
            {/* Government Form Header */}
            <div className="p-6 border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-between items-start">
              <div>
                <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                  Official Government Border Agency Document // Intercept Simulator
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {radar.simulated_notice.form_type}
                </h3>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                  Notice Ref: <span className="font-bold text-red-600 dark:text-red-400">{radar.simulated_notice.notice_id}</span>
                </div>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Body Form Layout */}
            <div className="p-6 space-y-4 text-xs font-mono text-slate-800 dark:text-slate-200">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Port of Entry & Station:</span>
                  <span className="font-semibold">{radar.simulated_notice.issuing_port}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Issuing Officer / Unit:</span>
                  <span className="font-semibold">{radar.simulated_notice.issuing_officer}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Target Consignee:</span>
                  <span className="font-semibold">{radar.simulated_notice.target_consignee}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Action Status:</span>
                  <span className="font-bold text-red-600">{radar.simulated_notice.action_type}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Statement of Legal Grounds for Detention & Seizure:
                </span>
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded text-red-900 dark:text-red-200 font-sans leading-relaxed">
                  {radar.simulated_notice.grounds_for_action}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Applicable Statutory Citations:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                  {radar.simulated_notice.cited_statutes.map((statute, i) => (
                    <li key={i} className="font-semibold text-slate-900 dark:text-white">
                      {statute}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded font-sans flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    Statutory Response Window: {radar.simulated_notice.response_deadline_days} Days
                  </span>
                  <span className="text-amber-800 dark:text-amber-300 text-[11px]">
                    Failure to furnish verified compliance documentation or export notice within the response deadline will result in total forfeiture and physical destruction under 19 U.S.C. § 1595a.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3">
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
