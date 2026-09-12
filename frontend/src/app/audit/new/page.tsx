'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Upload, Link as LinkIcon, Edit3, ShieldCheck, Scale, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, Download, RefreshCw, FileText, Lock,
  Globe, Sparkles, ChevronRight, Copy, Check, Info, ShieldAlert, BarChart3, HelpCircle
} from 'lucide-react';
import AppShell from '../../../components/layout/AppShell';
import ComplianceMatrix from '../../../components/ComplianceMatrix';
import HashVerificationModal from '../../../components/HashVerificationModal';
import ComplianceAtAGlance from '../../../components/ComplianceAtAGlance';
import WhatDoINeedModal from '../../../components/WhatDoINeedModal';
import CountryReadinessScorecard from '../../../components/CountryReadinessScorecard';
import CollapsibleRequirements from '../../../components/CollapsibleRequirements';
import AIDescriptionGeneratorModal from '../../../components/AIDescriptionGeneratorModal';
import { runComplianceAudit, scrapeListingUrl, downloadPdfReport } from '../../../lib/api';
import { AuditResponse, ListingInput } from '../../../lib/types';

const MARKET_OPTIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

const DEMO_PRESETS = [
  {
    title: 'Ayurvedic Healing Skin Cream',
    brand_name: 'VedaBeauty',
    description: 'Natural herbal skin cream formulated with Turmeric, Neem, and Curcuma Longa. Heals eczema, reduces inflammation, cures skin redness, and repairs damaged tissue miraculously.',
    price: 34.99,
    currency: 'USD',
    country_of_origin: 'IN',
    category_hint: 'Cosmetics & Personal Care',
    destination_markets: ['US', 'EU', 'UK', 'CA'],
    badge: 'Medical Claim Trigger',
  },
  {
    title: 'MagSafe Fast Wireless Charger 15W',
    brand_name: 'VoltGear',
    description: 'High-speed 15W Qi-certified magnetic wireless charging pad with USB-C braided cable. Compatible with iPhone 12-15 and Android devices.',
    price: 29.95,
    currency: 'USD',
    country_of_origin: 'CN',
    category_hint: 'Consumer Electronics',
    destination_markets: ['US', 'EU', 'JP'],
    badge: 'PSE / CE Cert Check',
  },
  {
    title: 'Ultra Powerbank 20000mAh Lithium Ion',
    brand_name: 'MaxCharge',
    description: 'Portable external battery powerbank with dual USB ports and integrated lithium-ion cells. Ideal for travel and emergency power supply.',
    price: 49.00,
    currency: 'USD',
    country_of_origin: 'CN',
    category_hint: 'Batteries & Hazmat',
    destination_markets: ['US', 'EU', 'UK', 'CA', 'JP'],
    badge: 'Hazmat Lithium UN 38.3',
  },
];

function VerdictHeader({ verdict }: { verdict: string }) {
  const v = verdict?.toUpperCase() || '';
  if (v === 'COMPLIANT') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-blue">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="badge-pass">COMPLIANT</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Ready for Global Marketplace Listing</p>
          </div>
        </div>
      </div>
    );
  }
  if (v === 'IMPORT_PROHIBITED') {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="badge-fail">IMPORT PROHIBITED</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Banned by Destination Customs Regulations</p>
          </div>
        </div>
      </div>
    );
  }
  if (v === 'ESCALATION_REQUIRED') {
    return (
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="badge-esc">ESCALATION REQUIRED</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Requires Legal & Compliance Manager Approval</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <span className="badge-warn">REMEDIATION REQUIRED</span>
          <p className="text-sm font-bold text-slate-800 mt-1">Fix Copy & Labeling to Guarantee Customs Clearance</p>
        </div>
      </div>
    </div>
  );
}

