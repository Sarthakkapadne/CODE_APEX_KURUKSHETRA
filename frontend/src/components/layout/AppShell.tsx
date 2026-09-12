'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import CommandPaletteModal from '../CommandPaletteModal';
import GlobalChatWidget from '../GlobalChatWidget';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onOpenSearch={() => setIsSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
      <CommandPaletteModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <GlobalChatWidget />
    </div>
  );
}
