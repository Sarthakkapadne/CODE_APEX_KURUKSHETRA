'use client';

import React, { useState } from 'react';
import { Search, Bell, Globe, ChevronDown, Shield, Check, X, CheckCircle2, AlertTriangle, FileText, Zap } from 'lucide-react';
import { useAuth, UserRole } from '../../lib/auth';

const MARKETS = [
  { code: 'ALL', name: 'Global View',     flag: '🌐' },
  { code: 'US',  name: 'United States',   flag: '🇺🇸' },
  { code: 'EU',  name: 'European Union',  flag: '🇪🇺' },
  { code: 'UK',  name: 'United Kingdom',  flag: '🇬🇧' },
  { code: 'CA',  name: 'Canada',          flag: '🇨🇦' },
  { code: 'JP',  name: 'Japan',           flag: '🇯🇵' },
];

const NOTIFICATIONS = [
  { id: 'n1', type: 'success', icon: CheckCircle2, title: 'Audit complete',       desc: 'Wireless Charger — 3 markets analyzed',  time: '2m ago',  read: false },
  { id: 'n2', type: 'warning', icon: AlertTriangle, title: 'Fix required',         desc: 'EU: Missing Responsible Person declaration', time: '18m ago', read: false },
  { id: 'n3', type: 'info',    icon: FileText,       title: 'Report ready',         desc: 'Compliance dossier PDF generated',          time: '1h ago',  read: true  },
  { id: 'n4', type: 'warning', icon: Zap,            title: 'Rule update detected', desc: 'EU Cosmetics Reg — threshold revised',       time: '3h ago',  read: true  },
];

interface TopNavProps {
  onOpenSearch?: () => void;
}

export default function TopNav({ onOpenSearch }: TopNavProps) {
  const { user, login, activeMarket, setActiveMarket } = useAuth();
  const [showRoleMenu,    setShowRoleMenu]    = useState(false);
  const [showMarketMenu,  setShowMarketMenu]  = useState(false);
  const [showUserMenu,    setShowUserMenu]    = useState(false);
  const [showNotifMenu,   setShowNotifMenu]   = useState(false);
  const [notifications,   setNotifications]   = useState(NOTIFICATIONS);

  const selectedMarketObj = MARKETS.find(m => m.code === activeMarket) || MARKETS[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; badgeColor: string }> = {
    seller:   { label: 'Seller',          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    manager:  { label: 'Compliance Mgr',  badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    exporter: { label: 'Exporter Ops',    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  const currentRoleInfo = roleLabels[user?.role || 'seller'];

  function markAllRead() {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }

  function closeAll() {
    setShowRoleMenu(false);
    setShowMarketMenu(false);
    setShowUserMenu(false);
    setShowNotifMenu(false);
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/92 backdrop-blur-md border-b border-slate-100 px-4 lg:px-6 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">

      {/* ── Left: Command Search ── */}
      <div className="flex items-center gap-4 flex-1 max-w-sm">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-slate-400 text-xs transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-600 transition-colors" />
            <span className="font-medium text-slate-500">Search rules, HS codes, audits…</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-2">

        {/* Live Rule Engine Status */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
          <span className="pulse-dot-green" />
          <span className="text-[11px] font-semibold text-slate-600">Rule Engine v3.2</span>
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowRoleMenu(v => !v); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${currentRoleInfo.badgeColor}`}
            title="Switch Demo Role"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{currentRoleInfo.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-in">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Role Context</p>
                <button onClick={() => setShowRoleMenu(false)} className="text-slate-300 hover:text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {[
                { id: 'seller',   label: 'Seller',                desc: 'Product listings & basic audits' },
                { id: 'manager',  label: 'Compliance Manager',     desc: 'Rules library & escalation approval' },
                { id: 'exporter', label: 'Exporter / Trade Ops',   desc: 'Tariffs & trade economics' },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    login(user?.email || 'demo@lexport.ai', 'pass', r.id as UserRole);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs ${
                    user?.role === r.id ? 'bg-primary-50/60 font-bold text-primary-700' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{r.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                  {user?.role === r.id && <Check className="w-3.5 h-3.5 text-primary-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Country Selector */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowMarketMenu(v => !v); }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all"
          >
            <span>{selectedMarketObj.flag}</span>
            <span className="hidden sm:inline">{selectedMarketObj.code === 'ALL' ? 'All Markets' : selectedMarketObj.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showMarketMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-scale-in">
              <div className="px-3 py-1 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Focus</p>
              </div>
              {MARKETS.map(m => (
                <button
                  key={m.code}
                  onClick={() => { setActiveMarket(m.code); setShowMarketMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    activeMarket === m.code ? 'font-bold text-primary-600 bg-primary-50/60' : 'text-slate-700'
                  }`}
                >
                  <span className="text-base">{m.flag}</span>
                  <span>{m.name}</span>
                  {activeMarket === m.code && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowNotifMenu(v => !v); }}
            className="relative w-9 h-9 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center text-slate-600 transition-all hover:bg-slate-100"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-scale-in overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-bold text-sm text-slate-800">Notifications</p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-primary-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifMenu(false)} className="text-slate-300 hover:text-slate-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                        'bg-primary-50 text-primary-600'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className={`text-xs font-bold text-slate-800 ${!n.read ? 'text-slate-900' : ''}`}>{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{n.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <button className="text-xs font-bold text-primary-600 hover:underline">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setShowUserMenu(v => !v); }}
            className="w-9 h-9 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-black text-xs hover:bg-primary-100 transition-colors"
            title={user?.name}
          >
            {user?.name?.slice(0, 2).toUpperCase() || 'U'}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-black text-sm text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full border border-primary-100">
                  {user?.company}
                </span>
              </div>
              <a href="/settings" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors">Account Settings</a>
              <a href="/products"  className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors">My Products</a>
              <a href="/reports"   className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors">Audit Reports</a>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <a href="/login" className="block px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors">Sign Out</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
