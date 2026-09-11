'use client';

import React, { useState, useMemo } from 'react';
import type { RequiredDocumentItem } from '../lib/types';
import {
  FileText, CheckCircle2, XCircle, AlertCircle, ShieldAlert,
  Download, Filter, Check, ExternalLink, Bookmark, Sparkles,
  Search, ShieldCheck, ChevronDown, ChevronUp, Layers
} from 'lucide-react';

export interface DocumentChecklistProps {
  documents?: RequiredDocumentItem[];
  targetMarkets?: string[];
  productCategory?: string;
  onStatusChange?: (docId: string, status: 'verified' | 'missing') => void;
  className?: string;
}

// Authoritative default document requirements grouped by sovereign destination market
const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocumentItem[] = [
  // United States
  {
    id: 'doc-us-mocra',
    country_code: 'US',
    title: 'FDA MoCRA Facility Registration & Product Listing',
    category: 'cosmetics',
    is_mandatory: true,
    citation: 'FD&C Act § 607 (21 U.S.C. 364c)',
    governing_agency: 'US Food & Drug Administration (FDA)',
    description: 'Mandatory cosmetic facility registration and electronic listing of all cosmetic formulations distributed in the United States.',
    status: 'missing',
  },
  {
    id: 'doc-us-cpc',
    country_code: 'US',
    title: "Children's Product Certificate (CPC) & ASTM F977 Test Report",
    category: 'toys',
    is_mandatory: true,
    citation: 'CPSIA § 102 (16 CFR 1110 & 16 CFR 1216)',
    governing_agency: 'Consumer Product Safety Commission (CPSC)',
    description: 'Third-party CPSC-accredited laboratory testing certificate verifying non-toxic finishes, stair-fall protection, and mechanical stability.',
    status: 'missing',
  },
  {
    id: 'doc-us-prior-notice',
    country_code: 'US',
    title: 'FDA Prior Notice of Imported Consignments (PN Confirmation Number)',
    category: 'general',
    is_mandatory: true,
    citation: 'Bioterrorism Act § 307 (21 CFR 1.278)',
    governing_agency: 'US CBP & FDA Division of Import Operations',
    description: 'Advance digital notice filed with US Customs and FDA prior to international vessel/flight arrival.',
    status: 'verified',
  },
  {
    id: 'doc-us-customs-bond',
    country_code: 'US',
    title: 'Continuous Importer Entry Bond (CBP Form 301)',
    category: 'general',
    is_mandatory: false,
    citation: '19 CFR Part 113',
    governing_agency: 'US Customs & Border Protection (CBP)',
    description: 'Recommended continuous bond covering commercial imports exceeding $2,500 formal entry threshold.',
    status: 'verified',
  },

  // European Union
  {
    id: 'doc-eu-doc',
    country_code: 'EU',
    title: 'EU Declaration of Conformity (DoC) & Technical Dossier',
    category: 'general',
    is_mandatory: true,
    citation: 'Regulation (EU) 2023/988 (GPSR Art. 9)',
    governing_agency: 'EU National Market Surveillance Authorities',
    description: 'Signed manufacturer declaration attesting conformity with all applicable EU harmonised product health & safety directives.',
    status: 'missing',
  },
  {
    id: 'doc-eu-cpnp',
    country_code: 'EU',
    title: 'Cosmetic Product Notification Portal (CPNP) Reference & Safety Report (CPSR)',
    category: 'cosmetics',
    is_mandatory: true,
    citation: 'Regulation (EC) No 1223/2009 Art. 13',
    governing_agency: 'European Commission DG GROW / DG SANTE',
    description: 'Toxicological safety assessment (Part A & B) authored by a qualified European safety assessor and logged into CPNP.',
    status: 'missing',
  },
  {
    id: 'doc-eu-rp',
    country_code: 'EU',
    title: 'EU Responsible Person (RP) Mandate & Economic Operator Contract',
    category: 'general',
    is_mandatory: true,
    citation: 'Regulation (EU) 2019/1020 Art. 4',
    governing_agency: 'EU Customs & Port of Entry Inspectors',
    description: 'Legally binding contract appointing an EU-established entity responsible for product safety dossiers and customs contact.',
    status: 'missing',
  },

  // Canada
  {
    id: 'doc-ca-cnf',
    country_code: 'CA',
    title: 'Health Canada Cosmetic Notification Form (CNF)',
    category: 'cosmetics',
    is_mandatory: true,
    citation: 'Food and Drugs Act § 30 (Cosmetic Regs C.R.C. c. 869)',
    governing_agency: 'Health Canada Consumer Product Safety Directorate',
    description: 'Mandatory regulatory filing within 10 days of first commercial sale listing all ingredient concentrations and manufacturer identity.',
    status: 'missing',
  },
  {
    id: 'doc-ca-carm',
    country_code: 'CA',
    title: 'CARM Importer of Record Business Number & Financial Security',
    category: 'general',
    is_mandatory: true,
    citation: 'Customs Act § 8.1 (CBSA CARM Client Portal)',
    governing_agency: 'Canada Border Services Agency (CBSA)',
    description: 'Mandatory CBSA Assessment and Revenue Management registration for direct commercial import clearance into Canada.',
    status: 'verified',
  },
  {
    id: 'doc-ca-bilingual',
    country_code: 'CA',
    title: 'Bilingual French-English Consumer Labelling Declaration',
    category: 'general',
    is_mandatory: true,
    citation: 'Consumer Packaging and Labelling Act § 6',
    governing_agency: 'Competition Bureau Canada & CBSA',
    description: 'Statutory verification that packaging display panels present product identity and net quantity in both official Canadian languages.',
    status: 'missing',
  },

  // United Kingdom
  {
    id: 'doc-uk-scpn',
    country_code: 'UK',
    title: 'UK Submit Cosmetic Product Notifications (SCPN) Dossier',
    category: 'cosmetics',
    is_mandatory: true,
    citation: 'UK Cosmetic Regulation (SI 2019/696 Schedule 34)',
    governing_agency: 'Office for Product Safety and Standards (OPSS)',
    description: 'Post-Brexit UK database notification for commercial sales across England, Scotland, and Wales.',
    status: 'missing',
  },
  {
    id: 'doc-uk-ukrp',
    country_code: 'UK',
    title: 'UK Responsible Person (UKRP) Mandate & Address Agreement',
    category: 'general',
    is_mandatory: true,
    citation: 'Product Safety and Metrology SI 2019/696',
    governing_agency: 'HM Revenue & Customs (HMRC)',
    description: 'Appointment of a UK-based legal representative whose contact details are printed directly on packaging.',
    status: 'missing',
  },

  // Japan
  {
    id: 'doc-jp-mah',
    country_code: 'JP',
    title: 'Japan Marketing Authorization Holder (MAH) Agreement',
    category: 'cosmetics',
    is_mandatory: true,
    citation: 'Pharmaceutical and Medical Devices (PMD) Act Art. 12',
    governing_agency: 'Ministry of Health, Labour and Welfare (MHLW) / PMDA',
    description: 'Contract with a licensed Japanese domestic company to take legal responsibility for customs entry and pharmacovigilance.',
    status: 'missing',
  },
  {
    id: 'doc-jp-todoke',
    country_code: 'JP',
    title: 'Cosmetic Import Notification (Koseihin Seizo Hambai Todoke)',
    category: 'cosmetics',
    is_mandatory: true,
    citation: 'PMD Act Enforcement Regulations Art. 19',
    governing_agency: 'Tokyo Metropolitan Government / Japan Customs',
    description: 'Import notification filing with local prefectural government prior to customs entry declaration.',
    status: 'missing',
  },
];

