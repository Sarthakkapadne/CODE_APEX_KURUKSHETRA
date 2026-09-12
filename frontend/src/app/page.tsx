'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scale, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  Globe, Shield, FileText, Zap, Star, ShieldCheck, BarChart3,
  MessageSquare, Lock, ChevronRight, TrendingUp, Search
} from 'lucide-react';

const MARKETS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Submit Your Product', desc: 'Upload images, paste a link, or describe your product manually.', icon: Zap },
  { step: '02', title: 'Analyze Requirements', desc: 'Our rule engine checks all regulations across destination markets.', icon: ShieldCheck },
  { step: '03', title: 'Review & Fix Issues', desc: 'See exactly what is wrong, why, and get specific fix suggestions.', icon: AlertTriangle },
  { step: '04', title: 'Upload Documents', desc: 'Track required certifications, test reports, and labels.', icon: FileText },
  { step: '05', title: 'Export Dossier', desc: 'Generate a tamper-evident PDF compliance report with SHA-256 seal.', icon: Lock },
];

const FEATURES = [
  { icon: Scale, title: 'Multi-Market Compliance Matrix', desc: 'Instantly see pass/warning/violation status for every regulation across all markets in one grid.' },
  { icon: MessageSquare, title: 'AI Compliance Copilot', desc: 'Ask in plain language — "Why did Canada fail?" — and get grounded answers with rule citations.' },
  { icon: BarChart3, title: 'Trade Economics Advisor', desc: 'Compare duty rates, de-minimis thresholds, VAT/GST schemes, and entry friction across markets.' },
  { icon: Shield, title: 'Adversarial Debate Room', desc: 'Inspector vs. Seller Advocate AI debate drives out every compliance grey area before you import.' },
  { icon: FileText, title: 'Verified Compliance Dossier', desc: 'Export a country-by-country PDF report with cryptographic hash chain for audit-readiness.' },
  { icon: Globe, title: 'Fix Once, Resolve Everywhere', desc: 'Shared legal basis means fixing one root issue automatically resolves it across linked markets.' },
];

const TRUST_LOGOS = [
  'EU AI Act Compliant',
  'SHA-256 Hash Chain',
  'Zero Fabricated Claims',
  'Tier-1 Deterministic',
  'IATA DGR Verified',
];

