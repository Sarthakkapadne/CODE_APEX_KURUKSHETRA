'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Plus, CheckCircle2, AlertTriangle, XCircle,
  ShieldAlert, Globe, ArrowRight, RefreshCw, Filter, Clock, Lock
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

function MetricCard({ label, value, icon: Icon, color, desc }: {
  label: string; value: number | string; icon: React.ElementType; color: string; desc: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card hover:shadow-card-hover feature-card transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      <p className="text-xs font-semibold mt-1.5" style={{ color: 'inherit' }}>{desc}</p>
    </div>
  );
}

function ComplianceContent() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COMPLIANT' | 'REMEDIATION_REQUIRED' | 'ESCALATION_REQUIRED' | 'IMPORT_PROHIBITED'>('ALL');

  useEffect(() => {
    fetchInspections()
      .then(setInspections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const compliantCount   = inspections.filter(i => i.overall_verdict === 'COMPLIANT').length;
  const warningCount     = inspections.filter(i => ['REMEDIATION_REQUIRED', 'WARNINGS_DETECTED'].includes(i.overall_verdict)).length;
  const prohibitedCount  = inspections.filter(i => i.overall_verdict === 'IMPORT_PROHIBITED').length;
  const escalationCount  = inspections.filter(i => i.overall_verdict === 'ESCALATION_REQUIRED').length;

  const filteredByVerdict = filter === 'ALL' ? inspections :
    inspections.filter(i => i.overall_verdict === filter || (filter === 'REMEDIATION_REQUIRED' && i.overall_verdict === 'WARNINGS_DETECTED'));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 radial-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Compliance Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-border regulatory health across all destination markets</p>
        </div>
        <Link href="/audit/new" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-blue transition-colors text-sm">
          <Plus className="w-4 h-4" /> Run New Audit
        </Link>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-card feature-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Fully Compliant</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{loading ? '—' : compliantCount}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Ready for cross-border listing</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-card feature-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Remediation Needed</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{loading ? '—' : warningCount}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">Fix copy/labels before import</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-card feature-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Prohibited</span>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{loading ? '—' : prohibitedCount}</p>
          <p className="text-xs text-rose-600 font-semibold mt-1">Blocked by destination rules</p>
        </div>
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-card feature-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Escalated</span>
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{loading ? '—' : escalationCount}</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1">Requires human expert review</p>
        </div>
      </div>

      {/* Market Coverage Cards */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card p-6">
        <h2 className="font-black text-slate-800 mb-4">Market Coverage Summary</h2>
        <div className="grid sm:grid-cols-5 gap-4">
          {[
            { code: 'US', name: 'United States', flag: '🇺🇸' },
            { code: 'EU', name: 'European Union', flag: '🇪🇺' },
            { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
            { code: 'CA', name: 'Canada',          flag: '🇨🇦' },
            { code: 'JP', name: 'Japan',            flag: '🇯🇵' },
          ].map(m => {
            const count = inspections.filter(i => (i.destination_markets || []).includes(m.code)).length;
            const compliantInMarket = inspections.filter(i =>
              (i.destination_markets || []).includes(m.code) && i.overall_verdict === 'COMPLIANT'
            ).length;
            const pct = count > 0 ? Math.round((compliantInMarket / count) * 100) : 0;
            return (
              <div key={m.code} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center hover:border-primary-200 transition-colors feature-card">
                <span className="text-3xl block mb-1.5">{m.flag}</span>
                <p className="font-black text-slate-800 text-sm">{m.code}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{m.name}</p>
                <span className="inline-block mt-2 text-xs font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-full text-primary-700">
                  {count} Audits
                </span>
                {count > 0 && (
                  <div className="mt-2">
                    <div className="readiness-bar mx-auto max-w-[60px]">
                      <div className={`readiness-bar-fill ${pct === 100 ? 'bg-emerald-500' : pct > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 mt-1">{pct}% pass rate</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Table with Filter */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-50">
          <h2 className="font-black text-slate-800">All Compliance Inspections</h2>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'COMPLIANT', label: '✓ Compliant' },
              { key: 'REMEDIATION_REQUIRED', label: '⚠ Remediation' },
              { key: 'ESCALATION_REQUIRED', label: '◉ Escalation' },
              { key: 'IMPORT_PROHIBITED', label: '✕ Prohibited' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  filter === f.key ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-200 text-slate-600 hover:border-primary-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 shimmer" />)}
          </div>
        )}

        {!loading && filteredByVerdict.length === 0 && (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-600">No audits match this filter</p>
            <p className="text-sm text-slate-400 mt-1">Try a different filter or run a new compliance audit.</p>
            <Link href="/audit/new" className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" /> New Audit
            </Link>
          </div>
        )}

        {!loading && filteredByVerdict.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Product', 'Markets', 'Verdict', 'Hash (6-char)', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredByVerdict.map(ins => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 truncate max-w-[180px]">{ins.listing_id?.slice(0, 24) || 'Product Audit'}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ins.id?.slice(0, 14)}…</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {(ins.destination_markets || []).slice(0, 5).map((m: string) => (
                          <span key={m} className="text-base" title={m}>{MARKET_FLAGS[m] || '🌐'}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4"><VerdictBadge verdict={ins.overall_verdict} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-500" />
                        <span className="font-mono text-[11px] text-slate-400">{ins.compliance_hash?.slice(0, 8) || '—'}…</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {ins.timestamp_utc ? new Date(ins.timestamp_utc).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href="/audit/new" className="text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl transition-colors">
                        Re-Audit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <AppShell>
      <ComplianceContent />
    </AppShell>
  );
}
