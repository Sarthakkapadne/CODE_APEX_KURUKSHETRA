'use client';
import React, { useState, useEffect } from 'react';
import { Download, FileText, Lock, Clock, Search, Plus, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { fetchInspections, downloadPdfReport } from '../../lib/api';
import Link from 'next/link';

const MARKET_FLAGS: Record<string, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵' };

function VerdictIcon({ verdict }: { verdict: string }) {
  const v = verdict?.toUpperCase() || '';
  if (v === 'COMPLIANT') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (v === 'IMPORT_PROHIBITED') return <XCircle className="w-4 h-4 text-red-600" />;
  return <AlertTriangle className="w-4 h-4 text-amber-600" />;
}

function ReportsContent() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState<any | null>(null);

  useEffect(() => {
    fetchInspections()
      .then(setInspections)
      .catch(() => setError('Could not load reports. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(ins: any) {
    setDownloading(ins.id);
    try {
      // We don't have full AuditResponse here, just inspection metadata
      // Call report endpoint with inspection data
      const res = await fetch(`http://127.0.0.1:8000/reports/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ins),
      });
      if (!res.ok) throw new Error('PDF failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `LexPort_${ins.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('PDF generation failed. The backend report endpoint may require a full audit object.');
    } finally {
      setDownloading(null);
    }
  }

  const filtered = inspections.filter(i =>
    !search || i.id?.toLowerCase().includes(search.toLowerCase()) ||
    i.listing_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Compliance Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Download tamper-evident PDF dossiers for your audit history</p>
        </div>
        <Link href="/audit/new" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-blue transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Audit
        </Link>
      </div>

      {/* Report Format Info */}
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: 'Cover Page', desc: 'Product, seller, SHA-256 seal' },
          { icon: Lock, label: 'Hash Chain', desc: 'Tamper-evident audit trail' },
          { icon: CheckCircle2, label: 'Country Analysis', desc: 'Per-market compliance table' },
          { icon: FileText, label: 'Remediation Roadmap', desc: 'Fix plan & missing docs' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-card text-center">
              <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-primary-600" />
              </div>
              <p className="font-semibold text-sm text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-card max-w-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search reports…"
          className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none flex-1"
        />
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Audit History</h2>
        </div>

        {loading && (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 shimmer rounded-xl" />)}
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{error}</p>
            <Link href="/audit/new" className="text-sm text-primary-600 font-semibold mt-2 inline-block">Run an audit first →</Link>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">No reports yet</p>
            <p className="text-sm text-slate-400 mt-1">Your generated compliance dossiers will appear here.</p>
            <Link href="/audit/new" className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" /> Run First Audit
            </Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Audit ID', 'Markets', 'Verdict', 'Date', 'Hash (SHA-256)', 'Download'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(ins => (
                  <tr key={ins.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-semibold text-slate-700 text-xs">{ins.id?.slice(0, 16)}…</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {(ins.destination_markets || []).map((m: string) => (
                          <span key={m} className="text-base" title={m}>{MARKET_FLAGS[m] || '🌐'}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <VerdictIcon verdict={ins.overall_verdict} />
                        <span className="text-xs font-semibold text-slate-700">{(ins.overall_verdict || '').replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {ins.timestamp_utc ? new Date(ins.timestamp_utc).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-green-600" />
                        <span className="font-mono text-xs text-slate-400">{ins.compliance_hash?.slice(0, 16)}…</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownload(ins)}
                        disabled={downloading === ins.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloading === ins.id ? 'Generating…' : 'Export PDF'}
                      </button>
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

export default function ReportsPage() {
  return (
    <AppShell>
      <ReportsContent />
    </AppShell>
  );
}
