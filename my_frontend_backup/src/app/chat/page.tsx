'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Search, MessageSquare, Clock, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Scale } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { queryIntelligence } from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp: Date;
}

interface Thread {
  id: string;
  title: string;
  status: 'pass' | 'warning' | 'violation' | 'escalation';
  date: string;
  messages: Message[];
}

const INITIAL_THREADS: Thread[] = [
  {
    id: 't1', title: 'Wireless Charger — EU Audit', status: 'warning', date: 'Today',
    messages: [
      { id: 'm1', role: 'user', content: 'Why did the EU audit fail?', timestamp: new Date() },
      { id: 'm2', role: 'assistant', content: 'The EU audit returned 2 warnings related to mandatory labeling. Specifically, the product description lacks a "Responsible Person" declaration required under EU Regulation 2019/1020. Additionally, the product does not declare country-of-origin in the prescribed bilingual format where applicable.\n\nBoth issues are fixable by updating the product description.', citations: ['EU Reg 2019/1020 Art. 4', 'EU Cosmetics Reg 1223/2009'], timestamp: new Date() },
    ]
  },
  {
    id: 't2', title: 'Beauty Serum — Canada Audit', status: 'violation', date: 'Today',
    messages: []
  },
  {
    id: 't3', title: 'Laptop Battery — US Audit', status: 'pass', date: 'Yesterday',
    messages: []
  },
];

const SUGGESTIONS = [
  'Why did Canada fail?',
  'What documents are missing?',
  'Which market is easiest to enter?',
  'What changed after the EU rule update?',
  'Can I sell this in Japan without CE mark?',
];

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pass: 'bg-green-500', warning: 'bg-amber-500',
    violation: 'bg-red-500', escalation: 'bg-indigo-500',
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || 'bg-slate-300'}`} />;
}

function ChatContent() {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeThread, setActiveThread] = useState<Thread>(INITIAL_THREADS[0]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread.messages]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: `m-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    const updated = { ...activeThread, messages: [...activeThread.messages, userMsg] };
    setActiveThread(updated);
    setThreads(ts => ts.map(t => t.id === updated.id ? updated : t));
    setInput('');
    setIsLoading(true);

    try {
      const res = await queryIntelligence(text);
      const answer = res.answer || res.result || 'I was able to query the compliance database. No specific results found for that query.';
      const citations = res.citations || res.cited_rules || [];
      const assistantMsg: Message = { id: `m-${Date.now() + 1}`, role: 'assistant', content: answer, citations, timestamp: new Date() };
      const final = { ...updated, messages: [...updated.messages, assistantMsg] };
      setActiveThread(final);
      setThreads(ts => ts.map(t => t.id === final.id ? final : t));
    } catch {
      const assistantMsg: Message = {
        id: `m-${Date.now() + 1}`, role: 'assistant',
        content: 'The compliance intelligence service is temporarily unavailable. Please ensure the backend API is running at http://127.0.0.1:8000.',
        timestamp: new Date()
      };
      const final = { ...updated, messages: [...updated.messages, assistantMsg] };
      setActiveThread(final);
      setThreads(ts => ts.map(t => t.id === final.id ? final : t));
    } finally {
      setIsLoading(false);
    }
  }

  function newChat() {
    const t: Thread = {
      id: `t-${Date.now()}`, title: 'New Conversation', status: 'pass',
      date: 'Today', messages: []
    };
    setThreads([t, ...threads]);
    setActiveThread(t);
  }

  const grouped = [
    { label: 'Today', items: threads.filter(t => t.date === 'Today') },
    { label: 'Yesterday', items: threads.filter(t => t.date === 'Yesterday') },
    { label: 'Older', items: threads.filter(t => !['Today', 'Yesterday'].includes(t.date)) },
  ].filter(g => g.items.length > 0);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Rail */}
      <div className="w-64 border-r border-slate-100 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 space-y-3">
          <button onClick={newChat} className="w-full flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-blue transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search chats…"
              className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none flex-1"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 pb-4 space-y-4">
          {grouped.map(g => (
            <div key={g.label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">{g.label}</p>
              <div className="space-y-1">
                {g.items
                  .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveThread(t)}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        activeThread.id === t.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <StatusDot status={t.status} />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <MessageSquare className="w-4 h-4 text-primary-600" />
          <h2 className="font-semibold text-slate-800">{activeThread.title}</h2>
          <StatusDot status={activeThread.status} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeThread.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                <Scale className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">LexPort AI Copilot</h3>
                <p className="text-sm text-slate-500 max-w-sm">Ask anything about compliance, rules, markets, or missing documents. I'll answer using your actual audit data.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-left text-sm text-slate-600 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 border border-slate-200 hover:border-primary-200 px-4 py-2.5 rounded-xl transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeThread.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                  <Scale className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[70%] ${msg.role === 'user' ? 'chat-user px-4 py-3' : 'chat-assistant px-4 py-3'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.citations.map((c, i) => (
                      <span key={i} className="text-[10px] font-mono font-semibold bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full text-primary-700">{c}</span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about compliance, missing docs, market rules…"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl shadow-blue transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">LexPort AI uses actual rule data. No fabricated compliance results.</p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AppShell>
      <ChatContent />
    </AppShell>
  );
}
