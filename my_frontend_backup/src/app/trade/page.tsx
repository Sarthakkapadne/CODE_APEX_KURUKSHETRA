'use client';
import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowUpDown, Info } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { fetchInspections } from '../../lib/api';
import Link from 'next/link';
import { Plus, AlertTriangle } from 'lucide-react';

const STATIC_ECONOMICS = [
  { country_code: 'US', country_name: 'United States', flag: '🇺🇸', de_minimis: 800, currency: 'USD', vat_scheme: 'Section 321 / No VAT', duty: '0–5%', complexity: 2, friction_rank: 1, recommendation: 'Lowest friction. Strong Section 321 de minimis. Start here.' },
  { country_code: 'EU', country_name: 'European Union', flag: '🇪🇺', de_minimis: 150, currency: 'EUR', vat_scheme: 'IOSS (One Stop Shop)', duty: '2–12%', complexity: 6, friction_rank: 3, recommendation: 'IOSS simplifies VAT. High compliance burden for CE marking.' },
  { country_code: 'UK', country_name: 'United Kingdom', flag: '🇬🇧', de_minimis: 135, currency: 'GBP', vat_scheme: 'UK Import OSS', duty: '2–10%', complexity: 5, friction_rank: 2, recommendation: 'Post-Brexit rules. UKCA marking required. Moderate complexity.' },
  { country_code: 'CA', country_name: 'Canada', flag: '🇨🇦', de_minimis: 20, currency: 'CAD', vat_scheme: 'GST/HST (CERB)', duty: '5–18%', complexity: 7, friction_rank: 4, recommendation: 'Low de minimis. High bilingual labeling requirements.' },
  { country_code: 'JP', country_name: 'Japan', flag: '🇯🇵', de_minimis: 10000, currency: 'JPY', vat_scheme: 'Consumption Tax (JCT)', duty: '3–15%', complexity: 8, friction_rank: 5, recommendation: 'Complex certification requirements. PSE/PSC marks essential.' },
];

function TradeContent() {
  const [sortBy, setSortBy] = useState<'friction_rank' | 'complexity' | 'de_minimis'>('friction_rank');
  const [auditEconomics, setAuditEconomics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections()
      .then(ins => {
        // Use static data since we don't have per-inspection economics here
        setAuditEconomics(STATIC_ECONOMICS);
      })
      .catch(() => setAuditEconomics(STATIC_ECONOMICS))
      .finally(() => setLoading(false));
  }, []);

  const sortedData = [...STATIC_ECONOMICS].sort((a, b) => {
    if (sortBy === 'friction_rank') return a.friction_rank - b.friction_rank;
    if (sortBy === 'complexity') return a.complexity - b.complexity;
    if (sortBy === 'de_minimis') return b.de_minimis - a.de_minimis;
    return 0;
  });

  const maxComplexity = 10;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Trade Economics</h1>
          <p className="text-sm text-slate-500 mt-1">Compare duty rates, de-minimis thresholds, and entry friction across markets</p>
        </div>
        <Link href="/audit/new" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-blue transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Audit
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 text-sm">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800">Trade economics shown are reference data. Live tariff data requires integration with your customs API provider. Connect at: <code className="font-mono text-xs">backend/api/routers/economics.py</code></p>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-slate-500">Sort by:</span>
        {[
          { key: 'friction_rank', label: 'Entry Friction' },
          { key: 'complexity', label: 'Customs Complexity' },
          { key: 'de_minimis', label: 'De Minimis (High to Low)' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key as any)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              sortBy === opt.key ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Market Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedData.map((e, i) => (
          <div key={e.country_code} className={`bg-white border rounded-2xl p-5 shadow-card hover:shadow-card-hover feature-card transition-all ${
            i === 0 ? 'border-green-200 ring-2 ring-green-50' : 'border-slate-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{e.flag}</span>
                <div>
                  <p className="font-bold text-slate-800">{e.country_name}</p>
                  <p className="text-xs text-slate-400">{e.country_code}</p>
                </div>
              </div>
              <span className={`text-sm font-black px-2.5 py-1 rounded-full ${
                i === 0 ? 'bg-green-100 text-green-700' : i === 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                #{e.friction_rank}
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">De Minimis</span>
                <span className="font-semibold text-slate-800">{e.currency} {e.de_minimis.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duty Range</span>
                <span className="font-semibold text-slate-800">{e.duty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VAT/GST</span>
                <span className="font-semibold text-slate-800 text-right text-xs">{e.vat_scheme}</span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Customs Complexity</span>
                  <span className="font-semibold text-slate-800">{e.complexity}/10</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: maxComplexity }).map((_, idx) => (
                    <div key={idx} className={`h-2 flex-1 rounded-sm ${idx < e.complexity ? (e.complexity <= 3 ? 'bg-green-400' : e.complexity <= 6 ? 'bg-amber-400' : 'bg-red-400') : 'bg-slate-100'}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 leading-relaxed">{e.recommendation}</p>
            </div>

            {i === 0 && (
              <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-2.5 text-xs text-green-700 font-semibold text-center">
                ✓ Recommended First Market
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Full Comparison Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                {['Country', 'De Minimis', 'Duty', 'VAT Scheme', 'Complexity (1–10)', 'Entry Rank'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedData.map(e => (
                <tr key={e.country_code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800 flex items-center gap-2">
                    <span>{e.flag}</span> {e.country_name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{e.currency} {e.de_minimis.toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{e.duty}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{e.vat_scheme}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5 w-20">
                        {Array.from({length:10}).map((_,i) => (
                          <div key={i} className={`h-2 flex-1 rounded-sm ${i < e.complexity ? 'bg-primary-400' : 'bg-slate-100'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{e.complexity}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-bold text-sm ${e.friction_rank === 1 ? 'text-green-600' : e.friction_rank <= 2 ? 'text-blue-600' : 'text-slate-600'}`}>
                      #{e.friction_rank}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TradePage() {
  return (
    <AppShell>
      <TradeContent />
    </AppShell>
  );
}
