'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Plus, Search, MessageSquare, Scale, Sparkles, Trash2,
  ChevronRight, Bot, User as UserIcon, Loader2, Clock, Copy, Check,
  ShieldCheck, Globe, AlertTriangle, FileText, BookOpen, Zap
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { queryIntelligence } from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  chart_type?: string;
  sql?: string;
  data?: any[];
  timestamp: Date;
  isError?: boolean;
}

interface Thread {
  id: string;
  title: string;
  preview: string;
  messages: Message[];
  createdAt: Date;
}

const SUGGESTION_GROUPS = [
  {
    label: 'Market Analysis',
    icon: Globe,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    suggestions: [
      'Which market has the most violations?',
      'Show compliance rates across all countries',
      'Compare EU vs US violation counts',
    ]
  },
  {
    label: 'Product Insights',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    suggestions: [
      'Which products failed the most audits?',
      'Show products with escalation required',
      'Top categories with verification issues',
    ]
  },
  {
    label: 'Audit Intelligence',
    icon: ShieldCheck,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    suggestions: [
      'Show overall compliance pass rate',
      'List recent audit verdicts breakdown',
      'How many audits ran this month?',
    ]
  },
];

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-blue mt-1">
          <Scale className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-tr-sm'
              : msg.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700 rounded-tl-sm'
              : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>

          {!isUser && !msg.isError && (
            <button
              onClick={copy}
              className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {msg.citations && msg.citations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {msg.citations.map((c, i) => (
              <span
                key={i}
                className="text-[10px] font-mono font-bold bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full text-primary-700"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {msg.sql && (
          <div className="w-full bg-slate-900 rounded-xl p-3 overflow-x-auto">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Generated SQL</p>
            <code className="text-xs font-mono text-emerald-400 whitespace-nowrap">{msg.sql}</code>
          </div>
        )}

        <p className={`text-[10px] px-1 ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
          {formatTimestamp(msg.timestamp)}
        </p>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
          <UserIcon className="w-4 h-4 text-slate-500" />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-blue mt-1">
        <Scale className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 px-6 py-12">
      <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-blue">
        <Scale className="w-8 h-8 text-white" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900">LexPort AI Copilot</h3>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          Ask anything about compliance, violations, markets, or regulations. I query your live audit database to answer with real data.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {SUGGESTION_GROUPS.map(group => {
          const Icon = group.icon;
          return (
            <div key={group.label}>
              <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border mb-2 ${group.color}`}>
                <Icon className="w-3 h-3" />
                {group.label}
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                {group.suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => onSuggest(s)}
                    className="text-left text-xs text-slate-600 bg-white hover:bg-primary-50 hover:text-primary-700 border border-slate-200 hover:border-primary-300 px-3.5 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400">
        Powered by Gemini NL-to-SQL · Queries run on live SQLite audit database
      </p>
    </div>
  );
}

function ChatContent() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isLoading]);

  // Create a new thread
  const createThread = useCallback(() => {
    const id = `thread-${Date.now()}`;
    const t: Thread = {
      id,
      title: 'New Conversation',
      preview: 'Ask anything about compliance…',
      messages: [],
      createdAt: new Date(),
    };
    setThreads(prev => [t, ...prev]);
    setActiveThreadId(id);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Initialize with one thread on first load
  useEffect(() => {
    createThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteThread = (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThreadId === id) {
      const remaining = threads.filter(t => t.id !== id);
      setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let threadId = activeThreadId;

    // If no active thread, create one
    if (!threadId) {
      threadId = `thread-${Date.now()}`;
      const t: Thread = {
        id: threadId,
        title: text.slice(0, 40),
        preview: text.slice(0, 60),
        messages: [],
        createdAt: new Date(),
      };
      setThreads(prev => [t, ...prev]);
      setActiveThreadId(threadId);
    }

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t;
      const isFirst = t.messages.length === 0;
      return {
        ...t,
        title: isFirst ? text.slice(0, 50) : t.title,
        preview: text.slice(0, 80),
        messages: [...t.messages, userMsg],
      };
    }));
    setInput('');
    setIsLoading(true);

    try {
      const res = await queryIntelligence(text);

      // Build a rich answer from the response
      let content = '';
      if (res.answer) {
        content = res.answer;
      } else if (res.summary && res.data && res.data.length > 0) {
        content = `${res.summary}\n\nFound ${res.data.length} record(s).`;
        if (res.data.length <= 8) {
          // Show data inline as a compact table
          const cols = Object.keys(res.data[0]);
          const header = cols.join(' | ');
          const separator = cols.map(() => '---').join(' | ');
          const rows = res.data.map((row: any) => cols.map(c => String(row[c] ?? '')).join(' | ')).join('\n');
          content += `\n\n${header}\n${separator}\n${rows}`;
        }
      } else if (res.summary) {
        content = res.summary;
        if (res.data?.length === 0) content += '\n\nNo records found in the database yet. Run a compliance audit first.';
      } else {
        content = 'Query executed successfully. No specific result available.';
      }

      const assistantMsg: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content,
        citations: res.citations || res.cited_rules || [],
        chart_type: res.chart_type,
        sql: res.sql,
        data: res.data,
        timestamp: new Date(),
      };

      setThreads(prev => prev.map(t => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          preview: content.slice(0, 80),
          messages: [...t.messages, assistantMsg],
        };
      }));
    } catch (err: any) {
      const errMsg: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Connection error. Please ensure the LexPort backend is running on http://127.0.0.1:8000. Start it with start_backend.bat.',
        timestamp: new Date(),
        isError: true,
      };
      setThreads(prev => prev.map(t => {
        if (t.id !== threadId) return t;
        return { ...t, messages: [...t.messages, errMsg] };
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const filteredThreads = threads.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50">
      {/* ── Left Rail ── */}
      <div className="w-64 bg-white border-r border-slate-100 flex flex-col flex-shrink-0">
        <div className="p-4 space-y-3 border-b border-slate-50">
          <button
            onClick={createThread}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-blue transition-all"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none flex-1 min-w-0"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredThreads.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8">No conversations yet</p>
          )}
          {filteredThreads.map(t => (
            <div
              key={t.id}
              className={`group flex items-start gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                activeThreadId === t.id
                  ? 'bg-primary-50 border border-primary-100'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
              onClick={() => setActiveThreadId(t.id)}
            >
              <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activeThreadId === t.id ? 'text-primary-600' : 'text-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${activeThreadId === t.id ? 'text-primary-700' : 'text-slate-700'}`}>
                  {t.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.preview}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteThread(t.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>EU AI Act Compliant · SHA-256 Ledger</span>
          </div>
        </div>
      </div>

      {/* ── Main Chat Panel ── */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-blue">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">
              {activeThread ? activeThread.title : 'LexPort AI Copilot'}
            </h2>
            <p className="text-[10px] text-slate-400">NL-to-SQL · Live Audit Database · Gemini AI</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600">Connected</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {!activeThread || activeThread.messages.length === 0 ? (
            <EmptyState onSuggest={(q) => sendMessage(q)} />
          ) : (
            <>
              {activeThread.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 focus-within:bg-white transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about violations, compliance scores, rule failures, market trends… (Enter to send)"
                  rows={1}
                  className="w-full bg-transparent py-3 px-4 text-sm outline-none text-slate-700 placeholder-slate-400 resize-none max-h-32 overflow-y-auto"
                  style={{ scrollbarWidth: 'thin' }}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl shadow-blue flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              ⌨ Enter to send · Shift+Enter for new line · Queries use read-only SQL against live database
            </p>
          </div>
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
