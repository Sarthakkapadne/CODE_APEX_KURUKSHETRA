'use client';
import React, { useState } from 'react';
import { Sparkles, Globe, Link2, FileText, Check, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { ListingInput as ListingInputType, PresetListing } from '../lib/types';
import { CASE_PRESETS } from '../lib/presets';

interface ListingInputProps {
  onAudit: (input: ListingInputType) => void;
  isLoading: boolean;
  onScrape: (url: string) => Promise<any>;
}

const AVAILABLE_MARKETS = [
  { code: 'US', name: 'United States', flag: '🇺🇸', standard: 'FDA / EPA / CPSC' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺', standard: 'EC 1223 / CE / RoHS' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', standard: 'OPSS / UKCA / GB BPR' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', standard: 'Health Canada / CCPSA' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', standard: 'PMDA / PSE / METI' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', standard: 'TGA / ACCC / ABF' },
];

export default function ListingInput({ onAudit, isLoading, onScrape }: ListingInputProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(CASE_PRESETS[0].id);
  const [urlInput, setUrlInput] = useState<string>(CASE_PRESETS[0].source_url || '');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapedPreview, setScrapedPreview] = useState<any | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Form state initialized with default preset
  const [title, setTitle] = useState(CASE_PRESETS[0].title);
  const [description, setDescription] = useState(CASE_PRESETS[0].description);
  const [brandName, setBrandName] = useState(CASE_PRESETS[0].brand_name);
  const [price, setPrice] = useState<number | undefined>(CASE_PRESETS[0].price);
  const [countryOfOrigin, setCountryOfOrigin] = useState(CASE_PRESETS[0].country_of_origin);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['US', 'EU', 'UK', 'CA', 'JP', 'AU']);

  const handleSelectPreset = (preset: PresetListing) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setDescription(preset.description);
    setBrandName(preset.brand_name);
    setPrice(preset.price);
    setCountryOfOrigin(preset.country_of_origin);
    setScrapedPreview(null);
    setScrapeError(null);
    if (preset.source_url) setUrlInput(preset.source_url);
  };

  const handleToggleMarket = (code: string) => {
    if (selectedMarkets.includes(code)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter(m => m !== code));
      }
    } else {
      setSelectedMarkets([...selectedMarkets, code]);
    }
  };

  const handleSelectAllMarkets = () => {
    setSelectedMarkets(AVAILABLE_MARKETS.map(m => m.code));
  };

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) return;
    setIsScraping(true);
    setScrapeError(null);
    try {
      const data = await onScrape(urlInput.trim());
      if (data && data.title) {
        setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.brand_name) setBrandName(data.brand_name);
        if (data.price) setPrice(data.price);
        if (data.country_of_origin) setCountryOfOrigin(data.country_of_origin);
        setScrapedPreview(data);
      } else {
        setScrapeError('No product metadata could be extracted from this URL. Please verify the URL or enter details manually.');
      }
    } catch (e: any) {
      console.error(e);
      setScrapeError(e.message || 'Scraping failed. Marketplace anti-bot shields may be active.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAudit({
      title,
      description,
      brand_name: brandName,
      price: Number(price),
      country_of_origin: countryOfOrigin,
      destination_markets: selectedMarkets,
      source_url: activeTab === 'url' ? urlInput : undefined,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* ── Demo Presets Header ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Documented Real-World Failure Presets (1-Click Test)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Select a case study to stress-test LexPort</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { id: 'preset-ayurvedic-cream', icon: '🌿', label: 'Ayurvedic Cream', sub: 'US FDA Drug vs Cosmetic' },
            { id: 'preset-baby-walker', icon: '🚼', label: 'Baby Walker', sub: 'Canada Criminal Ban vs US/UK' },
            { id: 'preset-cutting-board', icon: '🔪', label: 'Bamboo Board', sub: 'US EPA Pesticide Trap' },
            { id: 'preset-sleep-positioner', icon: '🛌', label: 'Infant Sleep Wedge', sub: 'Safe Sleep Act Recall' },
            { id: 'preset-heated-eye-wand', icon: '⚡', label: 'Heated Eye Wand', sub: 'Lithium Hazmat / CE Mark' },
          ].map(p => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  const target = CASE_PRESETS.find(item => item.id === p.id);
                  if (target) handleSelectPreset(target);
                }}
                className={`text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-500/80 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <span>{p.icon}</span>
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {p.label}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">{p.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Destination Country Multi-Selector (Centerpiece Feature) ── */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Destination Target Markets (Simultaneous Multi-Market Matrix)
            </span>
          </div>
          <button
            type="button"
            onClick={handleSelectAllMarkets}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
          >
            Select All 5 Markets
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {AVAILABLE_MARKETS.map(market => {
            const isChecked = selectedMarkets.includes(market.code);
            return (
              <button
                key={market.code}
                type="button"
                onClick={() => handleToggleMarket(market.code)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isChecked
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{market.flag}</span>
                  <div className="text-left">
                    <div className="text-xs font-bold leading-tight">{market.name}</div>
                    <div className="text-[10px] text-slate-400">{market.code} · {market.standard}</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                  isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                }`}>
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Input Mode Tabs ── */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'text'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Listing Text & Metadata</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'url'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Import via Marketplace URL</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Paste marketing copy — LexPort extracts formal technical parameters
          </span>
        </div>

        {/* URL Import Tab */}
        {activeTab === 'url' && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 mb-4">
            <label className="block text-xs font-medium text-slate-300">
              Marketplace Product URL (Amazon, Shopify, Walmart, eBay)
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://www.amazon.com/dp/B0..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleScrapeUrl}
                disabled={isScraping || !urlInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-xs font-semibold text-white flex items-center space-x-1.5 transition-all"
              >
                {isScraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isScraping ? 'Scraping...' : 'Fetch & Parse Listing'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Extracts DOM metadata, bullet points, and pricing using automated stealth scrapers with intelligent schema fallback.
            </p>

            {/* Scraped Result Card */}
            {scrapedPreview && (
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Listing Successfully Fetched
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {scrapedPreview.scrape_method || 'LIVE_FETCH'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{scrapedPreview.title}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>Brand: <strong className="text-slate-200">{scrapedPreview.brand_name}</strong></span>
                    <span>Price: <strong className="text-slate-200">${Number(scrapedPreview.price).toFixed(2)}</strong></span>
                    <span>Origin: <strong className="text-slate-200">{scrapedPreview.country_of_origin}</strong></span>
                    <span>Category: <strong className="text-slate-200">{scrapedPreview.category_hint}</strong></span>
                  </div>
                </div>

                {scrapedPreview.description && (
                  <p className="text-xs text-slate-400 line-clamp-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 whitespace-pre-line">
                    {scrapedPreview.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAudit({
                        title: scrapedPreview.title,
                        description: scrapedPreview.description,
                        brand_name: scrapedPreview.brand_name,
                        price: Number(scrapedPreview.price),
                        country_of_origin: scrapedPreview.country_of_origin,
                        destination_markets: selectedMarkets,
                        source_url: urlInput,
                      });
                    }}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Multi-Market Compliance Audit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('text')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Edit in Form ➔
                  </button>
                </div>
              </div>
            )}

            {/* Error Notice */}
            {scrapeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <div className="font-bold">Scraping Notice</div>
                  <div>{scrapeError}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Product Title (Seller Marketing Copy)</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Product Description & Bullet Points (Informal Marketing Claims)
              </label>
              <span className="text-[10px] text-slate-500">Raw text containing potential disease, pesticide, or uncertified claims</span>
            </div>
            <textarea
              rows={4}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Declared Country of Origin</label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={e => setCountryOfOrigin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Retail Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:from-sky-700 active:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-sky-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Running 3-Tier Multi-Agent Audit...</span>
                  </>
                ) : (
                  <>
                    <span>Run Multi-Agent Compliance Audit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}
