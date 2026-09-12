'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Scale, FileText, BarChart3, BookOpen, ShieldCheck, X, ArrowRight, Zap } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const COMMANDS = [
    { title: 'Run Compliance Audit', desc: 'Check a new product listing across target markets', href: '/audit/new', icon: Zap, category: 'Quick Action' },
    { title: 'HS Code Classification', desc: 'Auto classify 6 to 10-digit tariff codes for customs', href: '/hs-classification', icon: Search, category: 'Analytics' },
    { title: 'View Audit History', desc: 'Browse past compliance checks & verified dossiers', href: '/dashboard', icon: ShieldCheck, category: 'Navigation' },
    { title: 'Trade Economics Advisor', desc: 'Compare duty rates, de-minimis, & tariffs', href: '/trade', icon: BarChart3, category: 'Analytics' },
    { title: 'Rules Library & Simulator', desc: 'Browse regulations & simulate policy updates', href: '/rules', icon: BookOpen, category: 'Legal' },
    { title: 'AI Copilot Chat', desc: 'Ask compliance questions in natural language', href: '/chat', icon: Scale, category: 'AI Tools' },
    { title: 'Export Compliance Reports', desc: 'Download SHA-256 sealed PDF dossiers', href: '/reports', icon: FileText, category: 'Reports' },
  ];

  const filtered = COMMANDS.filter(c =>
    !query || c.title.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-slide-in-right">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-primary-600" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command, page, or search query..."
            autoFocus
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-2xl hover:bg-primary-50/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-primary-600 shadow-2xs group-hover:border-primary-300">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-primary-700">{item.title}</p>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span>
                    </div>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">No matching commands found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>LexPort Command Palette</span>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="font-mono bg-white border border-slate-200 px-1 rounded">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
