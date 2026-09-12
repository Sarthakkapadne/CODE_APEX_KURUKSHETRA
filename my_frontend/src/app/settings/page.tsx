'use client';
import React, { useState } from 'react';
import { User, Shield, Key, Bell, Save, Check } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { useAuth, UserRole } from '../../lib/auth';

function SettingsContent() {
  const { user, login } = useAuth();
  const [role, setRole] = useState<UserRole>(user?.role || 'seller');
  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (user) {
      login(user.email, 'pass', role);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Account & Preferences</h1>
        <p className="text-sm text-slate-500 mt-1">Manage user role, notification settings, and organization preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary-600" /> Profile Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
              <input
                type="text" value={company} onChange={e => setCompany(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email" value={user?.email || ''} disabled
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Role Switcher */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" /> Active Platform Role
          </h2>
          <p className="text-xs text-slate-400">Switching role adjusts accessible views, sidebar navigation, and actions across LexPort.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { id: 'seller', label: 'Seller', desc: 'Listing submission & audit views' },
              { id: 'manager', label: 'Compliance Manager', desc: 'Rules library & escalation approval' },
              { id: 'exporter', label: 'Exporter / Trade Ops', desc: 'Trade economics & tariff analytics' },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as UserRole)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === r.id ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-sm text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* API Keys / Backend URL */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-600" /> API Integration
          </h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">FastAPI Backend Endpoint</label>
            <input
              type="text" value={process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'} disabled
              className="w-full border border-slate-200 bg-slate-50 font-mono text-xs rounded-xl px-4 py-2.5 text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-blue transition-colors flex items-center gap-2"
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}
