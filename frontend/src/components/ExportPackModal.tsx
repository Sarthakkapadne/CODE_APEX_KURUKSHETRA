'use client';

import React, { useState } from 'react';
import { ComplianceExportPack } from '@/lib/types';

interface ExportPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportPack?: ComplianceExportPack;
  productTitle?: string;
}

export const ExportPackModal: React.FC<ExportPackModalProps> = ({
  isOpen,
  onClose,
  exportPack,
  productTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'amazon' | 'shopify' | 'packaging'>('amazon');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !exportPack) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadSpec = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LexPort — Packaging Artwork & Customs Compliance Spec Sheet</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .sku-badge { background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold; }
    .section { margin-top: 28px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; }
    .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    .note-item { margin-bottom: 6px; font-size: 13px; color: #334155; }
  </style>
</head>
<body>
  <h1>LexPort™ Cross-Border Compliance & Packaging Spec</h1>
  <p><strong>SKU:</strong> <span class="sku-badge">${exportPack.sku_identifier}</span> | <strong>Generated:</strong> ${exportPack.generated_at}</p>
  <p><strong>Product:</strong> ${exportPack.amazon_bundle.clean_title}</p>

  <div class="section">
    <div class="section-title">1. Packaging Artwork & Label Typography Specifications</div>
    <p><strong>Container Type:</strong> ${exportPack.packaging_artwork_spec.container_type}</p>
    <p><strong>Recommended Label Dimensions:</strong> ${exportPack.packaging_artwork_spec.recommended_dimensions_mm.width} mm (W) x ${exportPack.packaging_artwork_spec.recommended_dimensions_mm.height} mm (H)</p>
    <p><strong>Dual Net Quantity Statement:</strong> <strong>${exportPack.packaging_artwork_spec.net_quantity_declaration}</strong> (Min font height: ${exportPack.packaging_artwork_spec.net_quantity_font_size_pt} pt per 16 CFR § 500.18)</p>
    <p><strong>EU Responsible Person:</strong> ${exportPack.packaging_artwork_spec.responsible_person_block}</p>
    <p><strong>Mandatory Regulatory Marks:</strong> ${exportPack.packaging_artwork_spec.required_vector_marks.join(', ')}</p>
  </div>

  <div class="section">
    <div class="section-title">2. Canadian Bilingual English / French Translation Codex</div>
    <table>
      <thead>
        <tr><th>English Mandatory Term</th><th>Official Canadian French Translation (CPLA s. 6)</th></tr>
      </thead>
      <tbody>
        ${Object.entries(exportPack.packaging_artwork_spec.canadian_bilingual_text)
          .map(([eng, fr]) => `<tr><td>${eng}</td><td><strong>${fr}</strong></td></tr>`)
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. Statutory Engineering & Printing Directives</div>
    <ul>
      ${exportPack.packaging_artwork_spec.statutory_printer_notes
        .map((n) => `<li class="note-item">${n}</li>`)
        .join('')}
    </ul>
  </div>

  <div class="section">
    <div class="section-title">4. Customs Commercial Invoice Manifest</div>
    <table>
      <thead>
        <tr><th>Metafield Key</th><th>Value</th><th>Customs Statutory Justification</th></tr>
      </thead>
      <tbody>
        ${exportPack.shopify_metafields
          .map((m) => `<tr><td><code>${m.key}</code></td><td><strong>${m.value}</strong></td><td>${m.description}</td></tr>`)
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LexPort_Spec_${exportPack.sku_identifier}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">1-Click Compliant Export Pack</h2>
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono rounded">
                  {exportPack.sku_identifier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Production-ready Amazon Seller listing, Shopify customs metafields, and print-ready packaging artwork
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadSpec}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-white font-medium transition-all"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Spec (.html)
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-4">
          <button
            onClick={() => setActiveTab('amazon')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'amazon'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛒</span> Amazon Seller Central (Clean)
          </button>
          <button
            onClick={() => setActiveTab('shopify')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'shopify'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛍️</span> Shopify Customs Metafields
          </button>
          <button
            onClick={() => setActiveTab('packaging')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'packaging'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏷️</span> Print-Ready Packaging Artwork Spec
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-170px)] space-y-6">
          {/* TAB 1: AMAZON SELLER READY */}
          {activeTab === 'amazon' && (
            <div className="space-y-6">
              {/* Sanitized Keywords Notification */}
              {exportPack.amazon_bundle.prohibited_terms_removed.length > 0 && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3">
                  <span className="text-red-400 mt-0.5 text-sm">⚠️</span>
                  <div>
                    <h4 className="text-xs font-bold text-red-300">
                      Banned Regulatory & Medical Terms Automatically Scrubbed:
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {exportPack.amazon_bundle.prohibited_terms_removed.map((t) => (
                        <span key={t} className="text-[11px] px-2 py-0.5 bg-red-900/60 text-red-200 line-through rounded font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Clean Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Compliant Product Title ({exportPack.amazon_bundle.clean_title.length} / 200 chars)
                  </label>
                  <button
                    onClick={() => handleCopy(exportPack.amazon_bundle.clean_title, 'title')}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    {copiedKey === 'title' ? '✓ Copied!' : 'Copy Title'}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-medium">
                  {exportPack.amazon_bundle.clean_title}
                </div>
              </div>

              {/* 5 Compliant Bullets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    5 Statutory-Verified Bullet Points (Key Product Features)
                  </label>
                  <button
                    onClick={() =>
                      handleCopy(exportPack.amazon_bundle.bullet_points.join('\n\n'), 'all_bullets')
                    }
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    {copiedKey === 'all_bullets' ? '✓ Copied All 5!' : 'Copy All 5 Bullets'}
                  </button>
                </div>
                <div className="space-y-2">
                  {exportPack.amazon_bundle.bullet_points.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between gap-3 text-xs leading-relaxed"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">{idx + 1}.</span>
                        <span className="text-slate-200">{b}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(b, `bullet_${idx}`)}
                        className="text-slate-400 hover:text-amber-300 shrink-0 font-medium"
                      >
                        {copiedKey === `bullet_${idx}` ? '✓' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Backend Search Terms */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Backend Search Keywords (Scrubbed of Medical & Pesticidal Triggers)
                  </label>
                  <button
                    onClick={() => handleCopy(exportPack.amazon_bundle.backend_search_terms, 'keywords')}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    {copiedKey === 'keywords' ? '✓ Copied!' : 'Copy Keywords'}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
                  {exportPack.amazon_bundle.backend_search_terms}
                </div>
              </div>

              {/* Statutory A+ Legal Disclaimer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    A+ Content Legal Disclaimer Footer (FDA / GPSR Lawful Notice)
                  </label>
                  <button
                    onClick={() =>
                      handleCopy(exportPack.amazon_bundle.a_plus_legal_disclaimer, 'disclaimer')
                    }
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    {copiedKey === 'disclaimer' ? '✓ Copied!' : 'Copy Disclaimer'}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 italic">
                  {exportPack.amazon_bundle.a_plus_legal_disclaimer}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHOPIFY CUSTOMS METAFIELDS */}
          {activeTab === 'shopify' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Customs Manifest & Broker EDI Data
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pre-formatted for Shopify GraphQL mutations and cross-border customs declarations
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(
                        exportPack.shopify_metafields.reduce(
                          (acc, m) => ({ ...acc, [m.key]: m.value }),
                          {}
                        ),
                        null,
                        2
                      ),
                      'shopify_json'
                    )
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                >
                  {copiedKey === 'shopify_json' ? '✓ JSON Copied!' : 'Copy Shopify JSON'}
                </button>
              </div>

              {/* Metafield Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-mono">
                    <tr>
                      <th className="p-3 border-b border-slate-800">Metafield Key</th>
                      <th className="p-3 border-b border-slate-800">Assigned Value</th>
                      <th className="p-3 border-b border-slate-800">Statutory Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {exportPack.shopify_metafields.map((m) => (
                      <tr key={m.key} className="hover:bg-slate-850">
                        <td className="p-3 font-mono text-emerald-400 font-medium">{m.key}</td>
                        <td className="p-3 font-mono text-white font-semibold">{m.value}</td>
                        <td className="p-3 text-slate-400">{m.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PACKAGING ARTWORK SPEC */}
          {activeTab === 'packaging' && (
            <div className="space-y-6">
              {/* Packaging Header & Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-[11px] block">Container Format</span>
                  <span className="text-sm font-bold text-white">
                    {exportPack.packaging_artwork_spec.container_type}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-[11px] block">Die-Cut Dimensions (W x H)</span>
                  <span className="text-sm font-bold font-mono text-indigo-400">
                    {exportPack.packaging_artwork_spec.recommended_dimensions_mm.width} mm ×{' '}
                    {exportPack.packaging_artwork_spec.recommended_dimensions_mm.height} mm
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-[11px] block">Net Weight Font Standard</span>
                  <span className="text-sm font-bold font-mono text-amber-400">
                    ≥ {exportPack.packaging_artwork_spec.net_quantity_font_size_pt} pt (16 CFR § 500.18)
                  </span>
                </div>
              </div>

              {/* Visual Packaging Label Die-Cut Mockup */}
              <div className="p-5 bg-slate-950 rounded-xl border border-dashed border-indigo-500/50 space-y-4 relative">
                <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono">
                  [TECHNICAL DIE-CUT PACKAGING PROOF — PRINCIPAL DISPLAY PANEL & BASE]
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Front PDP Panel */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Primary Display Panel (Front)
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {exportPack.amazon_bundle.clean_title.split('-')[0]}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Topical Hydration Complex • cGMP Certified Facility
                    </p>
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                        {exportPack.packaging_artwork_spec.net_quantity_declaration}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Bottom 30% PDP compliant</span>
                    </div>
                  </div>

                  {/* Regulatory & Canadian Bilingual Panel */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Statutory Back Panel (Canada French & EU RP)
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {Object.entries(exportPack.packaging_artwork_spec.canadian_bilingual_text)
                        .slice(0, 3)
                        .map(([eng, fr]) => (
                          <div key={eng} className="flex justify-between gap-2 border-b border-slate-800/40 pb-1">
                            <span className="text-slate-400">{eng}:</span>
                            <span className="text-white font-medium">{fr}</span>
                          </div>
                        ))}
                    </div>

                    <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800">
                      <strong>EU RP:</strong> {exportPack.packaging_artwork_spec.responsible_person_block}
                    </div>
                  </div>
                </div>

                {/* Vector Marks Grid */}
                <div className="pt-2 flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium">Mandatory Vector Marks:</span>
                  {exportPack.packaging_artwork_spec.required_vector_marks.map((mark) => (
                    <span
                      key={mark}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono rounded-md flex items-center gap-1.5"
                    >
                      <span className="text-amber-400 font-bold">✓</span> {mark}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statutory Printer Guidelines */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mandatory Printer Engineering Directives:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {exportPack.packaging_artwork_spec.statutory_printer_notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