const COUNTRY_FLAGS: Record<string, { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: 'United States' },
  EU: { flag: '🇪🇺', name: 'European Union' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  UK: { flag: '🇬🇧', name: 'United Kingdom' },
  JP: { flag: '🇯🇵', name: 'Japan' },
  AU: { flag: '🇦🇺', name: 'Australia' },
  IN: { flag: '🇮🇳', name: 'India' },
};

export default function DocumentChecklist({
  documents: initialDocs,
  targetMarkets,
  productCategory,
  onStatusChange,
  className = '',
}: DocumentChecklistProps) {
  // Use passed documents or intelligent defaults
  const [docList, setDocList] = useState<RequiredDocumentItem[]>(() => {
    if (initialDocs && initialDocs.length > 0) return initialDocs;
    return DEFAULT_REQUIRED_DOCUMENTS;
  });

  const [filterType, setFilterType] = useState<'all' | 'mandatory' | 'missing'>('all');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Toggle Switch
  const handleToggleStatus = (docId: string) => {
    setDocList(prev =>
      prev.map(doc => {
        if (doc.id === docId) {
          const nextStatus: 'verified' | 'missing' = doc.status === 'verified' ? 'missing' : 'verified';
          if (onStatusChange) onStatusChange(docId, nextStatus);
          return { ...doc, status: nextStatus };
        }
        return doc;
      })
    );
  };

  // Filter documents
  const filteredDocs = useMemo(() => {
    return docList.filter(doc => {
      // Market filter if specified by parent
      if (targetMarkets && targetMarkets.length > 0 && !targetMarkets.includes(doc.country_code)) {
        return false;
      }
      // Country dropdown filter
      if (selectedCountryFilter !== 'all' && doc.country_code !== selectedCountryFilter) {
        return false;
      }
      // Type filter
      if (filterType === 'mandatory' && !doc.is_mandatory) return false;
      if (filterType === 'missing' && doc.status === 'verified') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.citation.toLowerCase().includes(q) ||
          (doc.description && doc.description.toLowerCase().includes(q)) ||
          doc.country_code.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [docList, targetMarkets, selectedCountryFilter, filterType, searchQuery]);

  // Group by Country
  const groupedDocs = useMemo(() => {
    const groups: Record<string, RequiredDocumentItem[]> = {};
    filteredDocs.forEach(doc => {
      if (!groups[doc.country_code]) groups[doc.country_code] = [];
      groups[doc.country_code].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = docList.length;
    const verified = docList.filter(d => d.status === 'verified').length;
    const mandatoryTotal = docList.filter(d => d.is_mandatory).length;
    const mandatoryVerified = docList.filter(d => d.is_mandatory && d.status === 'verified').length;
    const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
    const mandatoryPct = mandatoryTotal > 0 ? Math.round((mandatoryVerified / mandatoryTotal) * 100) : 0;

    return { total, verified, mandatoryTotal, mandatoryVerified, pct, mandatoryPct };
  }, [docList]);

  // Quick action: Mark all in current view as verified
  const handleMarkAllVerified = () => {
    setDocList(prev =>
      prev.map(doc => ({ ...doc, status: 'verified' }))
    );
  };

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur shadow-2xl p-5 space-y-5 ${className}`}>
      
      {/* ── Top Header Toolbar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Mandatory Document &amp; License Checklist
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {stats.verified}/{stats.total} Attached
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Statutory certificates, test reports, and customs registrations required before international clearance.
              </p>
            </div>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="flex items-center gap-3 self-start lg:self-auto bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
              <span>{stats.pct}% Readiness</span>
              {stats.mandatoryPct === 100 && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Mandatory: {stats.mandatoryVerified}/{stats.mandatoryTotal}
            </span>
          </div>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                stats.pct >= 80 ? 'bg-emerald-500' : stats.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Filters & Controls Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
        
        {/* Search Input */}
        <div className="flex items-center space-x-2 flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificate or statute citation..."
            className="w-full bg-transparent text-white text-xs outline-none placeholder:text-slate-500 font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All ({docList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('mandatory')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterType === 'mandatory'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Mandatory Only ({stats.mandatoryTotal})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('missing')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterType === 'missing'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Missing ({stats.total - stats.verified})
          </button>
        </div>

        {/* Quick Bulk Action */}
        <button
          type="button"
          onClick={handleMarkAllVerified}
          className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
        >
          <Check className="w-3 h-3" /> Mark All Verified
        </button>

      </div>

      {/* ── Document Cards Grouped By Country ── */}
      <div className="space-y-5">
        {Object.keys(groupedDocs).length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No document requirements match your current search or filter.
          </div>
        ) : (
          Object.entries(groupedDocs).map(([countryCode, docs]) => {
            const countryMeta = COUNTRY_FLAGS[countryCode] || { flag: '🌐', name: countryCode };
            const countryVerified = docs.filter(d => d.status === 'verified').length;
            const isAllClear = countryVerified === docs.length;

            return (
              <div
                key={countryCode}
                className="rounded-xl border border-slate-800/80 bg-slate-950/70 overflow-hidden shadow-md"
              >
                {/* Country Header */}
                <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{countryMeta.flag}</span>
                    <span className="font-bold text-white text-xs tracking-wide">
                      {countryMeta.name} ({countryCode})
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isAllClear
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {countryVerified} / {docs.length} Verified
                  </span>
                </div>

                {/* Country Document List */}
                <div className="divide-y divide-slate-800/60 p-2 sm:p-3 space-y-2">
                  {docs.map(doc => {
                    const isVerified = doc.status === 'verified';

                    return (
                      <div
                        key={doc.id}
                        className={`p-3 rounded-xl transition-all border ${
                          isVerified
                            ? 'bg-emerald-950/10 border-emerald-500/30'
                            : doc.is_mandatory
                            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          
                          {/* Left Details */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              
                              {/* Mandatory vs Recommended Badge */}
                              {doc.is_mandatory ? (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider">
                                  [MANDATORY]
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 tracking-wider">
                                  [RECOMMENDED]
                                </span>
                              )}

                              {/* Title */}
                              <h4 className="text-xs font-bold text-white tracking-wide">
                                {doc.title}
                              </h4>
                            </div>

                            {/* Statutory Citation & Agency */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono">
                              <span className="flex items-center gap-1 text-sky-400">
                                <Bookmark className="w-3 h-3" />
                                {doc.citation}
                              </span>
                              {doc.governing_agency && (
                                <span className="text-slate-500">
                                  · {doc.governing_agency}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">
                              {doc.description}
                            </p>
                          </div>

                          {/* Right Interactive Toggle */}
                          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                            
                            {/* Status Pill */}
                            <div className="text-right hidden md:block">
                              <span
                                className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                                  isVerified ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    Verified &amp; Attached
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                    Missing
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(doc.id)}
                              className={`relative inline-flex h-7 w-28 items-center rounded-full p-1 transition-colors border ${
                                isVerified
                                  ? 'bg-emerald-600 border-emerald-400 text-white'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                              title="Toggle document availability"
                            >
                              <span
                                className={`text-[10px] font-bold uppercase transition-all absolute ${
                                  isVerified ? 'left-3 text-white' : 'right-3 text-slate-400'
                                }`}
                              >
                                {isVerified ? 'I Have This' : 'Missing'}
                              </span>
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                  isVerified ? 'translate-x-[76px]' : 'translate-x-0'
                                }`}
                              />
                            </button>

                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
