'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Scale, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { queryIntelligence } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const QUICK_QUERIES = [
  'Latest compliance status?',
  'Any violations found?',
  'Show recent audits',
];

export default function GlobalChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      role: 'assistant',
      content: 'Hello! I\'m your LexPort AI Copilot. Ask me about compliance violations, market rules, audit history, or any regulatory question — I\'ll query your live database for real answers.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await queryIntelligence(msg);

      let content = '';
      if (res.answer) {
        content = res.answer;
      } else if (res.summary) {
        content = res.summary;
        if (res.data?.length > 0) {
          content += `\n\nFound ${res.data.length} record(s) in the database.`;
        } else if (res.data?.length === 0) {
          content += '\n\nNo records found yet. Run a compliance audit to generate data.';
        }
      } else {
        content = 'Query processed. No matching data found in the current audit records.';
      }

      const assistantMsg: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (!isOpen) setHasNew(true);
    } catch {
      setMessages(prev => [...prev, {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: '⚠ Connection error — make sure the LexPort backend is running at http://127.0.0.1:8000.',
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] flex flex-col bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-slate-200 overflow-hidden animate-slide-in-up" style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">LexPort Copilot</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-[10px] text-primary-100">AI Compliance Assistant · Live</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Scale className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 text-sm rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-tr-sm'
                      : msg.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-700 rounded-tl-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Scale className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Queries */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex-shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quick Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[11px] font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 focus-within:bg-white transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                placeholder="Ask about rules, violations, markets…"
                className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 min-w-0"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 shadow-sm"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="relative w-14 h-14 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full shadow-[0_4px_18px_rgba(37,99,235,0.4)] flex items-center justify-center transform transition-all hover:scale-105 active:scale-95"
        title="LexPort AI Copilot"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        {hasNew && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[8px] font-black text-white">!</span>
          </span>
        )}
      </button>
    </div>
  );
}
