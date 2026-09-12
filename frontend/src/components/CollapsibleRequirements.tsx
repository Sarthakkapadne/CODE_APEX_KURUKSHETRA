'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Award, ShieldCheck, CheckCircle2, AlertTriangle, Upload, Eye, Zap, Info } from 'lucide-react';
import { AuditResponse } from '../lib/types';

interface CollapsibleRequirementsProps {
  auditData?: AuditResponse | null;
}

const SAMPLE_DOCUMENTS = [
  { id: 'doc-1', name: 'EU CE Declaration of Conformity (DoC)', country: 'EU', category: 'Certification', status: 'Required', action: 'Upload PDF' },
  { id: 'doc-2', name: 'UN 38.3 Lithium Battery Safety Test Report', country: 'US, EU, UK, CA, JP', category: 'Test Report', status: 'Available', action: 'View Report' },
  { id: 'doc-3', name: 'EU Responsible Person (RP) Agreement', country: 'EU', category: 'Representation', status: 'Missing', action: 'Assign RP' },
  { id: 'doc-4', name: 'PSE Technical Compliance Certificate', country: 'JP', category: 'Certification', status: 'Missing', action: 'Upload Certificate' },
  { id: 'doc-5', name: 'Bilingual English/French Packaging Label Proof', country: 'CA', category: 'Labeling', status: 'Required', action: 'Upload Image' },
];

const SAMPLE_SYMBOLS = [
  { name: 'CE Mark', symbol: 'CE', country: 'EU', purpose: 'Conformité Européenne safety declaration', status: 'Mandatory', iconBg: 'bg-blue-600 text-white' },
  { name: 'UKCA Mark', symbol: 'UKCA', country: 'UK', purpose: 'UK Conformity Assessed marking', status: 'Mandatory', iconBg: 'bg-indigo-600 text-white' },
  { name: 'WEEE Crossed Bin', symbol: '🗑️', country: 'EU, UK', purpose: 'Waste Electrical & Electronic Equipment symbol', status: 'Mandatory', iconBg: 'bg-slate-800 text-white' },
  { name: 'FCC Logo', symbol: 'FCC', country: 'US', purpose: 'Federal Communications Commission EMC compliance', status: 'Mandatory', iconBg: 'bg-sky-600 text-white' },
  { name: 'PSE Mark (Diamond/Circle)', symbol: 'PSE', country: 'JP', purpose: 'Japan Electrical Appliance Safety Law mark', status: 'Required for JP', iconBg: 'bg-amber-600 text-white' },
  { name: 'Recyclable Battery Mark', symbol: '♻️', country: 'US, CA', purpose: 'RBRC Battery recycling seal for lithium cells', status: 'Mandatory', iconBg: 'bg-emerald-600 text-white' },
];

const SAMPLE_TESTS = [
  { testName: 'EN 62368-1 Audio/Video & IT Safety Test', standard: 'IEC/EN 62368-1', country: 'EU, UK', status: 'Passed ✓', validUntil: '2026-12' },
  { testName: 'FCC Part 15 Class B Radiated Emissions Test', standard: '47 CFR Part 15', country: 'US', status: 'Passed ✓', validUntil: '2027-01' },
  { testName: 'UN 38.3 Lithium Transport Safety Testing', standard: 'ST/SG/AC.10/11/Rev.7', country: 'Global', status: 'Required ⚠', validUntil: 'Action Needed' },
  { testName: 'RoHS Heavy Metals Chemical Screen', standard: '2011/65/EU', country: 'EU', status: 'Passed ✓', validUntil: '2026-08' },
];

export default function CollapsibleRequirements({ auditData }: CollapsibleRequirementsProps) {
  const [openSection, setOpenSection] = useState<'docs' | 'symbols' | 'tests' | null>('docs');

  function toggleSection(sec: 'docs' | 'symbols' | 'tests') {
    setOpenSection(prev => (prev === sec ? null : sec));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Regulatory Artifacts & Requirements</h3>
          <p className="text-xs text-slate-400 mt-0.5">Mandatory certificates, packaging symbols, and safety tests</p>
        </div>
      </div>

      {/* Section 1: Required Documents & Certifications */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden transition-all">
        <button
          onClick={() => toggleSection('docs')}
          className="w-full p-5 text-left flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">1. Required Documents & Certifications</h4>
              <p className="text-xs text-slate-400 mt-0.5">Licenses, declarations of conformity, and responsible person contracts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              2 Missing
            </span>
            {openSection === 'docs' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {openSection === 'docs' && (
          <div className="p-5 border-t border-slate-100 space-y-3">
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {SAMPLE_DOCUMENTS.map(doc => (
                <div key={doc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{doc.name}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{doc.country}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">Category: {doc.category}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      doc.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      doc.status === 'Missing' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {doc.status}
                    </span>
                    <button className="flex items-center gap-1 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold px-3 py-1.5 rounded-lg border border-primary-200 text-[11px] transition-colors">
                      <Upload className="w-3 h-3 text-primary-600" />
                      {doc.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Required Symbols & Marks */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden transition-all">
        <button
          onClick={() => toggleSection('symbols')}
          className="w-full p-5 text-left flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">2. Required Packaging Symbols & Marks</h4>
              <p className="text-xs text-slate-400 mt-0.5">Mandatory physical logos required on retail boxes & device labels</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              6 Identified
            </span>
            {openSection === 'symbols' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {openSection === 'symbols' && (
          <div className="p-5 border-t border-slate-100 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SAMPLE_SYMBOLS.map((sym, idx) => (
                <div key={idx} className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-2xs ${sym.iconBg}`}>
                      {sym.symbol}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800">{sym.name}</p>
                      <span className="text-[10px] font-mono font-semibold text-slate-500">Market: {sym.country}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">{sym.purpose}</p>
                  <div className="pt-1 flex items-center justify-between border-t border-slate-200/80">
                    <span className="text-[10px] font-bold text-primary-700">{sym.status}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Vector SVG available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Required Testing */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden transition-all">
        <button
          onClick={() => toggleSection('tests')}
          className="w-full p-5 text-left flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">3. Required Laboratory Testing</h4>
              <p className="text-xs text-slate-400 mt-0.5">Electrical, EMC, battery safety, and chemical substance screens</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              3 Passed / 1 Action
            </span>
            {openSection === 'tests' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {openSection === 'tests' && (
          <div className="p-5 border-t border-slate-100 space-y-3">
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {SAMPLE_TESTS.map((t, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{t.testName}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.standard}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">Target Markets: {t.country}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">Valid: {t.validUntil}</span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                      t.status.includes('Passed') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
