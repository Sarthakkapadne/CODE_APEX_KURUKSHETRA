'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Plus, Package, ShieldCheck, BookOpen,
  BarChart3, FileText, MessageSquare, Settings, ChevronLeft,
  ChevronRight, Globe, Users, Zap, AlertCircle, Scale, Search
} from 'lucide-react';
import { useAuth, UserRole } from '../../lib/auth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  roles?: UserRole[];
  highlight?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/audit/new', label: 'New Audit', icon: Plus, highlight: true },
  { href: '/hs-classification', label: 'HS Classification', icon: Search },
  { href: '/products', label: 'My Products', icon: Package, roles: ['seller', 'manager'] },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/heatmap', label: 'Global Heat Map', icon: Globe },
  { href: '/analytics', label: 'AI Analytics', icon: BarChart3 },
  { href: '/rules', label: 'Rules Library', icon: BookOpen, roles: ['manager'] },
  { href: '/trade', label: 'Trade Economics', icon: BarChart3, roles: ['exporter', 'manager'] },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/chat', label: 'Chat History', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    if (!user) return true;
    return item.roles.includes(user.role);
  });

  const roleBadgeColor: Record<UserRole, string> = {
    seller: 'bg-blue-100 text-blue-700',
    manager: 'bg-indigo-100 text-indigo-700',
    exporter: 'bg-emerald-100 text-emerald-700',
  };

  const roleLabel: Record<UserRole, string> = {
    seller: 'Seller',
    manager: 'Compliance Mgr',
    exporter: 'Trade Ops',
  };

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-lexport-border transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } min-h-screen`}
    >
      {/* Logo */}
      <div className={`flex items-center px-4 h-16 border-b border-lexport-border ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-blue">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl text-primary-700 tracking-tight">LexPort</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-blue">
            <Scale className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors ${collapsed ? 'absolute -right-3 top-5 bg-white border border-lexport-border shadow-sm' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-lexport-border bg-primary-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-lexport-text truncate">{user.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleBadgeColor[user.role]}`}>
                {roleLabel[user.role]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 space-y-1 px-3">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all my-2 ${
                  collapsed ? 'justify-center' : 'space-x-3'
                } bg-primary-600 text-white hover:bg-primary-700 shadow-blue`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                collapsed ? 'justify-center' : 'space-x-3'
              } ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`flex-shrink-0 w-4.5 h-4.5 w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom trust badge */}
      {!collapsed && (
        <div className="p-4 border-t border-lexport-border">
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            <span>EU AI Act Compliant · SHA-256 Audit Trail</span>
          </div>
        </div>
      )}
    </aside>
  );
}
