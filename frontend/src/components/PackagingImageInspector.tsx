'use client';
import React, { useState } from 'react';
import { 
  Camera, Languages, AlertTriangle, CheckCircle2, ShieldAlert, 
  Scan, ArrowRight, Eye, Sparkles, FileText, Check, XCircle
} from 'lucide-react';
import { PackagingAnalysisResult, PackagingOCRRegion, TriangulationDiscrepancyItem } from '../lib/types';

interface PackagingImageInspectorProps {
  packaging?: PackagingAnalysisResult;
}

export default function PackagingImageInspector({ packaging }: PackagingImageInspectorProps) {
  const [selectedBox, setSelectedBox] = useState<PackagingOCRRegion | null>(null);

  if (!packaging) return null;

  const isFailed = packaging.physical_verdict === 'REPACKAGING_MANDATORY' || packaging.physical_verdict === 'SEIZURE_RISK';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Multi-Modal Packaging Vision & 3-Way Triangulation
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium border bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300">
                Rosetta Stone VLM
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scans physical packaging box & back-labels, translates foreign languages to standardized English INCI, and catches hidden lies
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-sky-500" />
            Detected: <b>{packaging.detected_language}</b>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
            isFailed 
              ? 'text-red-700 bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400' 
              : 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
          }`}>
            {isFailed ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {packaging.physical_verdict.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Grid: Simulated Packaging Box Canvas + Rosetta Stone Translation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Packaging Box Canvas (Visual Bounding Boxes) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Physical Label Visual Inspection Canvas
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {(packaging.bounding_boxes || []).length} Bounding Boxes Mapped
              </span>
            </div>

            {/* Simulated Packaging Label Canvas */}
            <div className="relative flex-1 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-800/40 min-h-[260px] flex flex-col justify-between font-sans">
              <div className="space-y-3">
                {(packaging.bounding_boxes || []).map((box, i) => {
                  const isViolation = box.severity === 'violation';
                  const isSelected = selectedBox?.label === box.label;

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedBox(box)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isViolation
                          ? 'border-red-400 bg-red-500/10 hover:bg-red-500/20 text-red-900 dark:text-red-200'
                          : 'border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200'
                      } ${isSelected ? 'ring-2 ring-sky-500 shadow-md' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${isViolation ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                          {box.label}
                        </span>
                        <span className="font-mono text-[10px] opacity-80">
                          {(box.confidence * 100).toFixed(0)}% Conf.
                        </span>
                      </div>
                      <div className="font-mono text-xs bg-white/70 dark:bg-black/40 p-2 rounded border border-black/5 dark:border-white/10">
                        {box.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Certification Logos Footer on Box */}
              <div className="mt-4 pt-3 border-t border-slate-300 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Printed Markings:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(packaging.detected_certification_logos || []).map((logo, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {logo.replace('_', ' ')}
                    </span>
                  ))}
                  {(packaging.missing_certification_logos || []).map((logo, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-[10px] font-bold border border-red-300 dark:border-red-700 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      MISSING {logo.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rosetta Stone: Translation Provenance Table */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  Rosetta Stone: Forensic Translation Provenance
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
                  INCI / USAN Standardized
                </span>
              </div>

              <div className="space-y-3">
                {(packaging.translation_provenance || []).length > 0 ? (
                  (packaging.translation_provenance || []).map((item, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">[{item.detected_language}]</span>
                          <span>"{item.original_term}"</span>
                          <ArrowRight className="w-3 h-3 text-indigo-500" />
                          <span className="text-indigo-600 dark:text-indigo-400">"{item.translated_term}"</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {(item.confidence * 100).toFixed(0)}% Match
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                        {item.notes}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                    Packaging is in standard English. Zero foreign translation conversion required.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Bounding Box Detail Popover */}
            {selectedBox && (
              <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-xs animate-in fade-in duration-150">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Focused Box: {selectedBox.label}
                  </span>
                  <button onClick={() => setSelectedBox(null)} className="text-slate-400 hover:text-slate-700">×</button>
                </div>
                <div className="font-mono text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-black/40 p-2 rounded mb-1">
                  {selectedBox.text}
                </div>
                <span className="text-[11px] text-sky-700 dark:text-sky-300">
                  Confidence: {(selectedBox.confidence * 100).toFixed(1)}% | Flagged for border compliance review.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: 3-Way Triangulation Radar Table */}
        {(packaging.discrepancies || []).length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                3-Way Triangulation Discrepancies (Listing Copy vs Physical Box vs Destination Law)
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold font-mono">
                {(packaging.discrepancies || []).length} Critical Discrepancies Detected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Discrepancy Type</th>
                    <th className="p-3">What Seller Put in Listing</th>
                    <th className="p-3">What is Printed on Physical Box</th>
                    <th className="p-3">Violated Destination Statute</th>
                    <th className="p-3">Customs Border Enforcement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {(packaging.discrepancies || []).map((disc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-[10px] block w-fit">
                          {disc.discrepancy_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                        "{disc.listing_claim}"
                      </td>
                      <td className="p-3 text-red-700 dark:text-red-300 font-mono bg-red-50/30 dark:bg-red-950/20">
                        {disc.physical_label_reality}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {disc.destination_statute}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {disc.border_impact}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
