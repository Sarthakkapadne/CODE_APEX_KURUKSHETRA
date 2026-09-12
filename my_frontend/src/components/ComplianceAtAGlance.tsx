'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, ArrowRight, HelpCircle, ShieldCheck } from 'lucide-react';
import { AuditResponse } from '../lib/types';

interface ComplianceAtAGlanceProps {
  auditData: AuditResponse;
  onResolveClick?: () => void;
  onWhatDoINeedClick?: () => void;
}

const MARKET_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  UK: '🇬🇧',
  CA: '🇨🇦',
  JP: '🇯🇵',
};

const MARKET_NAMES: Record<string, string> = {
  US: 'US',
  EU: 'EU',
  UK: 'UK',
  CA: 'Canada',
  JP: 'Japan',
};

export default function ComplianceAtAGlance({
  auditData,
  onResolveClick,
  onWhatDoINeedClick,
}: ComplianceAtAGlanceProps) {
  const summary = auditData.summary_by_country || {};
  const markets = auditData.destination_markets || ['US', 'EU', 'UK', 'CA', 'JP'];

  // Calculate totals
  let totalWarnings = 0;
  let totalViolations = 0;
  let totalEscalations = 0;

  Object.values(summary).forEach((s: any) => {
    totalWarnings += s.warning || 0;
    totalViolations += s.violation || 0;
    totalEscalations += s.escalation || 0;
  });

  const overallVerdict = auditData.overall_verdict || 'REMEDIATION_REQUIRED';

  const getVerdictInfo = (v: string) => {
    switch (v) {
      case 'COMPLIANT':
        return { label: 'COMPLIANT', color: 'bg-emerald-500 text-white', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'IMPORT_PROHIBITED':
        return { label: 'IMPORT PROHIBITED', color: 'bg-rose-600 text-white', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'ESCALATION_REQUIRED':
        return { label: 'ESCALATION REQUIRED', color: 'bg-indigo-600 text-white', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: 'NEEDS REMEDIATION', color: 'bg-amber-500 text-white', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const verdictInfo = getVerdictInfo(overallVerdict);

  const getMarketStatus = (code: string) => {
    const s = summary[code] || { pass: 0, warning: 0, violation: 0, escalation: 0 };
    if (s.violation > 0) return { label: 'DOCUMENT MISSING / FAIL', badge: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
    if (s.escalation > 0) return { label: 'HUMAN REVIEW', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ShieldAlert };
    if (s.warning > 0) return { label: `${s.warning} FIX${s.warning > 1 ? 'ES' : ''}`, badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
    return { label: 'READY', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 shadow-card hover:shadow-card-hover transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
              Signature Overview
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {auditData.inspection_id}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">COMPLIANCE AT A GLANCE</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Product: <strong className="text-slate-800 font-bold">{auditData.listing_id || 'Scanned Product'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-2xl text-xs font-black border shadow-2xs ${verdictInfo.badge}`}>
            {verdictInfo.label}
          </span>
          {onWhatDoINeedClick && (
            <button
              onClick={onWhatDoINeedClick}
              className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-primary-200/80 transition-colors shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 text-primary-600" />
              What do I need to sell this?
            </button>
          )}
        </div>
      </div>

      {/* Markets Breakdown Grid */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Market Compliance Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {markets.map(code => {
            const st = getMarketStatus(code);
            const Icon = st.icon;
            return (
              <div key={code} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 hover:bg-white hover:shadow-card transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{MARKET_FLAGS[code] || '🌐'}</span>
                  <span className="text-xs font-black text-slate-800">{MARKET_NAMES[code] || code}</span>
                </div>
                <div className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold border ${st.badge}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issues Summary & Call-to-action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            {totalWarnings + totalViolations} Issues Detected
          </span>
          <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            {totalViolations > 0 ? `${totalViolations} Missing Cert/Doc` : '0 Missing Certs'}
          </span>
          {totalEscalations > 0 && (
            <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              {totalEscalations} Human Review Required
            </span>
          )}
        </div>

        {onResolveClick && (
          <button
            onClick={onResolveClick}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-blue transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Resolve Issues & View Fixes
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
