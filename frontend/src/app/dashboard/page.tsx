'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, TrendingUp, ShieldCheck, AlertTriangle, Globe,
  FileText, RefreshCw, Eye, BarChart3, Clock, CheckCircle2,
  XCircle, ShieldAlert, ArrowRight, Download, Zap, Scale,
  MessageSquare, Users, BookOpen, TrendingDown
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import { fetchInspections } from '../../lib/api';

const MARKET_FLAGS: Record<string, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵' };

function VerdictBadge({ verdict }: { verdict: string }) {
  const v = verdict?.toUpperCase() || '';
  if (v === 'COMPLIANT') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Compliant
    </span>
  );
  if (v === 'IMPORT_PROHIBITED') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full">
      <XCircle className="w-3 h-3" /> Prohibited
    </span>
  );
  if (v === 'ESCALATION_REQUIRED') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full">
      <ShieldAlert className="w-3 h-3" /> Escalation
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Remediation
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub, trend }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string; trend?: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all feature-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      <div className="flex items-center justify-between mt-1.5">
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
        {trend && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon: Icon, label, desc, color }: {
  href: string; icon: React.ElementType; label: string; desc: string; color: string;
}) {
  return (
    <Link href={href}
      className={`flex items-center gap-4 p-4 rounded-2xl border hover:shadow-card-hover transition-all feature-card ${color}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm">{label}</p>
        <p className="text-xs opacity-70 truncate">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 ml-auto opacity-40 flex-shrink-0" />
    </Link>
  );
}

function GreetingBanner({ name, role }: { name: string; role: string }) {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const roleDesc: Record<string, string> = {
    seller: 'Your compliance workspace is ready.',
    manager: 'You have org-level visibility across all products.',
    exporter: 'Your trade operations dashboard is live.',
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          {greeting}, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">{roleDesc[role] || 'Your compliance workspace'}</p>
      </div>
      <Link
        href="/audit/new"
        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-blue transition-colors text-sm"
      >
        <Plus className="w-4 h-4" /> New Audit
      </Link>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInspections()
      .then(data => setInspections(data))
      .catch(() => setError('Could not load audit history.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:     inspections.length,
    compliant: inspections.filter(i => i.overall_verdict === 'COMPLIANT').length,
    attention: inspections.filter(i => ['REMEDIATION_REQUIRED', 'WARNINGS_DETECTED'].includes(i.overall_verdict)).length,
    escalated: inspections.filter(i => i.overall_verdict === 'ESCALATION_REQUIRED').length,
    countries: Array.from(new Set(inspections.flatMap((i: any) => i.destination_markets || []))).length,
  };

  const quickActions = [
    { href: '/audit/new',         icon: Plus,        label: 'Run New Audit',      desc: 'Check a product across markets',   color: 'border-primary-200 bg-primary-50 text-primary-700' },
    { href: '/hs-classification', icon: Scale,       label: 'HS Code Lookup',     desc: 'Auto classify tariff codes',        color: 'border-blue-200 bg-blue-50 text-blue-700' },
    { href: '/trade',             icon: BarChart3,   label: 'Trade Economics',    desc: 'Compare duty & entry friction',     color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { href: '/reports',           icon: FileText,    label: 'Download Reports',   desc: 'Export compliance dossiers',        color: 'border-slate-200 bg-white text-slate-700' },
    { href: '/chat',              icon: MessageSquare,label: 'AI Copilot',         desc: 'Ask about compliance rules',        color: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
    { href: '/products',          icon: Zap,         label: 'My Products',        desc: 'Manage your product library',       color: 'border-amber-200 bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 radial-bg min-h-screen">
      {/* Greeting */}
      <GreetingBanner name={user?.name || 'there'} role={user?.role || 'seller'} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Audits"     value={loading ? '—' : stats.total}     icon={ShieldCheck}   color="bg-primary-50 text-primary-600" sub="All time" trend={stats.total > 0 ? '+new' : undefined} />
        <StatCard label="Compliant"        value={loading ? '—' : stats.compliant} icon={CheckCircle2}  color="bg-emerald-50 text-emerald-600" sub="Ready to ship" />
        <StatCard label="Needs Attention"  value={loading ? '—' : stats.attention} icon={AlertTriangle} color="bg-amber-50 text-amber-600" sub="Requires action" />
        <StatCard label="Countries"        value={loading ? '—' : stats.countries} icon={Globe}         color="bg-blue-50 text-blue-600" sub="Markets covered" />
      </div>

      {/* Manager-only top stats */}
      {user?.role === 'manager' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Open Escalations" value={loading ? '—' : stats.escalated} icon={ShieldAlert} color="bg-indigo-50 text-indigo-600" sub="Human review needed" />
          <StatCard label="Team Audits"       value={loading ? '—' : stats.total}    icon={Users}       color="bg-slate-50 text-slate-600" sub="Across org" />
          <StatCard label="Rules in Library"  value="47"                              icon={BookOpen}    color="bg-primary-50 text-primary-600" sub="Active rules" />
          <StatCard label="Pending Reviews"   value={loading ? '—' : stats.escalated} icon={Eye}        color="bg-rose-50 text-rose-600" sub="Awaiting approval" />
        </div>
      )}

      {/* Exporter-only market comparison row */}
      {user?.role === 'exporter' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800">Quick Market Readiness</h3>
            <Link href="/trade" className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
              Full Comparison <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-5 gap-3">
            {[
              { code: 'US', flag: '🇺🇸', score: 92, color: 'bg-emerald-500', label: 'Ready' },
              { code: 'EU', flag: '🇪🇺', score: 71, color: 'bg-amber-500',   label: '2 Fixes' },
              { code: 'UK', flag: '🇬🇧', score: 88, color: 'bg-emerald-500', label: 'Ready' },
              { code: 'CA', flag: '🇨🇦', score: 43, color: 'bg-rose-500',    label: 'Docs Missing' },
              { code: 'JP', flag: '🇯🇵', score: 60, color: 'bg-indigo-500',  label: 'Review' },
            ].map(m => (
              <div key={m.code} className="text-center space-y-2">
                <span className="text-2xl">{m.flag}</span>
                <div className="readiness-bar mx-auto max-w-[80px]">
                  <div className={`readiness-bar-fill ${m.color}`} style={{ width: `${m.score}%` }} />
                </div>
                <p className="text-[10px] font-black text-slate-700">{m.score}%</p>
                <p className="text-[9px] text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions
            .filter((_, i) => user?.role === 'manager' || i !== 5 || user?.role === 'seller')
            .slice(0, 6)
            .map(a => (
              <QuickActionCard key={a.href} {...a} />
            ))}
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div>
            <h2 className="font-black text-slate-800">Recent Audits</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest compliance inspections</p>
          </div>
          <Link href="/compliance" className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading && (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 shimmer" />)}
          </div>
        )}

        {!loading && !error && inspections.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-primary-300" />
            </div>
            <p className="font-bold text-slate-600">No audits yet</p>
            <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
              Run your first compliance check to see how your product performs across international markets.
            </p>
            <Link href="/audit/new" className="mt-5 inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow-blue">
              <Plus className="w-4 h-4" /> Start New Audit
            </Link>
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{error}</p>
            <Link href="/audit/new" className="text-sm text-primary-600 font-bold mt-2 inline-block">Run your first audit →</Link>
          </div>
        )}

        {!loading && !error && inspections.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Product', 'Markets', 'Status', 'Last Checked', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inspections.slice(0, 8).map(ins => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 truncate max-w-[180px]">
                        {ins.listing_id?.slice(0, 26) || 'Product Audit'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ins.id?.slice(0, 14)}…</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {(ins.destination_markets || []).slice(0, 5).map((m: string) => (
                          <span key={m} className="text-base" title={m}>{MARKET_FLAGS[m] || '🌐'}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <VerdictBadge verdict={ins.overall_verdict} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {ins.timestamp_utc ? new Date(ins.timestamp_utc).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href="/audit/new" className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href="/audit/new" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Re-audit">
                          <RefreshCw className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manager: Escalations + Rules */}
      {user?.role === 'manager' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800">Open Escalations</h3>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                {stats.escalated} pending
              </span>
            </div>
            <div className="space-y-2">
              {inspections.filter(i => i.overall_verdict === 'ESCALATION_REQUIRED').slice(0, 3).map(i => (
                <div key={i.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-700 font-semibold truncate">{i.listing_id?.slice(0, 20) || 'Audit'}…</p>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Review</span>
                </div>
              ))}
              {stats.escalated === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No open escalations</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
            <h3 className="font-black text-slate-800 mb-4">Compliance Tools</h3>
            <div className="space-y-2">
              {[
                { href: '/rules',    icon: BookOpen,   label: 'Rules Library',      desc: 'Browse & manage active regulations' },
                { href: '/audit/new', icon: Zap,        label: 'Regulatory Simulator', desc: 'Simulate rule changes & impact' },
                { href: '/compliance',icon: ShieldCheck, label: 'Compliance Overview', desc: 'Org-wide audit health' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.href} href={a.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50/60 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{a.label}</p>
                      <p className="text-[10px] text-slate-400">{a.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto group-hover:text-primary-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Exporter: Trade panel */}
      {user?.role === 'exporter' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800">Market Entry Comparison</h3>
            <Link href="/trade" className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
              Open Trade Advisor <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-sm text-slate-500 mb-4">Compare duty rates, de-minimis thresholds, and entry friction across markets.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Lowest Duty',        icon: TrendingDown, value: 'US · 0%',    color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Best De-minimis',    icon: TrendingUp,   value: 'US · $800',  color: 'text-primary-600 bg-primary-50' },
              { label: 'Easiest Entry',      icon: Globe,        value: 'US / UK',    color: 'text-blue-600 bg-blue-50' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`rounded-xl p-3.5 border border-slate-100 ${s.color.split(' ')[1]}`}>
                  <div className={`w-6 h-6 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                  <p className="font-black text-slate-800 text-sm mt-0.5">{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
