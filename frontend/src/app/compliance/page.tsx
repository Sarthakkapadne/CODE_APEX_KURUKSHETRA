'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Plus, CheckCircle2, AlertTriangle, XCircle,
  ShieldAlert, Globe, ArrowRight, RefreshCw, Filter, Clock, Lock,
  FileText, ExternalLink, ChevronRight, Layers, Eye
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import ComplianceMatrix from '../../components/ComplianceMatrix';
import { fetchInspections, fetchInspectionById } from '../../lib/api';
import type { ComplianceCheckResult } from '../../lib/types';

const MARKET_FLAGS: Record<string, string> = { 
  US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵',
  AU: '🇦🇺', IN: '🇮🇳', DE: '🇩🇪', CN: '🇨🇳', VN: '🇻🇳', SG: '🇸🇬', BR: '🇧🇷'
};

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

export default function CompliancePage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'COMPLIANT' | 'REMEDIATION_REQUIRED' | 'ESCALATION_REQUIRED' | 'IMPORT_PROHIBITED'>('ALL');

  useEffect(() => {
    fetchInspections()
      .then(data => {
        setInspections(data);
        if (data && data.length > 0) {
          setSelectedInspectionId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch full details when selected inspection changes
  useEffect(() => {
    if (!selectedInspectionId) return;
    setLoadingDetail(true);
    fetchInspectionById(selectedInspectionId)
      .then(d => setSelectedDetail(d))
      .catch(e => console.warn('Could not fetch inspection detail:', e))
      .finally(() => setLoadingDetail(false));
  }, [selectedInspectionId]);

  const compliantCount   = inspections.filter(i => i.overall_verdict === 'COMPLIANT').length;
  const warningCount     = inspections.filter(i => ['REMEDIATION_REQUIRED', 'WARNINGS_DETECTED'].includes(i.overall_verdict)).length;
  const prohibitedCount  = inspections.filter(i => i.overall_verdict === 'IMPORT_PROHIBITED').length;
  const escalationCount  = inspections.filter(i => i.overall_verdict === 'ESCALATION_REQUIRED').length;

  const filteredByVerdict = filter === 'ALL' ? inspections :
    inspections.filter(i => i.overall_verdict === filter || (filter === 'REMEDIATION_REQUIRED' && i.overall_verdict === 'WARNINGS_DETECTED'));

  // Build matrix dictionary from selected inspection check results
  const matrix: Record<string, ComplianceCheckResult[]> = {};
  const destinationMarkets: string[] = selectedDetail?.destination_markets || selectedDetail?.listing?.destination_markets || ['US', 'EU', 'UK', 'CA', 'JP'];

  if (selectedDetail?.results) {
    selectedDetail.results.forEach((r: any) => {
      const c = r.country_code || 'US';
      if (!matrix[c]) matrix[c] = [];
      matrix[c].push(r);
    });
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" /> 6-Category x 11-Market Compliance Matrix
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-primary-600" /> Multi-Market Compliance Engine
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Simultaneous statutory evaluation across product classification, claims wording, banned ingredients, mandatory labeling, certifications, and hazmat.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/audit/new"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-blue transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Run New Audit
            </Link>
          </div>
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

        {/* ── Active Inspection Compliance Matrix Section ── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Simultaneous Regulatory Check Matrix
              </h2>
              {selectedDetail && (
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Audit: {selectedDetail.id}
                </span>
              )}
            </div>

            {selectedDetail && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Product:</span>
                <strong className="text-slate-800 truncate max-w-xs">
                  {selectedDetail.listing?.title || selectedDetail.listing_id}
                </strong>
                <VerdictBadge verdict={selectedDetail.overall_verdict} />
              </div>
            )}
          </div>

          {/* Render Full 6x11 Matrix */}
          <div className="w-full">
            <ComplianceMatrix
              auditData={selectedDetail}
              matrix={Object.keys(matrix).length > 0 ? matrix : undefined}
              destinationMarkets={destinationMarkets}
            />
          </div>
        </div>

        {/* All Compliance Inspections Table */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-card overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Select Inspection Record to Inspect</h3>
              <p className="text-xs text-slate-400">Click any inspection to view its complete 6-category statutory matrix</p>
            </div>
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
                    filter === f.key ? 'bg-primary-600 border-primary-600 text-white shadow-2xs' : 'border-slate-200 text-slate-600 hover:border-primary-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Inspection ID</th>
                  <th className="px-6 py-3">Listing Title</th>
                  <th className="px-6 py-3">Target Markets</th>
                  <th className="px-6 py-3">Overall Verdict</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Loading compliance inspection records...
                    </td>
                  </tr>
                ) : filteredByVerdict.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No inspections matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredByVerdict.map(i => {
                    const isSelected = selectedInspectionId === i.id;
                    return (
                      <tr
                        key={i.id}
                        onClick={() => setSelectedInspectionId(i.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-6 py-3.5 font-mono text-primary-700">
                          {i.id}
                        </td>
                        <td className="px-6 py-3.5 max-w-xs truncate text-slate-800 font-medium">
                          {i.listing_id}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(i.destination_markets || []).map((m: string) => (
                              <span key={m} className="text-sm" title={m}>
                                {MARKET_FLAGS[m] || '🌐'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <VerdictBadge verdict={i.overall_verdict} />
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                          {i.timestamp_utc?.slice(0, 16).replace('T', ' ')}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInspectionId(i.id);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-primary-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'Viewing Matrix' : 'View Matrix'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
