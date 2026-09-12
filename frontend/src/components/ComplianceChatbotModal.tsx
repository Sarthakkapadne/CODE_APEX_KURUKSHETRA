'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, X, Loader2, Sparkles, DollarSign,
  FileCheck, ShieldAlert, Calculator, Globe, ArrowRight,
  TrendingUp, CheckCircle2, AlertCircle, RefreshCw, HelpCircle, BookOpen
} from 'lucide-react';
import { sendChatMessage, calculateProfit, fetchRequiredDocuments, fetchSupportedCountries } from '../lib/api';

interface ComplianceChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductContext?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  data?: {
    profit_calculation?: any;
    document_checklist?: any[];
    country_code?: string;
    category?: string;
  };
}

const PRESET_PROMPTS = [
  {
    label: 'Tariff & Profit in Germany',
    prompt: 'What is the tariff of my cosmetic cream in Germany and how much profit will I get if I sell for $35 with a product cost of $10?'
  },
  {
    label: 'Required Documents for US vs Canada',
    prompt: 'Which type of documents and laboratory test certificates do I need for selling cosmetic products in the US vs Canada?'
  },
  {
    label: 'Baby Walker Prohibition in Canada',
    prompt: 'What are the compliance rules for baby walkers in Canada vs the UK? Are there any outright product bans?'
  },
  {
    label: 'Electronics Tariff & Docs in Japan',
    prompt: 'What is the import tariff and what documents/certifications do I need to sell rechargeable lithium battery devices in Japan?'
  },
  {
    label: 'India BIS & CDSCO Rules',
    prompt: 'What are the mandatory compliance rules, BIS ISI mark requirements, and CDSCO registration needed to import goods into India?'
  },
  {
    label: 'Bamboo Cutting Board EPA Trap',
    prompt: 'Why does an antibacterial bamboo cutting board trigger EPA pesticide regulations in the US, and how can I fix it?'
  }
];

function formatBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderFormattedMessage(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-sm font-bold text-sky-300 mt-2.5 mb-1">
          {line.replace('### ', '')}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-base font-extrabold text-white mt-3 mb-1.5">
          {line.replace('## ', '')}
        </h3>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      return (
        <div key={idx} className="flex items-start space-x-2 my-1 pl-1">
          <span className="text-sky-400 mt-1.5 text-[7px] shrink-0">●</span>
          <span className="text-slate-200 leading-relaxed">{formatBoldText(content)}</span>
        </div>
      );
    }
    const numMatch = line.match(/^(\d+\.)\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start space-x-2 my-1 pl-1">
          <span className="text-sky-400 font-bold text-xs shrink-0">{numMatch[1]}</span>
          <span className="text-slate-200 leading-relaxed">{formatBoldText(numMatch[2])}</span>
        </div>
      );
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-1.5" />;
    }
    return (
      <p key={idx} className="my-0.5 text-slate-200 leading-relaxed">
        {formatBoldText(line)}
      </p>
    );
  });
}

