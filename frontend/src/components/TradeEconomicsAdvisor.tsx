'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Award, CheckCircle2, XCircle, AlertTriangle,
  HelpCircle, Globe, ShieldCheck, ShieldAlert, Filter, ShoppingBag,
  ExternalLink, ArrowUpRight, Store, DollarSign, Zap
} from 'lucide-react';
import { TradeEconomicsItem, AuditResponse, ComplianceCheckResult } from '../lib/types';

interface TradeEconomicsAdvisorProps {
  economics: TradeEconomicsItem[];
  auditData?: AuditResponse | null;
}

const MARKET_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  UK: '🇬🇧',
  CA: '🇨🇦',
  JP: '🇯🇵',
  AU: '🇦🇺',
  IN: '🇮🇳',
  DE: '🇩🇪',
  CN: '🇨🇳',
  VN: '🇻🇳',
};

const MARKETPLACE_CHANNELS: Record<string, string[]> = {
  US: ['Amazon.com (FBA / FBM)', 'Shopify Markets', 'Walmart.com', 'eBay US'],
  EU: ['Amazon EU (IOSS)', 'Shopify EU', 'Zalando', 'OTTO'],
  UK: ['Amazon UK (HMRC LVCS)', 'Shopify UK', 'eBay UK'],
  CA: ['Amazon.ca (CARM)', 'Shopify CA'],
  JP: ['Amazon Japan (PMDA)', 'Rakuten Ichiba', 'Yahoo! Shopping'],
  AU: ['Amazon.com.au (LVIG GST)', 'eBay AU', 'Shopify AU'],
  IN: ['Amazon.in (ICEGATE / BIS)', 'Flipkart', 'Shopify IN'],
  DE: ['Amazon.de (VerpackG)', 'OTTO Germany', 'Kaufland'],
  CN: ['Tmall Global (CBEC)', 'JD Worldwide', 'Kaola'],
  VN: ['Shopee Vietnam (VNACCS)', 'Lazada VN', 'Tiki'],
};

