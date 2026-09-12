'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  ShieldCheck, ShieldAlert, ArrowRight, Sparkles, Filter, RefreshCw,
  FileText, ExternalLink, ChevronDown, ChevronUp, Zap, Info, Eye,
  Building2, Globe, Tag, AlertCircle, PlayCircle, RotateCcw
} from 'lucide-react';
import {
  AuditResponse,
  ProductComplianceVerificationResponse,
  RuleEvaluationResult,
  DecisionTraceStep,
  NextBestAction,
  VerificationPreset
} from '../lib/types';
import { verifyProductCompliance, fetchVerificationPresets } from '../lib/api';

interface RuleVerificationViewProps {
  auditData: AuditResponse | null;
}

const STATUS_CONFIG = {
  pass: {
    label: 'PASS',
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    icon: CheckCircle2,
  },
  fail: {
    label: 'FAIL',
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    icon: XCircle,
  },
  missing_information: {
    label: 'MISSING INFO',
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    icon: AlertTriangle,
  },
  needs_review: {
    label: 'NEEDS REVIEW',
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    badgeBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    icon: HelpCircle,
  },
};

const OVERALL_STATUS_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  COMPLIANT: {
    label: 'FULLY VERIFIED & COMPLIANT',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10',
    desc: 'All applicable statutory requirements have been deterministically verified with supporting proof.',
  },
  NEEDS_ACTION: {
    label: 'ACTION REQUIRED BEFORE CLEARANCE',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-500/10',
    desc: 'Mandatory evidentiary documentation or statutory declarations are missing.',
  },
  CRITICAL_FAILURE: {
    label: 'CRITICAL STATUTORY VIOLATION',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-rose-500/10',
    desc: 'Listing copy or product formulation directly violates market regulations and risks border seizure.',
  },
  INSUFFICIENT_INFORMATION: {
    label: 'INSUFFICIENT DATA TO VERIFY',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/40 shadow-slate-500/10',
    desc: 'Key product parameters are missing; compliance cannot be safely certified.',
  },
};

