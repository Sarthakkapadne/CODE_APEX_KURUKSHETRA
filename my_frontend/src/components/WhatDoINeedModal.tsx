'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, ArrowRight, FileText, Upload, Sparkles, Check } from 'lucide-react';
import { AuditResponse } from '../lib/types';

interface WhatDoINeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData?: AuditResponse | null;
  productName?: string;
}

const MARKET_OPTIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

export default function WhatDoINeedModal({
  isOpen,
  onClose,
  auditData,
  productName = 'Product Listing',
}: WhatDoINeedModalProps) {
  const [selectedCountry, setSelectedCountry] = useState('EU');

  if (!isOpen) return null;

  const currentCountryObj = MARKET_OPTIONS.find(m => m.code === selectedCountry) || MARKET_OPTIONS[1];

  // Derive country checks from auditData if available
  const checksForCountry = auditData?.matrix?.[selectedCountry] || [];

  // Plain seller-friendly requirement items
  const requirementsList = [
    {
      name: 'Product Label Copy & Markings',
      required: true,
      status: checksForCountry.some(c => c.category === 'Mandatory Labeling' && (c.status === 'violation' || c.status === 'warning')) ? 'fail' : 'pass',
      detail: selectedCountry === 'CA' ? 'Bilingual English/French mandatory on packaging' : selectedCountry === 'EU' ? 'Responsible Person name + address declared' : 'Manufacturer address & model number',
    },
    {
      name: 'Country of Origin Declaration',
      required: true,
      status: checksForCountry.some(c => c.explanation?.toLowerCase().includes('origin')) ? 'fail' : 'pass',
      detail: 'Format: "Made in India" or "Made in China" clearly legible',
    },
    {
      name: 'Safety & Test Compliance Report',
      required: true,
      status: checksForCountry.some(c => c.category === 'Safety/Certifications' && c.status === 'violation') ? 'fail' : 'pass',
      detail: selectedCountry === 'EU' ? 'CE Declaration of Conformity + EN safety test' : selectedCountry === 'JP' ? 'PSE Law Technical Testing Report' : 'FCC / UL Safety Certification Report',
    },
    {
      name: 'Required Certification Badge / Mark',
      required: selectedCountry !== 'US',
      status: checksForCountry.some(c => c.category === 'Safety/Certifications' && c.status !== 'pass') ? 'fail' : 'pass',
      detail: selectedCountry === 'EU' ? 'CE Mark visible on product & packaging' : selectedCountry === 'UK' ? 'UKCA Mark' : selectedCountry === 'JP' ? 'PSE Mark' : 'FCC Mark',
    },
    {
      name: 'Clean Marketing Copy (No Banned Medical/Pesticidal Claims)',
      required: true,
      status: checksForCountry.some(c => c.category === 'Claim Wording' && c.status !== 'pass') ? 'fail' : 'pass',
      detail: 'Remove unapproved drug or pesticide treatment wording',
    },
  ];

  const missingCount = requirementsList.filter(r => r.status === 'fail').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-in-right space-y-0">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary-600 to-blue-700 text-white flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
              Seller Requirement Checklist
            </span>
            <h2 className="text-xl font-black mt-2">What Do I Need To Sell This?</h2>
            <p className="text-xs text-blue-100 mt-1">
              Target Product: <strong className="text-white font-bold">{auditData?.listing_id || productName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Country Selector Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex gap-2 overflow-x-auto">
          {MARKET_OPTIONS.map(m => (
            <button
              key={m.code}
              onClick={() => setSelectedCountry(m.code)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCountry === m.code
                  ? 'bg-primary-600 text-white shadow-blue'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
              }`}
            >
              <span className="text-base">{m.flag}</span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Action Callout Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold ${
            missingCount > 0
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {missingCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {missingCount > 0
                    ? `Fix these ${missingCount} item${missingCount > 1 ? 's' : ''} before listing in ${currentCountryObj.name}`
                    : `100% Cleared for Listing in ${currentCountryObj.name}!`}
                </p>
                <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                  {missingCount > 0
                    ? 'Customs will detain shipments missing these requirements.'
                    : 'All mandatory labels and safety certificates are verified.'}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-3">
            {requirementsList.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  item.status === 'pass'
                    ? 'bg-emerald-50/40 border-emerald-100'
                    : 'bg-rose-50/40 border-rose-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.status === 'pass' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {item.status === 'pass' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-xs text-slate-900">{item.name}</p>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status === 'pass' ? 'Verified ✓' : 'Missing ✕'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-blue transition-colors flex items-center gap-2"
            >
              <span>Apply Compliance Fixes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