export default function TradeEconomicsAdvisor({ economics, auditData }: TradeEconomicsAdvisorProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'APPROVED' | 'CONDITIONAL' | 'BLOCKED'>('ALL');

  if (!economics || economics.length === 0) return null;

  // Calculate rule clearance status for each market
  const marketsWithCompliance = useMemo(() => {
    const summary = auditData?.summary_by_country || {};
    const matrix = auditData?.matrix || {};

    return economics.map((item) => {
      const counts = summary[item.country_code] || { pass: 0, warning: 0, violation: 0, escalation: 0 };
      const checks: ComplianceCheckResult[] = matrix[item.country_code] || [];

      let saleStatus: 'APPROVED' | 'CONDITIONAL' | 'BLOCKED' = 'APPROVED';
      let saleStatusLabel = 'Approved to Sell (Rules Satisfied)';
      let saleStatusBadgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      let saleStatusDesc = 'All statutory compliance thresholds, claim screenings, and mandatory disclosures are cleared.';
      let primaryBlockingIssue: string | null = null;

      if (counts.violation > 0) {
        saleStatus = 'BLOCKED';
        saleStatusLabel = 'Sale Blocked (Statutory Violation)';
        saleStatusBadgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
        const failCheck = checks.find((c) => c.status === 'violation');
        primaryBlockingIssue = failCheck ? `${failCheck.rule_citation}: ${failCheck.extracted_value}` : 'Statutory violation detected under local market regulations.';
        saleStatusDesc = `Cannot be legally distributed: ${primaryBlockingIssue}`;
      } else if (counts.escalation > 0) {
        saleStatus = 'CONDITIONAL';
        saleStatusLabel = 'Escalation Required (Lab Certs)';
        saleStatusBadgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/40';
        const escCheck = checks.find((c) => c.status === 'escalation');
        primaryBlockingIssue = escCheck ? `${escCheck.rule_citation}: ${escCheck.extracted_value}` : 'High-risk product category requires accredited 3rd-party laboratory certification.';
        saleStatusDesc = `Requires verified test certificates before active marketplace fulfillment: ${primaryBlockingIssue}`;
      } else if (counts.warning > 0) {
        saleStatus = 'CONDITIONAL';
        saleStatusLabel = 'Conditional Sale (Remediation Needed)';
        saleStatusBadgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
        const warnCheck = checks.find((c) => c.status === 'warning');
        primaryBlockingIssue = warnCheck ? `${warnCheck.rule_citation}: ${warnCheck.extracted_value}` : 'Packaging or claim wording warnings present.';
        saleStatusDesc = `Permitted with caution: ${primaryBlockingIssue}`;
      }

      return {
        ...item,
        counts,
        saleStatus,
        saleStatusLabel,
        saleStatusBadgeClass,
        saleStatusDesc,
        primaryBlockingIssue,
        channels: MARKETPLACE_CHANNELS[item.country_code] || ['Amazon Global Selling', 'Shopify Markets'],
      };
    });
  }, [economics, auditData]);

  // Filtered market list
  const filteredMarkets = useMemo(() => {
    if (filterMode === 'ALL') return marketsWithCompliance;
    return marketsWithCompliance.filter((m) => m.saleStatus === filterMode);
  }, [marketsWithCompliance, filterMode]);

  const approvedCount = marketsWithCompliance.filter((m) => m.saleStatus === 'APPROVED').length;
  const blockedCount = marketsWithCompliance.filter((m) => m.saleStatus === 'BLOCKED').length;
  const conditionalCount = marketsWithCompliance.filter((m) => m.saleStatus === 'CONDITIONAL').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* ── Header & Market Sale Feasibility Verdict ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Marketplace Sale Feasibility &amp; Trade Economics Advisor
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              RULE-ALIGNED ENTRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Answers: <strong className="text-slate-200">"Where can this product legally be sold using our rules?"</strong> Combines deterministic compliance clearance status with de minimis thresholds, VAT/GST schemes, and channel profitability.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filterMode === 'ALL'
                ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Markets ({marketsWithCompliance.length})
          </button>
          <button
            onClick={() => setFilterMode('APPROVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterMode === 'APPROVED'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                : 'bg-slate-950 text-emerald-400 border-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Permitted to Sell ({approvedCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('BLOCKED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterMode === 'BLOCKED'
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                : 'bg-slate-950 text-rose-400 border-slate-800 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Blocked by Rules ({blockedCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('CONDITIONAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterMode === 'CONDITIONAL'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                : 'bg-slate-950 text-amber-400 border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Action Required ({conditionalCount})</span>
          </button>
        </div>
      </div>

      {/* ── Global Sales Feasibility Summary Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-white">Approved For Sale</div>
              <div className="text-[10px] text-slate-400">Zero rule violations detected</div>
            </div>
          </div>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">{approvedCount} / {marketsWithCompliance.length}</span>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <XCircle className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-xs font-bold text-white">Blocked / Prohibited</div>
              <div className="text-[10px] text-slate-400">Border detention / criminal bans</div>
            </div>
          </div>
          <span className="text-xl font-extrabold text-rose-400 font-mono">{blockedCount} / {marketsWithCompliance.length}</span>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">Conditional Entry</div>
              <div className="text-[10px] text-slate-400">Requires lab certs or labeling edits</div>
            </div>
          </div>
          <span className="text-xl font-extrabold text-amber-400 font-mono">{conditionalCount} / {marketsWithCompliance.length}</span>
        </div>
      </div>

      {/* ── Ranked Market Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMarkets.map((item) => {
          const isTop1 = item.entry_friction_rank === 1 && item.saleStatus === 'APPROVED';
          const isBlocked = item.saleStatus === 'BLOCKED';

          return (
            <div
              key={item.country_code}
              className={`p-4 rounded-xl border relative transition-all flex flex-col justify-between space-y-3.5 ${
                isBlocked
                  ? 'bg-slate-950/80 border-rose-900/60 hover:border-rose-700/80 shadow-md'
                  : isTop1
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-900/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Top: Country Flag, Name, and Sale Status Badge */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{MARKET_FLAGS[item.country_code] || '🌐'}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{item.country_name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {item.country_code}
                        </span>
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">Rank #{item.entry_friction_rank} Entry Friction</span>
                    </div>
                  </div>

                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${item.saleStatusBadgeClass}`}>
                    {item.saleStatus === 'APPROVED' && 'APPROVED'}
                    {item.saleStatus === 'BLOCKED' && 'BLOCKED'}
                    {item.saleStatus === 'CONDITIONAL' && 'ACTION NEEDED'}
                  </div>
                </div>

                {/* Statutory Sale Feasibility Alert */}
                <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                  isBlocked
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : item.saleStatus === 'CONDITIONAL'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="flex items-start gap-1.5">
                    {isBlocked ? (
                      <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-rose-400" />
                    ) : item.saleStatus === 'CONDITIONAL' ? (
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                    )}
                    <div>
                      <strong className="block text-[11px] font-bold">{item.saleStatusLabel}</strong>
                      <span className="text-[11px] opacity-90">{item.saleStatusDesc}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* De Minimis & Tax Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">De Minimis Threshold:</span>
                  <span className="font-mono font-bold text-slate-200 text-xs">
                    {item.de_minimis_threshold} {item.de_minimis_currency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Customs Complexity:</span>
                  <span className={`font-mono font-bold text-xs ${
                    item.customs_complexity_score <= 3
                      ? 'text-emerald-400'
                      : item.customs_complexity_score <= 6
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {item.customs_complexity_score}/10 {item.customs_complexity_score <= 3 ? '(Low)' : (item.customs_complexity_score <= 6 ? '(Moderate)' : '(High)')}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-semibold block">Fiscal Simplification Scheme:</span>
                  <span className="text-[11px] text-sky-300 font-medium">
                    {item.simplification_scheme}
                  </span>
                </div>
              </div>

              {/* Active Sales Channels */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Store className="w-3 h-3 text-sky-400" /> Compatible E-Commerce Channels:
                </span>
                <div className="flex flex-wrap gap-1">
                  {item.channels.map((ch, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                        isBlocked
                          ? 'bg-slate-900 text-slate-500 border-slate-800 line-through'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strategic Recommendation */}
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {item.recommendation_summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}