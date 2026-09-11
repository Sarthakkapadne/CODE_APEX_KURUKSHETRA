'use client';
import React, { useState } from 'react';
import { Sparkles, Check, Copy, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { RemediationResult } from '../lib/types';

interface RemediationDiffViewProps {
  remediation?: RemediationResult;
  onApplyFix: (compliantTitle: string, compliantDesc: string) => void;
}

export default function RemediationDiffView({ remediation, onApplyFix }: RemediationDiffViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [applied, setApplied] = useState<boolean>(false);

  if (!remediation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Run an inspection audit to generate compliant copy rewrites and side-by-side diffs.
      </div>
    );
  }

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleApply = () => {
    onApplyFix(remediation.compliant_title, remediation.compliant_description);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Automated Compliant Rewrite & Side-by-Side Diff
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Converts unintentional disease/pesticide overclaims into compliant structure/function copy while preserving sales conversion.
          </p>
        </div>

        {/* 1-Click Apply Fix Button */}
        <button
          type="button"
          onClick={handleApply}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          {applied ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{applied ? 'Applied to Listing Input!' : 'Apply Compliant Fix & Re-Audit'}</span>
        </button>
      </div>

      {/* ── Side-by-Side Diff View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Original Marketing Copy (Flagged) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Original Seller Copy (Flagged)</span>
            </span>
            <span className="text-[10px] text-slate-500">Informal marketing copy</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div>
              <span className="text-slate-500 block text-[11px]">Title:</span>
              <p className="bg-slate-900/60 p-2 rounded border border-slate-800/80 line-through text-rose-300/80">
                {remediation.original_title}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Description & Bullets:</span>
              <p className="bg-slate-900/60 p-2 rounded border border-slate-800/80 whitespace-pre-line text-slate-400">
                {remediation.original_description}
              </p>
            </div>
          </div>
        </div>

        {/* Compliant Rewritten Copy */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/40 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compliant Rewritten Copy</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">100% Lawful Phrase Replacement</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Compliant Title:</span>
              <p className="bg-emerald-950/20 p-2 rounded border border-emerald-800/40 text-emerald-200 font-bold">
                {remediation.compliant_title}
              </p>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Compliant Description:</span>
              <p className="bg-emerald-950/20 p-2 rounded border border-emerald-800/40 whitespace-pre-line text-slate-200">
                {remediation.compliant_description}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Word-by-Word Remediation Rationale (Diffs) ── */}
      {remediation.diff_items && remediation.diff_items.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Specific Clause Substitutions & Regulatory Justification
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {remediation.diff_items.map((diff, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 font-mono text-[11px] line-through">
                    "{diff.original_phrase}"
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono text-[11px] font-bold">
                    "{diff.compliant_phrase}"
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{diff.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ready-to-Paste Marketplace Bullets ── */}
      {remediation.ready_to_paste_bullets && remediation.ready_to_paste_bullets.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Ready-to-Paste Amazon / Shopify Feature Bullets
          </span>
          <div className="space-y-2">
            {remediation.ready_to_paste_bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-sans flex-1 mr-3">{bullet}</span>
                <button
                  type="button"
                  onClick={() => handleCopyBullet(bullet, idx)}
                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
                  title="Copy bullet"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Human Escalation Items Notice ── */}
      {remediation.escalation_checklist && remediation.escalation_checklist.length > 0 && (
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1 text-xs">
          <span className="font-bold text-purple-400 block uppercase tracking-wider text-[11px]">
            Tier 3 Physical Documentation & Testing Escalation Required:
          </span>
          <p className="text-purple-200/90 text-[11px] leading-relaxed">
            The text modifications above solve the claims and labeling aspects. However, the following items require laboratory testing certificates or physical paperwork prior to import:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-purple-300 text-[11px] pt-1">
            {remediation.escalation_checklist.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