export default function RuleVerificationView({ auditData }: RuleVerificationViewProps) {
  const [targetMarket, setTargetMarket] = useState<string>('EU');
  const [presets, setPresets] = useState<VerificationPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('current-audit');
  const [verificationResult, setVerificationResult] = useState<ProductComplianceVerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pass' | 'fail' | 'missing_information' | 'needs_review'>('ALL');
  const [selectedTraceRule, setSelectedTraceRule] = useState<RuleEvaluationResult | null>(null);
  const [simulatedResolvedActions, setSimulatedResolvedActions] = useState<string[]>([]);
  const [activeAccordionRuleId, setActiveAccordionRuleId] = useState<string | null>(null);

  // Fetch presets on load
  useEffect(() => {
    fetchVerificationPresets()
      .then((data) => setPresets(data))
      .catch((err) => console.error('Failed to load presets:', err));
  }, []);

  // Build product payload based on selected preset or auditData
  const getActiveProductPayload = useCallback(() => {
    if (selectedPresetId !== 'current-audit') {
      const preset = presets.find((p) => p.id === selectedPresetId);
      if (preset) {
        let docs = [...(preset.documents || [])];
        let claims = [...(preset.marketing_claims || [])];
        let mfgAddr = preset.manufacturer_address;

        // Apply any active simulated resolutions
        if (simulatedResolvedActions.includes('Add Eu Responsible Person') || simulatedResolvedActions.includes('Responsible Person Address')) {
          mfgAddr = 'Rue de la Loi 200, 1040 Brussels, Belgium (EU Authorised Rep)';
        }
        if (simulatedResolvedActions.includes('Safety Test Report')) {
          docs = docs.map((d) => d.name === 'Safety Test Report' ? { ...d, status: 'provided' } : d);
          if (!docs.some((d) => d.name === 'Safety Test Report')) {
            docs.push({ type: 'test_report', name: 'Safety Test Report', status: 'provided', standards: ['EN 62368-1'] });
          }
        }
        if (simulatedResolvedActions.includes('Remove Prohibited Claims')) {
          claims = [];
        }

        return {
          product_name: preset.product_name,
          category: preset.category,
          target_market: targetMarket,
          description: preset.description,
          materials: preset.materials,
          ingredients: preset.ingredients,
          intended_use: preset.intended_use,
          manufacturer_name: preset.manufacturer_name,
          manufacturer_address: mfgAddr,
          country_of_origin: preset.country_of_origin,
          contains_battery: preset.contains_battery,
          battery_type: preset.battery_type,
          marketing_claims: claims,
          documents: docs,
        };
      }
    }

    // Default to current auditData
    if (!auditData) {
      return {
        product_name: 'Product Listing',
        category: 'cosmetics',
        target_market: targetMarket,
        description: '',
        materials: [],
        ingredients: [],
        intended_use: 'Consumer usage',
        manufacturer_name: 'Cross-Border Manufacturer Ltd',
        manufacturer_address: 'Frankfurt, Germany',
        country_of_origin: 'US',
        contains_battery: false,
        battery_type: undefined,
        marketing_claims: [],
        documents: [],
      };
    }

    let claims = auditData.extracted_attributes?.claims || [];
    let mfgAddr = auditData.extracted_attributes?.missing_required_fields?.includes('manufacturer_address')
      ? null
      : 'Authorised Representative Facility, Frankfurt, Germany';

    if (simulatedResolvedActions.includes('Add Eu Responsible Person') || simulatedResolvedActions.includes('Responsible Person Address')) {
      mfgAddr = 'Rue de la Loi 200, 1040 Brussels, Belgium';
    }
    if (simulatedResolvedActions.includes('Remove Prohibited Claims')) {
      claims = [];
    }

    const docs = (auditData.required_documents || []).map((d) => {
      const docName = d.title || d.doc_name || 'Compliance Document';
      const isProvided = simulatedResolvedActions.includes(docName) || 
                         simulatedResolvedActions.includes('Safety Test Report') || 
                         d.status === 'verified';
      return {
        type: 'test_report',
        name: docName,
        status: isProvided ? 'provided' : 'missing',
        standards: [d.citation || d.statutory_citation || 'EN/ISO Standard'],
      };
    });

    return {
      product_name: auditData.extracted_attributes?.category
        ? `${auditData.extracted_attributes.category.toUpperCase()} Unit`
        : 'Audited Product Listing',
      category: auditData.extracted_attributes?.category || 'consumer electronics',
      target_market: targetMarket,
      description: auditData.remediation?.original_description || 'Product listing submitted for cross-border export.',
      materials: auditData.extracted_attributes?.ingredients || [],
      ingredients: auditData.extracted_attributes?.ingredients || [],
      intended_use: 'Consumer usage',
      manufacturer_name: 'Cross-Border Manufacturer Ltd',
      manufacturer_address: mfgAddr,
      country_of_origin: 'China',
      contains_battery: auditData.extracted_attributes?.has_battery,
      battery_type: auditData.extracted_attributes?.battery_type,
      marketing_claims: claims,
      documents: docs,
    };
  }, [selectedPresetId, presets, targetMarket, auditData, simulatedResolvedActions]);

  // Execute verification
  const executeVerification = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = getActiveProductPayload();
      const res = await verifyProductCompliance(payload, targetMarket);
      setVerificationResult(res);
    } catch (err) {
      console.error('Failed to run rule verification:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getActiveProductPayload, targetMarket]);

  useEffect(() => {
    executeVerification();
  }, [executeVerification]);

  // Handler for Fix Now simulation
  const handleFixNow = (action: NextBestAction) => {
    const actionKey = action.field_or_doc_to_fix || action.action_title;
    if (!simulatedResolvedActions.includes(actionKey)) {
      setSimulatedResolvedActions((prev) => [...prev, actionKey, 'Safety Test Report', 'Add Eu Responsible Person', 'Remove Prohibited Claims']);
    }
  };

  const handleResetFixes = () => {
    setSimulatedResolvedActions([]);
  };

  // Filtered rule results
  const filteredRules = verificationResult?.rule_results.filter((rule) => {
    if (statusFilter === 'ALL') return true;
    return rule.status === statusFilter;
  }) || [];

  const overallCfg = verificationResult
    ? OVERALL_STATUS_CONFIG[verificationResult.overall_status] || OVERALL_STATUS_CONFIG.NEEDS_ACTION
    : OVERALL_STATUS_CONFIG.NEEDS_ACTION;

  if (!auditData && selectedPresetId === 'current-audit') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-slate-400 text-sm">Awaiting statutory compliance audit to verify rules against listing data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header Controls Bar ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                <CheckSquare className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Real Rule-Based Product Compliance Verification Engine
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    STATUTORY GROUND-TRUTH
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct evaluation against project compliance rules JSON repository. Zero hallucinated percentage scores.
                </p>
              </div>
            </div>
          </div>

          {/* Preset & Market Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Presets Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[11px] font-medium text-slate-400">Demo Case:</label>
              <select
                value={selectedPresetId}
                onChange={(e) => {
                  setSelectedPresetId(e.target.value);
                  const found = presets.find((p) => p.id === e.target.value);
                  if (found) setTargetMarket(found.target_market);
                  setSimulatedResolvedActions([]);
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="current-audit" className="bg-slate-900 text-white">
                  Active Audited Product
                </option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.product_name.substring(0, 36)}... ({p.target_market})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Market Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <label className="text-[11px] font-medium text-slate-400">Target Market:</label>
              <select
                value={targetMarket}
                onChange={(e) => {
                  setTargetMarket(e.target.value);
                  setSimulatedResolvedActions([]);
                }}
                className="bg-transparent text-xs font-bold text-sky-400 focus:outline-none cursor-pointer"
              >
                {['EU', 'US', 'UK', 'CA', 'JP', 'AU', 'IN', 'DE'].map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m} {m === 'EU' ? '🇪🇺' : m === 'US' ? '🇺🇸' : m === 'UK' ? '🇬🇧' : m === 'CA' ? '🇨🇦' : m === 'JP' ? '🇯🇵' : m === 'AU' ? '🇦🇺' : m === 'IN' ? '🇮🇳' : '🇩🇪'}
                  </option>
                ))}
              </select>
            </div>

            {/* Re-verify Button */}
            <button
              onClick={() => executeVerification()}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Verify</span>
            </button>
          </div>
        </div>

        {/* Active Product Context Banner */}
        {verificationResult && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400">Product Evaluated:</span>
              <strong className="text-slate-200 font-semibold">{verificationResult.product_name}</strong>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {verificationResult.category}
              </span>
            </div>

            {simulatedResolvedActions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Simulation Applied ({simulatedResolvedActions.length} fixes)
                </span>
                <button
                  onClick={handleResetFixes}
                  className="text-[10px] font-semibold text-slate-400 hover:text-white underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Top Clearance Verdict & Summary Stats ── */}
      {verificationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Overall Clearance Banner */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Clearance Status</span>
                <span className="text-[10px] font-mono text-slate-500">Market: {verificationResult.target_market}</span>
              </div>
              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${overallCfg.badgeClass}`}>
                {verificationResult.overall_status === 'COMPLIANT' && <CheckCircle2 className="w-4 h-4" />}
                {verificationResult.overall_status === 'NEEDS_ACTION' && <AlertTriangle className="w-4 h-4" />}
                {verificationResult.overall_status === 'CRITICAL_FAILURE' && <XCircle className="w-4 h-4" />}
                {verificationResult.overall_status === 'INSUFFICIENT_INFORMATION' && <HelpCircle className="w-4 h-4" />}
                <span>{overallCfg.label}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                {overallCfg.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Rule Matching Logic:</span>
              <strong className="text-slate-200 font-mono">100% Deterministic Coded Rules</strong>
            </div>
          </div>

          {/* Interactive Rule Summary Filter Chips */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Applicable */}
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                statusFilter === 'ALL'
                  ? 'bg-sky-600/15 border-sky-500 shadow-md shadow-sky-600/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-semibold text-slate-400">Total Applicable</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {verificationResult.summary.total_applicable_rules}
                </span>
                <span className="text-[10px] font-mono text-sky-400 font-semibold">Rules</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Directly govern this listing</span>
            </button>

            {/* PASS */}
            <button
              onClick={() => setStatusFilter('pass')}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                statusFilter === 'pass'
                  ? 'bg-emerald-600/20 border-emerald-500 shadow-md shadow-emerald-600/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">PASS</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {verificationResult.summary.passed}
                </span>
                <span className="text-[10px] font-mono text-emerald-400/80">Clear</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Substantiated with proof</span>
            </button>

            {/* FAIL */}
            <button
              onClick={() => setStatusFilter('fail')}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                statusFilter === 'fail'
                  ? 'bg-rose-600/20 border-rose-500 shadow-md shadow-rose-600/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400">FAIL</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-rose-400 font-mono">
                  {verificationResult.summary.failed}
                </span>
                <span className="text-[10px] font-mono text-rose-400/80">Violations</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Direct statutory conflicts</span>
            </button>

            {/* MISSING INFO */}
            <button
              onClick={() => setStatusFilter('missing_information')}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                statusFilter === 'missing_information'
                  ? 'bg-amber-600/20 border-amber-500 shadow-md shadow-amber-600/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">MISSING INFO</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">
                  {verificationResult.summary.missing_information}
                </span>
                <span className="text-[10px] font-mono text-amber-400/80">Blocked</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Evidence or data absent</span>
            </button>
          </div>
        </div>
      )}

      {/* ── "WHAT SHOULD THE SELLER FIX FIRST?" - Next Best Action Card ── */}
      {verificationResult && verificationResult.next_best_actions && verificationResult.next_best_actions.length > 0 && (
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> NEXT BEST ACTION · FIX PRIORITY #1
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Severity: <span className="text-rose-400">{verificationResult.next_best_actions[0].priority_level}</span>
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-white">
                {verificationResult.next_best_actions[0].action_title}
              </h3>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {verificationResult.next_best_actions[0].reason}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1 font-semibold text-amber-300">
                  <span>Impacts:</span>
                  <span className="font-mono">{verificationResult.next_best_actions[0].affected_rules_count} Applicable Rules</span>
                </div>
                <span>•</span>
                <div>
                  <span>Expected Outcome: </span>
                  <span className="text-emerald-400 font-medium">{verificationResult.next_best_actions[0].expected_result}</span>
                </div>
              </div>
            </div>

            {/* Fix Now Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={() => handleFixNow(verificationResult.next_best_actions[0])}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Fix Now &amp; Simulate Clearance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detailed Rule-by-Rule Verification List ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Statutory Rule-by-Rule Evaluation Results</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredRules.length} of {verificationResult?.rule_results.length || 0} shown)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict 4-way evaluation: PASS, FAIL, MISSING INFORMATION, or NEEDS REVIEW.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(['ALL', 'pass', 'fail', 'missing_information', 'needs_review'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  statusFilter === f
                    ? 'bg-slate-800 text-white border-slate-600'
                    : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300'
                }`}
              >
                {f === 'ALL' ? 'All Rules' : f.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Rule Cards */}
        {filteredRules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No rules matching the current filter '{statusFilter}'.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRules.map((rule) => {
              const cfg = STATUS_CONFIG[rule.status] || STATUS_CONFIG.needs_review;
              const StatusIcon = cfg.icon;
              const isExpanded = activeAccordionRuleId === rule.rule_id;

              return (
                <div
                  key={rule.rule_id}
                  className={`rounded-xl border transition-all ${
                    isExpanded ? 'border-slate-700 bg-slate-950/70' : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700/80'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setActiveAccordionRuleId(isExpanded ? null : rule.rule_id)}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg border ${cfg.bg}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{rule.rule_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cfg.badgeBg}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {rule.statute_citation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {rule.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTraceRule(rule);
                        }}
                        className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Decision Trace</span>
                      </button>
                      <button
                        type="button"
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Accordion Detail Section */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {/* Requirement & Evidence Check */}
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Statutory Mandate:</span>
                            <p className="text-xs text-slate-200 mt-0.5">{rule.expected_requirement}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Enforcing Authority:</span>
                            <p className="text-xs text-sky-400 mt-0.5">{rule.statutory_authority}</p>
                          </div>
                        </div>

                        {/* Evidence Checklist */}
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Required Evidence:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {rule.required_evidence.map((ev, i) => (
                                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {ev}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Evidence Status:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {rule.provided_evidence.length > 0 ? (
                                rule.provided_evidence.map((pe, i) => (
                                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    ✓ {pe}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  ⚠ No supporting documentation provided
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Action / Fix Suggestion */}
                      {rule.recommended_action && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2.5">
                          <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <strong className="text-amber-300 font-semibold text-xs">Recommended Seller Action:</strong>
                            <p className="text-xs text-slate-300 mt-0.5">{rule.recommended_action}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Visual 5-Step Decision Trace Modal ── */}
      {selectedTraceRule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
                    DECISION TRACE
                  </span>
                  <span className="text-xs font-mono text-slate-400">{selectedTraceRule.statute_citation}</span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">{selectedTraceRule.rule_name}</h3>
              </div>
              <button
                onClick={() => setSelectedTraceRule(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Trace Steps Timeline */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-xs text-slate-400 pb-2">
                Transparent statutory logic chain for audit defensibility under EU Digital Omnibus AI Act:
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {selectedTraceRule.decision_trace.map((step) => {
                  let stepColor = 'bg-slate-700 text-slate-300 border-slate-600';
                  if (step.status === 'pass') stepColor = 'bg-emerald-500 text-slate-950 border-emerald-400';
                  if (step.status === 'fail') stepColor = 'bg-rose-500 text-slate-950 border-rose-400';
                  if (step.status === 'warning' || step.status === 'missing') stepColor = 'bg-amber-500 text-slate-950 border-amber-400';
                  if (step.status === 'info') stepColor = 'bg-sky-500 text-slate-950 border-sky-400';

                  return (
                    <div key={step.step_number} className="relative">
                      {/* Step Number Dot */}
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${stepColor}`}>
                        {step.step_number}
                      </div>

                      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-white">{step.title}</h5>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            Step {step.step_number}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Final Result: <strong className="text-white font-mono">{selectedTraceRule.status.toUpperCase()}</strong>
              </span>
              <button
                onClick={() => setSelectedTraceRule(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}