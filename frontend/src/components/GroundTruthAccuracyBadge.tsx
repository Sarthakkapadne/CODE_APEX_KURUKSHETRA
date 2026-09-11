'use client';
import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { GroundTruthAccuracyIndex } from '../lib/types';

interface GroundTruthAccuracyBadgeProps {
  accuracy?: GroundTruthAccuracyIndex;
}

export default function GroundTruthAccuracyBadge({ accuracy }: GroundTruthAccuracyBadgeProps) {
  const [showProofModal, setShowProofModal] = useState(false);

  if (!accuracy) return null;

  return (
    <>
      {/* Clickable Header Badge */}
      <button
        onClick={() => setShowProofModal(true)}
        className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-sm"
        title="View Verbatim Ground-Truth Codex Citations"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>GTVI: <b>{accuracy.composite_accuracy_score}%</b></span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 font-mono">
          {accuracy.trust_grade}
        </span>
      </button>

      {/* Verbatim Statutory Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Ground-Truth Verification Index (GTVI)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Deterministic alignment proof: Every matrix violation cross-referenced against verbatim government gazette statutes.
                </p>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Score Breakdown Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                    Composite GTVI
                  </span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {accuracy.composite_accuracy_score}%
                  </span>
                  <span className="text-[10px] text-emerald-600/80 block">{accuracy.trust_grade}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Statutory Alignment
                  </span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                    {accuracy.statutory_alignment_score}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Zero Hallucinations</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Extraction Fidelity
                  </span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                    {accuracy.extraction_fidelity_score}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Technical Parameter Match</span>
                </div>
              </div>

              {/* Verbatim Statutory Clauses */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  Verbatim Government Codex Evidence ({accuracy.verbatim_statutory_proofs.length} Clauses)
                </h4>

                <div className="space-y-3">
                  {accuracy.verbatim_statutory_proofs.map((proof, i) => (
                    <div key={i} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {proof.title}
                        </span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          {proof.citation}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        Official Source: <span className="font-semibold text-slate-700 dark:text-slate-300">{proof.government_source}</span>
                      </p>

                      <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed">
                        "{proof.verbatim_law}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Close Codex Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
