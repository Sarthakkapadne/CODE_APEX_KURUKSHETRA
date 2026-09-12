'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, Search, Plus, RefreshCw, FileText, CheckCircle2,
  AlertTriangle, XCircle, ShieldAlert, Globe, Clock, HelpCircle,
  Eye, Download, ArrowRight, Zap
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { fetchInspections } from '../../lib/api';

const MARKET_FLAGS: Record<string, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵' };

function VerdictBadge({ verdict }: { verdict: string }) {
  const v = verdict?.toUpperCase() || '';
  if (v === 'COMPLIANT') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Compliant
    </span>
  );
  if (v === 'IMPORT_PROHIBITED') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full">
      <XCircle className="w-3 h-3" /> Prohibited
    </span>
  );
  if (v === 'ESCALATION_REQUIRED') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full">
      <ShieldAlert className="w-3 h-3" /> Escalation
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Remediation
    </span>
  );
}

function statusColor(verdict: string) {
  const v = verdict?.toUpperCase() || '';
  if (v === 'COMPLIANT')          return 'bg-emerald-500';
  if (v === 'IMPORT_PROHIBITED')  return 'bg-rose-500';
  if (v === 'ESCALATION_REQUIRED')return 'bg-indigo-500';
  return 'bg-amber-500';
}

function ProductCard({ ins }: { ins: any }) {
  const bar = statusColor(ins.overall_verdict);
  const markets = ins.destination_markets || [];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-card hover:shadow-card-hover feature-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-12 rounded-full ${bar} flex-shrink-0`} />
          <div>
            <p className="font-black text-slate-800 text-sm leading-tight">
              {ins.listing_id?.slice(0, 30) || 'Product Audit'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ins.id?.slice(0, 16)}…</p>
          </div>
        </div>
        <VerdictBadge verdict={ins.overall_verdict} />
      </div>

      {/* Markets */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Destination Markets</p>
        <div className="flex flex-wrap gap-1.5">
          {markets.slice(0, 5).map((m: string) => (
            <span key={m} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
              <span>{MARKET_FLAGS[m] || '🌐'}</span>
              <span className="font-semibold">{m}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Clock className="w-3 h-3" />
        <span>Last checked: {ins.timestamp_utc ? new Date(ins.timestamp_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
        <Link
          href="/audit/new"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-xl transition-colors border border-primary-100"
        >
          <RefreshCw className="w-3 h-3" /> Re-Audit
        </Link>
        <Link
          href="/audit/new"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors border border-slate-100"
        >
          <Eye className="w-3 h-3" /> View
        </Link>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-xl transition-colors border border-slate-100"
          title="Download Report"
        >
          <Download className="w-3 h-3" /> Export
        </button>
      </div>
    </div>
  );
}

function ProductsContent() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [view, setView]         = useState<'grid' | 'list'>('grid');
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');

  useEffect(() => {
    fetchInspections()
      .then(setInspections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const VERDICT_FILTERS = [
    { key: 'ALL',                    label: 'All Products' },
    { key: 'COMPLIANT',              label: 'Compliant' },
    { key: 'REMEDIATION_REQUIRED',   label: 'Needs Fix' },
    { key: 'ESCALATION_REQUIRED',    label: 'Escalation' },
    { key: 'IMPORT_PROHIBITED',      label: 'Prohibited' },
  ];

  const filtered = inspections.filter(i => {
    const matchSearch = !search ||
      i.listing_id?.toLowerCase().includes(search.toLowerCase()) ||
      i.id?.toLowerCase().includes(search.toLowerCase());
    const matchVerdict = filterVerdict === 'ALL' || i.overall_verdict === filterVerdict;
    return matchSearch && matchVerdict;
  });

  const stats = {
    total:     inspections.length,
    compliant: inspections.filter(i => i.overall_verdict === 'COMPLIANT').length,
    fixes:     inspections.filter(i => ['REMEDIATION_REQUIRED', 'WARNINGS_DETECTED'].includes(i.overall_verdict)).length,
    escalated: inspections.filter(i => i.overall_verdict === 'ESCALATION_REQUIRED').length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 radial-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Products</h1>
          <p className="text-sm text-slate-500 mt-1">Audited product listings and their compliance status</p>
        </div>
        <Link href="/audit/new" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-blue transition-colors text-sm">
          <Plus className="w-4 h-4" /> Add Product / Audit
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: stats.total,     color: 'bg-primary-50 text-primary-600' },
          { label: 'Compliant',      value: stats.compliant, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Needs Fix',      value: stats.fixes,     color: 'bg-amber-50 text-amber-600' },
          { label: 'Escalated',      value: stats.escalated, color: 'bg-indigo-50 text-indigo-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border border-slate-100 bg-white shadow-card`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color.split(' ')[1]}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-card w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter products…"
            className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {VERDICT_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterVerdict(f.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                filterVerdict === f.key
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-primary-300 bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 shimmer rounded-2xl" />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-card">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary-300" />
          </div>
          <p className="font-black text-slate-700 text-lg">No products found</p>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            {inspections.length === 0
              ? 'Run a compliance audit to add products to your workspace.'
              : 'Try adjusting your search or filter.'}
          </p>
          <Link href="/audit/new" className="mt-5 inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow-blue">
            <Plus className="w-4 h-4" /> Audit First Product
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ins => (
            <ProductCard key={ins.id} ins={ins} />
          ))}
        </div>
      )}

      {/* Help Banner */}
      {!loading && filtered.length > 0 && (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-sm">Want to know what you need to sell a product?</p>
            <p className="text-xs text-slate-500 mt-0.5">Run a new compliance audit to get a full checklist of requirements, documents, and certifications.</p>
          </div>
          <Link href="/audit/new" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 whitespace-nowrap">
            Start Audit <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <AppShell>
      <ProductsContent />
    </AppShell>
  );
}
