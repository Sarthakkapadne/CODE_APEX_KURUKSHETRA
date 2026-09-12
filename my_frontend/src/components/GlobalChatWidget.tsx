'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Scale, Loader2 } from 'lucide-react';
import { queryIntelligence } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function GlobalChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: 'Hello! I am your LexPort AI Copilot. How can I help you with global compliance today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: `m-${Date.now()}`, role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await queryIntelligence(userMsg.content);
      const answer = res.answer || res.result || 'I could not find an answer in the database.';
      setMessages(prev => [
        ...prev,
        { id: `m-${Date.now() + 1}`, role: 'assistant', content: answer, timestamp: new Date() }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `m-${Date.now() + 1}`, role: 'assistant', content: 'Connection error. Make sure the LexPort backend is running.', timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[360px] h-[500px] bg-white rounded-2xl shadow-blue mb-4 border border-lexport-border flex flex-col overflow-hidden animate-slide-in-up">
          {/* Header */}
          <div className="bg-primary-600 px-4 py-4 flex items-center justify-between text-white shadow-sm shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">LexPort Copilot</h3>
                <p className="text-[10px] text-primary-100">AI Compliance Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1">
                    <Scale className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3.5 py-2.5 text-sm ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1">
                  <Scale className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="chat-assistant px-4 py-3 flex items-center">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-lexport-border shrink-0">
            <div className="flex items-center space-x-2 bg-slate-50 border border-lexport-border overflow-hidden rounded-xl pr-2 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-400 transition-all">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Ask about rules, markets..."
                className="flex-1 py-2.5 px-3 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg p-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full shadow-blue flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95 animate-fade-in"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