const MARKET_SCAN_DEMO = [
  { market: '🇺🇸 US',     status: 'pass',      label: 'Ready' },
  { market: '🇪🇺 EU',     status: 'warning',   label: '2 Fixes' },
  { market: '🇬🇧 UK',     status: 'pass',      label: 'Ready' },
  { market: '🇨🇦 Canada', status: 'violation', label: 'Doc Missing' },
  { market: '🇯🇵 Japan',  status: 'escalation',label: 'Review' },
];

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCounterIdx, setActiveCounterIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveCounterIdx(i => (i + 1) % MARKET_SCAN_DEMO.length), 1400);
    return () => clearInterval(timer);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push('/audit/new');
  }

  return (
    <div className="bg-white">
      {/* ── Sticky Top Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-blue">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-primary-700 tracking-tight">LexPort</span>
            <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
              CO-PILOT
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#how-it-works" className="hover:text-primary-600 transition-colors">How It Works</Link>
            <Link href="#features"     className="hover:text-primary-600 transition-colors">Features</Link>
            <Link href="#markets"      className="hover:text-primary-600 transition-colors">Markets</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-blue"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Layered gradient background */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l from-blue-50/70 to-transparent pointer-events-none" />

        {/* Animated background orb */}
        <div className="absolute top-20 right-[10%] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-blue-100/60 to-primary-100/40 blur-3xl pointer-events-none hero-orb" />
        <div className="absolute top-40 left-[5%] w-[280px] h-[280px] rounded-full bg-gradient-to-br from-primary-50/50 to-transparent blur-2xl pointer-events-none" style={{ animation: 'orbFloat 9s ease-in-out infinite 2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: Hero Copy ── */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-full text-xs font-semibold text-primary-700">
                <Star className="w-3.5 h-3.5 fill-primary-400" />
                <span>EU AI Act Compliant · Zero Unsourced Assertions</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight">
                Know Before
                <span className="block blue-gradient-text">You Ship.</span>
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
                Check product compliance across countries, identify missing requirements, fix violations, and generate a verified compliance dossier — all from one workspace.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search a product, HS code, or rule..."
                    className="w-full border border-slate-200 bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-blue transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                >
                  Check Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />5+ markets</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Instant results</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Verified audit trail</span>
              </div>
            </div>

            {/* ── Right: Floating Demo Cards ── */}
            <div className="relative lg:h-[480px] hidden lg:block">

              {/* Main product scan card */}
              <div className="absolute top-6 right-4 w-72 bg-white rounded-2xl shadow-card-hover border border-slate-100 p-5 float-card-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PRODUCT SCAN</p>
                    <h3 className="font-black text-slate-800 mt-0.5">Wireless Charger</h3>
                  </div>
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  {MARKET_SCAN_DEMO.map((m, i) => (
                    <div
                      key={m.market}
                      className={`flex items-center justify-between text-sm transition-all duration-500 rounded-lg px-2 py-1 -mx-2 ${i === activeCounterIdx ? 'bg-slate-50' : ''}`}
                    >
                      <span className="text-slate-600 font-medium">{m.market}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-all ${
                        m.status === 'pass'       ? 'bg-emerald-50 text-emerald-700' :
                        m.status === 'warning'    ? 'bg-amber-50 text-amber-700' :
                        m.status === 'violation'  ? 'bg-rose-50 text-rose-700' :
                                                    'bg-indigo-50 text-indigo-700'
                      }`}>
                        {m.status === 'pass' ? '✓' : m.status === 'warning' ? '⚠' : m.status === 'violation' ? '✕' : '◉'} {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Confidence chip */}
              <div className="absolute top-0 left-8 bg-white rounded-2xl shadow-card-hover border border-slate-100 px-4 py-3 flex items-center gap-3 float-card-2">
                <div className="relative w-11 h-11">
                  <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#EFF6FF" strokeWidth="4" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#2563EB" strokeWidth="4"
                      strokeDasharray="113.1" strokeDashoffset="6.79" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary-700">94%</span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Evidence Confidence</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tier 1 · Deterministic</p>
                </div>
              </div>

              {/* Markets coverage chip */}
              <div className="absolute bottom-24 left-0 bg-white rounded-2xl shadow-card-hover border border-slate-100 px-4 py-3 float-card-3">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-primary-600" />
                  <p className="text-xs font-black text-slate-800">12 Markets Covered</p>
                </div>
                <p className="text-[10px] text-slate-400">US · EU · UK · CA · JP + 7 more</p>
              </div>

              {/* Stats chip */}
              <div className="absolute bottom-6 right-8 bg-primary-600 text-white rounded-2xl shadow-blue px-4 py-3">
                <p className="text-sm font-black">8 Passed</p>
                <p className="text-[10px] opacity-80">2 warnings · 1 missing doc</p>
              </div>

              {/* Fix action chip */}
              <div className="absolute top-[250px] left-4 bg-white rounded-2xl shadow-card-hover border border-amber-100 px-3.5 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-800">3 Fixes Available</p>
                  <p className="text-[9px] text-amber-600 font-semibold">EU · Canada · Japan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="border-y border-slate-100 bg-slate-50/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {TRUST_LOGOS.map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Markets Strip ── */}
      <section id="markets" className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-black text-slate-400 uppercase tracking-widest mb-8">
            One product. Every market.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {MARKETS.map(m => (
              <div key={m.code} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all feature-card cursor-default">
                <span className="text-2xl">{m.flag}</span>
                <div>
                  <p className="text-sm font-black text-slate-800">{m.code}</p>
                  <p className="text-[11px] text-slate-400">{m.name}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-2xl px-5 py-3 text-primary-600">
              <Globe className="w-5 h-5" />
              <div>
                <p className="text-sm font-black">+5 More</p>
                <p className="text-[11px] opacity-70">Expanding</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From product submission to verified compliance dossier in minutes.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent z-0" />
                  )}
                  <div className="relative bg-white border border-slate-100 rounded-2xl p-5 shadow-card hover:shadow-card-hover feature-card transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[11px] font-black text-primary-300 font-mono">{step.step}</span>
                      <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary-600" />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Everything You Need</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Built for sellers, exporters, and compliance managers who need to move fast without taking compliance risks.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card hover:shadow-card-hover feature-card transition-all group">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-black text-slate-800 mb-2 text-sm">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What You Get Section ── */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                The first 10 seconds should answer everything.
              </h2>
              <div className="space-y-4">
                {[
                  'I upload my product.',
                  'The system checks my destination countries.',
                  'It tells me exactly what is wrong.',
                  'It tells me what documents I need.',
                  'I fix it and re-audit in one click.',
                  'I generate a verified compliance report.',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-slate-300 text-sm font-medium">{item}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/signup"
                  className="bg-primary-600 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-primary-500 transition-colors text-sm text-center shadow-blue"
                >
                  Start for Free →
                </Link>
                <Link
                  href="/audit/new"
                  className="border border-slate-600 text-slate-300 font-bold px-7 py-3.5 rounded-xl hover:bg-slate-800 transition-colors text-sm text-center"
                >
                  Try a Live Audit
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Markets Supported', value: '12+', color: 'bg-primary-600' },
                { label: 'Compliance Checks', value: '50+', color: 'bg-emerald-600' },
                { label: 'Rule Citations', value: '200+', color: 'bg-indigo-600' },
                { label: 'Hash Verified', value: '100%', color: 'bg-amber-600' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                  <div className={`w-8 h-1 rounded-full ${s.color} mb-3`} />
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white text-lg">LexPort</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-900 text-primary-400 border border-primary-800">CO-PILOT</span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            © 2026 LexPort · EU AI Act Compliant · SHA-256 Hash Chain Audit Trail · Zero Unsourced Assertions
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link href="/login"  className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-slate-300 transition-colors">Sign Up</Link>
            <Link href="/audit/new" className="hover:text-slate-300 transition-colors">Run Audit</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
