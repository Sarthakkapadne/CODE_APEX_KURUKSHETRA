'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Eye, EyeOff, ArrowRight, Shield, CheckCircle2, Globe } from 'lucide-react';
import { useAuth, UserRole } from '../../lib/auth';

const DEMO_ACCOUNTS = [
  { role: 'seller'  as UserRole, email: 'seller@demo.com',   label: 'Seller',          desc: 'Products & basic audits',   color: 'border-blue-200 hover:border-blue-400 bg-blue-50/40', active: 'border-blue-500 bg-blue-50 text-blue-800' },
  { role: 'manager' as UserRole, email: 'manager@demo.com',  label: 'Compliance Mgr',  desc: 'Rules & escalations',        color: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40', active: 'border-indigo-500 bg-indigo-50 text-indigo-800' },
  { role: 'exporter'as UserRole, email: 'exporter@demo.com', label: 'Trade Ops',        desc: 'Tariffs & economics',        color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40', active: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
];

const HERO_FEATURES = [
  { icon: Shield,       text: 'Multi-market compliance in one audit' },
  { icon: CheckCircle2, text: 'SHA-256 tamper-evident audit trail' },
  { icon: Globe,        text: 'Real regulatory citations, no guesswork' },
];

function LoginForm() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('seller@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('seller');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, selectedRole);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials. Try one of the demo accounts below.');
    }
  }

  function selectDemo(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email);
    setSelectedRole(acc.role);
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Illustration Panel ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-700/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-900/30 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-white">LexPort</span>
              <p className="text-[10px] text-primary-300 font-semibold">Cross-Border Compliance Co-Pilot</p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              Know what you need.<br />Before you ship.
            </h2>
            <p className="text-primary-200 text-sm leading-relaxed">
              Check product compliance across countries, identify missing requirements, and generate a verified dossier — all in one workspace.
            </p>
          </div>

          <div className="space-y-3">
            {HERO_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-sm text-primary-100 font-medium">{f.text}</p>
                </div>
              );
            })}
          </div>

          {/* Demo markets */}
          <div className="flex flex-wrap gap-2">
            {['🇺🇸 US', '🇪🇺 EU', '🇬🇧 UK', '🇨🇦 CA', '🇯🇵 JP'].map(m => (
              <span key={m} className="text-xs font-bold bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom trust indicators */}
        <div className="relative z-10 flex items-center gap-2 text-[11px] text-primary-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>EU AI Act Compliant · SHA-256 Audit Trail · Zero Fabricated Claims</span>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-blue">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-primary-700">LexPort</span>
            </Link>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-black text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your compliance workspace</p>
          </div>

          {/* Demo Role Quick-Select */}
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Demo — Select a Role</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => selectDemo(acc)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    email === acc.email ? acc.active + ' border-2 shadow-sm' : acc.color + ' border text-slate-700'
                  }`}
                >
                  <p className="font-black text-xs">{acc.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all pr-11"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-primary-600" />
                <span className="text-sm">Remember me</span>
              </label>
              <button type="button" className="text-primary-600 font-semibold text-sm hover:underline">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-3.5 rounded-xl shadow-blue transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or</span></div>
            </div>

            <button
              type="button"
              onClick={() => { setEmail('seller@demo.com'); setPassword('demo1234'); setSelectedRole('seller'); }}
              className="w-full border border-slate-200 hover:border-primary-200 hover:bg-primary-50/40 text-slate-600 font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-primary-500" />
              Continue with Demo Account
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-600 font-bold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
