'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, ArrowRight, Check } from 'lucide-react';
import { AuthProvider, useAuth, UserRole } from '../../lib/auth';

const MARKETS = ['United States', 'European Union', 'United Kingdom', 'Canada', 'Japan'];
const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'seller', label: 'Seller', desc: 'I list products and need compliance checks per market.' },
  { value: 'manager', label: 'Compliance Manager', desc: 'I oversee compliance for my team and manage rule libraries.' },
  { value: 'exporter', label: 'Exporter / Trade Ops', desc: 'I focus on trade economics, HS codes, and market entry.' },
];

function SignupForm() {
  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', company: '', password: '',
    role: 'seller' as UserRole,
    markets: [] as string[],
  });

  function update(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }
  function toggleMarket(m: string) {
    setForm(f => ({ ...f, markets: f.markets.includes(m) ? f.markets.filter(x => x !== m) : [...f.markets, m] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signup({ ...form });
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-11 h-11 bg-primary-600 rounded-2xl flex items-center justify-center shadow-blue">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-primary-700">LexPort</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Start checking compliance in under 2 minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                placeholder="Priya Sharma"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
              <input
                type="text" required value={form.company} onChange={e => update('company', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                placeholder="My Company"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Email</label>
            <input
              type="email" required value={form.email} onChange={e => update('email', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password" required value={form.password} onChange={e => update('password', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              placeholder="Minimum 8 characters"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Your Role</label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update('role', r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    form.role === r.value
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                    {form.role === r.value && <Check className="w-4 h-4 text-primary-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Markets */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Markets <span className="text-slate-400 font-normal">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMarket(m)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    form.markets.includes(m)
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-primary-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-blue transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return <SignupForm />;
}
