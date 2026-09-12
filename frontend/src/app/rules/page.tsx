'use client';
import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Globe, ChevronDown, ChevronUp, Scale, X } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { getSimulationStatus, toggleSimulation, getRules } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import Link from 'next/link';

const SIMULATIONS = [
  { id: 'SIM_EU_H2O2_CAP', label: 'EU H₂O₂ cap: 0.1% → 0.05%', country: 'EU', impact: 'Affects beauty/personal care products with hydrogen peroxide.' },
  { id: 'SIM_CA_BILINGUAL_STRICT', label: 'CA Bilingual requirements tightened', country: 'CA', impact: 'Expands bilingual mandate to digital product descriptions.' },
  { id: 'SIM_US_DRUG_CLAIM', label: 'US FDA broadens disease claim triggers', country: 'US', impact: 'More "wellness" wording patterns trigger drug classification.' },
];

function RulesContent() {
  const { user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [simStates, setSimStates] = useState<Record<string, boolean>>({});
  const [simLoading, setSimLoading] = useState<string | null>(null);

  useEffect(() => {
    getSimulationStatus()
      .then(s => setSimStates(s))
      .catch(() => {});

    setLoading(true);
    getRules()
      .then(data => {
        if (data && data.length > 0) {
          setRules(data);
        }
      })
      .catch(err => {
        console.error('Failed to load rules from backend', err);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleSim(simId: string, current: boolean) {
    setSimLoading(simId);
    try {
      await toggleSimulation(simId, !current);
      setSimStates(s => ({ ...s, [simId]: !current }));
    } catch {}
    finally { setSimLoading(null); }
  }

  const countries = ['ALL', ...Array.from(new Set(rules.map(r => r.country).filter(Boolean)))];
  const categories = ['ALL', ...Array.from(new Set(rules.map(r => r.category).filter(Boolean)))];

  const filtered = rules.filter(r => {
    if (filterCountry !== 'ALL' && r.country !== filterCountry) return false;
    if (filterCategory !== 'ALL' && r.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchCitation = (r.citation || '').toLowerCase().includes(q);
      const matchReq = (r.requirement || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchName = (r.name || '').toLowerCase().includes(q);
      if (!matchCitation && !matchReq && !matchDesc && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Rules Library</h1>
        <p className="text-sm text-slate-500 mt-1">Browse and simulate regulatory changes across all markets</p>
      </div>

      {/* Regulatory Simulator */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Regulatory Simulator</h2>
          <p className="text-xs text-slate-400 mt-0.5">Simulate rule changes to preview compliance impact without publishing</p>
        </div>
        <div className="p-6 space-y-3">
          {SIMULATIONS.map(sim => (
            <div key={sim.id} className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all ${simStates[sim.id] ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800">{sim.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sim.impact}</p>
                {simStates[sim.id] && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    SIMULATION ACTIVE — Results are hypothetical
                  </span>
                )}
              </div>
              <button
                onClick={() => handleToggleSim(sim.id, !!simStates[sim.id])}
                disabled={simLoading === sim.id}
                className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors relative ${simStates[sim.id] ? 'bg-amber-500' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${simStates[sim.id] ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-card">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules…"
            className="text-sm text-slate-600 placeholder-slate-400 outline-none" />
        </div>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none shadow-card">
          {countries.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none shadow-card">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">{filtered.length} rules matching filters</p>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span>Querying 80+ statutory rules live from database...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No rules match your filters.</div>
          ) : (
            filtered.map(rule => (
              <button
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className="w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{rule.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{rule.citation}</span>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{rule.category}</span>
                        {rule.threshold && <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Threshold: {rule.threshold}</span>}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{rule.requirement}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{rule.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 flex-shrink-0">Updated {rule.updated}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Rule Detail Drawer */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setSelectedRule(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto animate-slide-in-right space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Rule Detail</h3>
              <button onClick={() => setSelectedRule(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedRule.flag}</span>
              <span className="font-mono text-sm font-bold text-primary-600">{selectedRule.citation}</span>
            </div>
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
              <p className="text-xs font-bold text-primary-600 mb-1">Legal Requirement</p>
              <p className="text-sm font-semibold text-slate-800">{selectedRule.requirement}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">Plain English</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedRule.description}</p>
            </div>
            {selectedRule.threshold && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700">Threshold: {selectedRule.threshold}</p>
              </div>
            )}
            <div className="flex gap-2 text-xs text-slate-400">
              <span>Country: <strong className="text-slate-600">{selectedRule.country}</strong></span>
              <span>·</span>
              <span>Category: <strong className="text-slate-600">{selectedRule.category}</strong></span>
              <span>·</span>
              <span>Updated: <strong className="text-slate-600">{selectedRule.updated}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  return (
    <AppShell>
      <RulesContent />
    </AppShell>
  );
}
