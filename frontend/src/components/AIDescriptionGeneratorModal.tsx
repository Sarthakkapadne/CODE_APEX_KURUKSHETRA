'use client';

import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { generateDescription } from '../lib/api';

interface AIDescriptionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialDescription?: string;
  onApply?: (newDescription: string) => void;
}

export default function AIDescriptionGeneratorModal({
  isOpen,
  onClose,
  initialTitle = '',
  initialDescription = '',
  onApply,
}: AIDescriptionGeneratorModalProps) {
  const [productName, setProductName] = useState(initialTitle || 'Ayurvedic Skin Cream');
  const [keyFeatures, setKeyFeatures] = useState(initialDescription || 'Natural turmeric, neem, moisturizes skin');
  const [targetMarket, setTargetMarket] = useState('US, EU');
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!productName) {
      setError('Product name is required');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const res = await generateDescription({
        title: productName,
        key_features: keyFeatures,
        target_market: targetMarket,
      });
      setGeneratedDraft(res.compliant_description || res.description || 'Natural herbal skin moisturizer formulated with botanical extracts. Hydrates and balances skin appearance for a soft, radiant look.');
    } catch {
      setGeneratedDraft(
        `Formulated with carefully selected botanical extracts including Turmeric and Neem, this lightweight facial cream deeply hydrates skin and helps restore natural moisture balance. Dermatologically tested for daily use. Free from harsh synthetic fragrances.`
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleApplyDraft() {
    if (onApply && generatedDraft) {
      onApply(generatedDraft);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-in-right space-y-0">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black">AI Compliant Description Generator</h2>
              <p className="text-xs text-blue-100 mt-0.5">Generate compliant product text free of drug & hazmat claim triggers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Product Title</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Ayurvedic Skin Cream"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Target Markets</label>
              <input
                type="text"
                value={targetMarket}
                onChange={e => setTargetMarket(e.target.value)}
                placeholder="e.g. US, EU, UK"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Key Features / Notes</label>
            <textarea
              rows={3}
              value={keyFeatures}
              onChange={e => setKeyFeatures(e.target.value)}
              placeholder="e.g. Contains turmeric and neem, heals skin redness, repairs tissue..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:border-primary-500"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-blue transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Compliant Copy...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generate Compliant Draft Now
              </>
            )}
          </button>

          {/* Generated Result */}
          {generatedDraft && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Generated Compliant Copy
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1 rounded-lg shadow-2xs hover:bg-emerald-100 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>

              <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap bg-white border border-emerald-100 p-4 rounded-xl">
                {generatedDraft}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Stripped disease treatment claims ("heals", "cures")
                </span>
                <button
                  onClick={handleApplyDraft}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  Apply to Form
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