export default function ComplianceChatbotModal({
  isOpen,
  onClose,
  initialProductContext
}: ComplianceChatbotModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'calculator' | 'documents'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `### 👋 Welcome to the **LexPort Compliance & Trade AI Copilot**\n\nPowered by **Gemini 3.6 Flash** and grounded in our 10-country statutory rule base, I can help you with:\n\n- 💰 **Import Tariffs & Taxes**: Exact customs tariffs, de minimis thresholds, and import VAT/GST for any product.\n- 📈 **Profit & Landed Cost Modeling**: Precise calculations showing unit margin, landed cost, and net profit in USD and local destination currency.\n- 📋 **Mandatory Document Checklists**: Itemizing every certificate, DoC, lab test (e.g. CPC, CE DoC, UN 38.3, BIS ISI), and labeling rule required for legal import.\n- ⚖️ **Cross-Border Classification Traps**: Explaining how laws differ across US, Canada, EU, UK, Japan, Australia, India, China, Germany, and Vietnam.\n\n*Select a preset query below or ask any question about your product!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculator form state
  const [calcCountry, setCalcCountry] = useState<string>('DE');
  const [calcCategory, setCalcCategory] = useState<string>('cosmetics');
  const [calcSellingPrice, setCalcSellingPrice] = useState<number>(35.0);
  const [calcUnitCost, setCalcUnitCost] = useState<number>(10.0);
  const [calcShippingCost, setCalcShippingCost] = useState<number>(5.0);
  const [calcResult, setCalcResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Document checklist state
  const [docCountry, setDocCountry] = useState<string>('US');
  const [docCategory, setDocCategory] = useState<string>('cosmetics');
  const [docList, setDocList] = useState<any[]>([]);
  const [isDocLoading, setIsDocLoading] = useState<boolean>(false);
  const [supportedCountries, setSupportedCountries] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    fetchSupportedCountries()
      .then(data => {
        if (active && data?.countries) {
          setSupportedCountries(data.countries);
        }
      })
      .catch(err => console.warn('Could not load countries:', err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await sendChatMessage(text, historyPayload, initialProductContext);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: {
          profit_calculation: res.profit_calculation,
          document_checklist: res.document_checklist,
          country_code: res.country_code,
          category: res.category
        }
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `⚠️ **Unable to fetch response**: ${err.message || 'Network error'}. Please try asking again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCalculator = async () => {
    setIsCalculating(true);
    try {
      const res = await calculateProfit({
        category: calcCategory,
        country_code: calcCountry,
        selling_price_usd: calcSellingPrice,
        unit_cost_usd: calcUnitCost,
        shipping_cost_usd: calcShippingCost
      });
      setCalcResult(res);
    } catch (e) {
      console.error('Calc error:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleLoadDocs = async () => {
    setIsDocLoading(true);
    try {
      const res = await fetchRequiredDocuments(docCategory, docCountry);
      setDocList(res);
    } catch (e) {
      console.error('Doc error:', e);
    } finally {
      setIsDocLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  LexPort Compliance & Trade AI Copilot
                </h3>
                <span className="text-[10px] uppercase font-mono font-black tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Gemini 3.6 Flash Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tariffs, Landed Cost Economics, Document Checklists &amp; Cross-Border Regulatory Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: Date.now().toString(),
                    sender: 'bot',
                    text: '🧹 Conversation reset. Ask me anything about cross-border compliance, tariffs, profit margins, or required documents!',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5 gap-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'chat'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Copilot Chat</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('calculator');
              if (!calcResult) handleRunCalculator();
            }}
            className={`py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'calculator'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Tariff &amp; Profit Calculator</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('documents');
              if (docList.length === 0) handleLoadDocs();
            }}
            className={`py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'documents'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Document Checklist Explorer</span>
          </button>
        </div>

        {/* TAB 1: AI COPILOT CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60">
            {/* Quick Suggestion Prompts */}
            <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-slate-500 text-[11px] shrink-0 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Prompts:
              </span>
              {PRESET_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-950 hover:border-indigo-500/60 border border-slate-700/80 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition-all shadow-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 text-[11px] text-slate-500">
                    <span>{m.sender === 'user' ? 'You' : 'LexPort Copilot'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-br-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {/* Render message with line breaks and direct text formatting */}
                    <div className="font-sans space-y-1">
                      {renderFormattedMessage(m.text)}
                    </div>

                    {/* Quick Action button if message returned profit data */}
                    {m.data?.profit_calculation && (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-bold">
                          Margin: {m.data.profit_calculation.profit_margin_percent} ({m.data.profit_calculation.net_profit_local})
                        </span>
                        <button
                          onClick={() => {
                            setCalcCountry(m.data?.country_code || 'US');
                            setCalcCategory(m.data?.category || 'cosmetics');
                            setCalcResult(m.data?.profit_calculation);
                            setActiveTab('calculator');
                          }}
                          className="text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
                        >
                          <span>Open in Calculator</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  </div>
                  <span>Analyzing statutes, calculating tariffs &amp; formulating compliance guidance...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about tariffs, profit calculations, required documents, or country compliance..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: TARIFF & PROFIT CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-900/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Inputs Form */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-md">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Trade Economics Inputs</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Destination Country</label>
                  <select
                    value={calcCountry}
                    onChange={(e) => setCalcCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {supportedCountries && supportedCountries.length > 0 ? (
                      supportedCountries.map((c: any) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.de_minimis_description || c.currency})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="US">🇺🇸 United States (Section 321 $800 de minimis)</option>
                        <option value="CA">🇨🇦 Canada (CAD $20 de minimis)</option>
                        <option value="EU">🇪🇺 European Union (IOSS €150 scheme)</option>
                        <option value="DE">🇩🇪 Germany (19% MwSt &amp; LUCID)</option>
                        <option value="UK">🇬🇧 United Kingdom (£135 scheme)</option>
                        <option value="JP">🇯🇵 Japan (¥10,000 de minimis)</option>
                        <option value="AU">🇦🇺 Australia ($1,000 AUD de minimis)</option>
                        <option value="IN">🇮🇳 India (ICEGATE &amp; BIS compliance)</option>
                        <option value="CN">🇨🇳 China (CBEC 9.1% preferential tax)</option>
                        <option value="VN">🇻🇳 Vietnam (1M VND de minimis)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Product Category</label>
                  <select
                    value={calcCategory}
                    onChange={(e) => setCalcCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cosmetics">Cosmetics &amp; Personal Care (Cream, Skincare)</option>
                    <option value="toys">Toys &amp; Children Products (Baby Walker, Stroller)</option>
                    <option value="kitchenware">Kitchenware &amp; Tableware (Cutting Board)</option>
                    <option value="electronics">Consumer Electronics (Rechargeable Wand)</option>
                    <option value="general">General Consumer Goods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Selling Price (MSRP USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.5"
                      value={calcSellingPrice}
                      onChange={(e) => setCalcSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Unit Manufacturing Cost (COGS USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.5"
                      value={calcUnitCost}
                      onChange={(e) => setCalcUnitCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Unit Freight &amp; Shipping (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.5"
                      value={calcShippingCost}
                      onChange={(e) => setCalcShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunCalculator}
                  disabled={isCalculating}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/20"
                >
                  {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Recalculate Landed Profit</span>}
                </button>
              </div>

              {/* Output Economics Card */}
              {calcResult && (
                <div className="md:col-span-2 space-y-5">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-md">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Projected Landed Economics</span>
                        <h3 className="text-lg font-black text-white">{calcResult.country_name} ({calcResult.country_code})</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Net Profit Margin</span>
                        <div className="text-xl font-black text-emerald-400">{calcResult.profit_margin_percent}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] text-slate-400">Customs Tariff</span>
                        <div className="text-base font-bold text-white mt-0.5">{calcResult.duty_rate_percent}</div>
                        <span className="text-[10px] text-slate-500">${calcResult.duty_amount_usd.toFixed(2)} USD</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] text-slate-400">Import VAT/GST</span>
                        <div className="text-base font-bold text-white mt-0.5">{calcResult.vat_gst_percent}</div>
                        <span className="text-[10px] text-slate-500">${calcResult.estimated_tax_usd.toFixed(2)} USD</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] text-slate-400">Total Landed Cost</span>
                        <div className="text-base font-bold text-rose-400 mt-0.5">${calcResult.total_landed_cost_usd.toFixed(2)}</div>
                        <span className="text-[10px] text-slate-500">COGS + Freight + Duty</span>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                        <span className="text-[11px] text-emerald-400 font-bold">Net Profit</span>
                        <div className="text-base font-black text-emerald-300 mt-0.5">${calcResult.net_profit_usd.toFixed(2)}</div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">{calcResult.net_profit_local}</span>
                      </div>
                    </div>

                    {/* De Minimis Alert Box */}
                    <div className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${
                      calcResult.qualifies_de_minimis
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    }`}>
                      {calcResult.qualifies_de_minimis ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="text-xs space-y-1">
                        <div className="font-bold">
                          De Minimis Threshold: {calcResult.de_minimis_threshold}
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {calcResult.recommendation}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          handleSendMessage(
                            `Analyze my landed cost and profit for selling ${calcCategory} in ${calcResult.country_name}: Selling Price $${calcSellingPrice}, Product Cost $${calcUnitCost}, Freight $${calcShippingCost}. What specific documents are needed?`
                          );
                          setActiveTab('chat');
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
                      >
                        <span>Discuss this calculation with Copilot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENT CHECKLIST EXPLORER */}
        {activeTab === 'documents' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-900/60">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <FileCheck className="w-5 h-5 text-sky-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Statutory Pre-Market Document Matrix</h4>
                  <p className="text-xs text-slate-400">View exact mandatory lab test certificates, DoCs, and registrations</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={docCountry}
                  onChange={(e) => setDocCountry(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  {supportedCountries && supportedCountries.length > 0 ? (
                    supportedCountries.map((c: any) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="US">🇺🇸 United States</option>
                      <option value="CA">🇨🇦 Canada</option>
                      <option value="EU">🇪🇺 European Union</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="UK">🇬🇧 United Kingdom</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="AU">🇦🇺 Australia</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="CN">🇨🇳 China</option>
                      <option value="VN">🇻🇳 Vietnam</option>
                    </>
                  )}
                </select>

                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="cosmetics">Cosmetics</option>
                  <option value="toys">Toys</option>
                  <option value="kitchenware">Kitchenware</option>
                  <option value="electronics">Electronics</option>
                </select>

                <button
                  onClick={handleLoadDocs}
                  disabled={isDocLoading}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  {isDocLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Refresh</span>}
                </button>
              </div>
            </div>

            {/* Document Cards */}
            <div className="space-y-3">
              {docList.length > 0 ? (
                docList.map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                          {doc.doc_code}
                        </span>
                        <h5 className="text-sm font-bold text-white pt-1">{doc.doc_name}</h5>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                        Mandatory
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 text-slate-400">
                      <div><strong className="text-slate-300">Issuing Body:</strong> {doc.issuing_authority}</div>
                      <div><strong className="text-slate-300">Statute:</strong> <em>{doc.statutory_citation}</em></div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300">
                      <strong className="text-sky-400">Seller Action Required:</strong> {doc.seller_action_needed}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                  {isDocLoading ? 'Loading document checklist...' : 'Click Refresh to load required documents for this country and category.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