function NewAuditContent() {
  const [inputTab, setInputTab] = useState<'manual' | 'link' | 'image'>('manual');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['US', 'EU', 'UK', 'CA']);
  const [form, setForm] = useState({
    title: 'Ayurvedic Healing Skin Cream',
    description: 'Natural herbal skin cream formulated with Turmeric, Neem, and Curcuma Longa. Heals eczema, reduces inflammation, cures skin redness, and repairs damaged tissue miraculously.',
    brand_name: 'VedaBeauty',
    price: 34.99,
    currency: 'USD',
    country_of_origin: 'IN',
    category_hint: 'Cosmetics & Personal Care',
    source_url: '',
  });

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'matrix' | 'debate' | 'remediation' | 'economics'>('matrix');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showHashModal, setShowHashModal] = useState(false);
  const [showWhatDoINeedModal, setShowWhatDoINeedModal] = useState(false);
  const [showAiDescModal, setShowAiDescModal] = useState(false);
  const [scraping, setScraping] = useState(false);

  function toggleMarket(code: string) {
    setSelectedMarkets(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  function handlePresetSelect(preset: any) {
    setForm({
      title: preset.title,
      description: preset.description,
      brand_name: preset.brand_name,
      price: preset.price,
      currency: preset.currency,
      country_of_origin: preset.country_of_origin,
      category_hint: preset.category_hint,
      source_url: '',
    });
    setSelectedMarkets(preset.destination_markets);
  }

  async function handleScrape() {
    if (!form.source_url) return;
    setScraping(true);
    try {
      const data = await scrapeListingUrl(form.source_url);
      setForm(prev => ({ ...prev, title: data.title || prev.title, description: data.description || prev.description }));
    } catch {
      setError('Could not extract details from URL.');
    } finally {
      setScraping(false);
    }
  }

  async function runAudit() {
    if (!form.title || !form.description) {
      setError('Product name and description are required.');
      return;
    }
    if (selectedMarkets.length === 0) {
      setError('Select at least one destination market.');
      return;
    }
    setError('');
    setIsRunning(true);
    try {
      const res = await runComplianceAudit({
        title: form.title,
        description: form.description,
        brand_name: form.brand_name,
        price: form.price,
        currency: form.currency,
        country_of_origin: form.country_of_origin,
        category_hint: form.category_hint || undefined,
        destination_markets: selectedMarkets,
        source_url: form.source_url || undefined,
      });
      setAuditData(res);
      setActiveResultTab('matrix');
    } catch (e: any) {
      setError(e.message || 'Audit failed. Check that backend is running.');
    } finally {
      setIsRunning(false);
    }
  }

  function copyToClipboard(text: string, fieldId: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 radial-bg min-h-screen">
      {/* ── Page Header & Stepper ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">New Compliance Audit</h1>
            <span className="text-[10px] font-bold bg-primary-50 text-primary-600 border border-primary-100 px-2.5 py-0.5 rounded-full">
              Deterministic + AI Co-Pilot
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Submit product details to run multi-market rule checks & adversarial debate</p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs text-xs font-semibold text-slate-600">
          <span className={`px-3 py-1 rounded-xl transition-all ${!auditData ? 'bg-primary-600 text-white font-bold' : 'text-slate-400'}`}>1. Input</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={`px-3 py-1 rounded-xl transition-all ${isRunning ? 'bg-primary-600 text-white font-bold animate-pulse' : auditData ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-400'}`}>2. Audit</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={`px-3 py-1 rounded-xl transition-all ${auditData ? 'bg-primary-600 text-white font-bold' : 'text-slate-400'}`}>3. Verdict & Fixes</span>
        </div>
      </div>

      {/* ── Form & Presets Container ── */}
      {!auditData && (
        <div className="space-y-6">
          {/* Quick Demo Case Presets */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Test Cases (Click to Prefill)
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {DEMO_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(p)}
                  className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all group shadow-2xs"
                >
                  <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full mb-1.5">
                    {p.badge}
                  </span>
                  <p className="font-bold text-xs text-slate-800 group-hover:text-primary-700 truncate">{p.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Tabs */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-card p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              {[
                { id: 'manual', label: 'Manual Input', icon: Edit3 },
                { id: 'link', label: 'Product Link Scraper', icon: LinkIcon },
                { id: 'image', label: 'Image Upload', icon: Upload },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setInputTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      inputTab === tab.id
                        ? 'bg-primary-600 text-white shadow-blue'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Manual Form */}
            {inputTab === 'manual' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Product Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Ayurvedic Skin Cream 50ml"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brand Name</label>
                    <input
                      type="text"
                      value={form.brand_name}
                      onChange={e => setForm({ ...form, brand_name: e.target.value })}
                      placeholder="e.g. VedaBeauty"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Product Description / Label Copy *</label>
                    <button
                      type="button"
                      onClick={() => setShowAiDescModal(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-lg border border-primary-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Generate Compliant Description
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Paste your listing description, ingredient list, marketing claims, or warnings..."
                    className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Price & Currency</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                      />
                      <select
                        value={form.currency}
                        onChange={e => setForm({ ...form, currency: e.target.value })}
                        className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none"
                      >
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                        <option>CAD</option>
                        <option>JPY</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Country of Origin</label>
                    <select
                      value={form.country_of_origin}
                      onChange={e => setForm({ ...form, country_of_origin: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none"
                    >
                      <option value="US">🇺🇸 United States</option>
                      <option value="CN">🇨🇳 China</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="JP">🇯🇵 Japan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category Hint</label>
                    <input
                      type="text"
                      value={form.category_hint}
                      onChange={e => setForm({ ...form, category_hint: e.target.value })}
                      placeholder="e.g. Cosmetics / Electronics"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Link Scraper */}
            {inputTab === 'link' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Paste any Amazon, Shopify, or eBay product link to automatically extract listing details.</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.source_url}
                    onChange={e => setForm({ ...form, source_url: e.target.value })}
                    placeholder="https://www.amazon.com/dp/B08N5WRWNW"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                  <button
                    onClick={handleScrape}
                    disabled={scraping || !form.source_url}
                    className="bg-primary-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 text-xs"
                  >
                    {scraping ? 'Extracting...' : 'Fetch Listing'}
                  </button>
                </div>
              </div>
            )}

            {/* Target Markets Selector */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Select Destination Markets *
              </label>
              <div className="flex flex-wrap gap-2.5">
                {MARKET_OPTIONS.map(m => {
                  const isSelected = selectedMarkets.includes(m.code);
                  return (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => toggleMarket(m.code)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-primary-600 border-primary-600 text-white shadow-blue'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
                      }`}
                    >
                      <span className="text-base">{m.flag}</span>
                      <span>{m.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Run Button */}
            <div className="pt-2">
              <button
                onClick={runAudit}
                disabled={isRunning}
                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-black px-8 py-4 rounded-2xl shadow-blue transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Executing Multi-Tier Rule Engine...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Run Compliance Audit Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Audit Results View ── */}
      {auditData && (
        <div className="space-y-6 animate-slide-in-right">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-card">
            <div>
              <p className="text-xs text-slate-400 font-mono">AUDIT RECORD · {auditData.inspection_id}</p>
              <h2 className="font-black text-slate-900 text-lg">{auditData.extracted_attributes.category} Compliance Dossier</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditData(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Run
              </button>
              <button
                onClick={() => downloadPdfReport(auditData)}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-xl shadow-blue transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF Dossier
              </button>
            </div>
          </div>

          {/* Verdict Banner */}
          <VerdictHeader verdict={auditData.overall_verdict} />

          {/* Signature Feature: COMPLIANCE AT A GLANCE */}
          <ComplianceAtAGlance
            auditData={auditData}
            onResolveClick={() => setActiveResultTab('remediation')}
            onWhatDoINeedClick={() => setShowWhatDoINeedModal(true)}
          />

          {/* Hash Seal Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800">SHA-256 Cryptographic Hash Chain Seal</p>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">{auditData.compliance_hash}</p>
              </div>
            </div>
            <button
              onClick={() => setShowHashModal(true)}
              className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3.5 py-2 rounded-xl transition-colors"
            >
              Verify Seal Proof →
            </button>
          </div>

          {/* Result Tabs Navigation */}
          <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
            {[
              { id: 'matrix', label: 'Compliance Matrix', icon: Scale },
              { id: 'debate', label: 'Adversarial Debate Room', icon: ShieldAlert },
              { id: 'remediation', label: 'Compliant Rewrite Diff', icon: FileText },
              { id: 'economics', label: 'Trade Economics', icon: BarChart3 },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveResultTab(t.id as any)}
                  className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
                    activeResultTab === t.id
                      ? 'border-primary-600 text-primary-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Matrix */}
          {activeResultTab === 'matrix' && (
            <div className="space-y-8">
              <ComplianceMatrix
                matrix={auditData.matrix}
                destinationMarkets={auditData.destination_markets}
                summaryByCountry={auditData.summary_by_country}
              />

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {/* Signature Feature: Collapsible Requirements */}
                  <CollapsibleRequirements auditData={auditData} />
                </div>
                <div>
                  {/* Signature Feature: Country Readiness Scorecard */}
                  <CountryReadinessScorecard auditData={auditData} />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Adversarial Debate */}
          {activeResultTab === 'debate' && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-card p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Multi-Agent Consensus Debate Room</h3>
                <p className="text-xs text-slate-400 mt-0.5">Inspector AI vs Seller Advocate AI resolution</p>
              </div>

              <div className="space-y-4">
                {(auditData.debate?.turns || []).map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border ${
                      t.speaker.includes('Inspector')
                        ? 'bg-rose-50/60 border-rose-100'
                        : t.speaker.includes('Advocate')
                        ? 'bg-blue-50/60 border-blue-100'
                        : 'bg-emerald-50/60 border-emerald-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xs text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary-600" />
                        {t.speaker}
                      </span>
                      <div className="flex gap-1">
                        {(t.cited_rules || []).map(r => (
                          <span key={r} className="font-mono text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{t.argument}</p>
                  </div>
                ))}
              </div>

              {auditData.debate?.binding_remediations && (
                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 space-y-2">
                  <p className="font-bold text-xs text-primary-700 uppercase tracking-wider">Binding Remediation Roadmap</p>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {auditData.debate.binding_remediations.map((r, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Remediation Rewrite */}
          {activeResultTab === 'remediation' && auditData.remediation && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-card p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Compliant Rewrite Copy</h3>
                <p className="text-xs text-slate-400 mt-0.5">Use compliant rewording to avoid customs drug or hazmat triggers</p>
              </div>

              {/* Title Compare */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original Product Title</p>
                  <p className="text-sm font-semibold text-slate-700">{auditData.remediation.original_title}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Compliant Title</p>
                    <button
                      onClick={() => copyToClipboard(auditData.remediation?.compliant_title || '', 'title')}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-emerald-100 transition-colors"
                    >
                      {copiedField === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'title' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{auditData.remediation.compliant_title}</p>
                </div>
              </div>

              {/* Description Compare */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original Description</p>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{auditData.remediation.original_description}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Compliant Description</p>
                    <button
                      onClick={() => copyToClipboard(auditData.remediation?.compliant_description || '', 'desc')}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-emerald-100 transition-colors"
                    >
                      {copiedField === 'desc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'desc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">{auditData.remediation.compliant_description}</p>
                </div>
              </div>

              {/* Diff list */}
              <div>
                <p className="font-bold text-xs text-slate-800 mb-3">Required Text Substitutions</p>
                <div className="space-y-2">
                  {auditData.remediation.diff_items.map((diff, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-slate-400 font-semibold">{diff.original_phrase}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-emerald-700">{diff.compliant_phrase}</span>
                      </div>
                      <span className="text-slate-500 font-medium">{diff.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Trade Economics */}
          {activeResultTab === 'economics' && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-card p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Trade Economics & Friction Ranks</h3>
                <p className="text-xs text-slate-400 mt-0.5">Compare de minimis limits, tariffs, and duty schemes for this product</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {auditData.trade_economics.map(e => (
                  <div key={e.country_code} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{e.country_name}</span>
                      <span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded">#{e.entry_friction_rank}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>De Minimis:</span>
                        <span className="font-bold text-slate-800">{e.de_minimis_currency} {e.de_minimis_threshold}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Est Duty:</span>
                        <span className="font-bold text-slate-800">{e.estimated_duty_rate}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>VAT / GST:</span>
                        <span className="font-bold text-slate-800">{e.vat_gst_rate}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 leading-relaxed">{e.recommendation_summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cryptographic Hash Verification Modal */}
      {showHashModal && auditData && (
        <HashVerificationModal
          isOpen={showHashModal}
          onClose={() => setShowHashModal(false)}
          auditData={auditData}
        />
      )}

      {/* What Do I Need Modal */}
      <WhatDoINeedModal
        isOpen={showWhatDoINeedModal}
        onClose={() => setShowWhatDoINeedModal(false)}
        auditData={auditData}
        productName={form.title || 'Audited Listing'}
      />

      {/* AI Description Generator Modal */}
      <AIDescriptionGeneratorModal
        isOpen={showAiDescModal}
        onClose={() => setShowAiDescModal(false)}
        initialTitle={form.title}
        initialDescription={form.description}
        onApply={(newDesc) => setForm(f => ({ ...f, description: newDesc }))}
      />
    </div>
  );
}

export default function NewAuditPage() {
  return (
    <AppShell>
      <NewAuditContent />
    </AppShell>
  );
}
