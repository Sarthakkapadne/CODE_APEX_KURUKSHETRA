'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuditResponse } from './types';
import { fetchInspections, fetchInspectionById } from './api';

export interface ActiveProductInfo {
  title: string;
  brand_name?: string;
  price: number;
  currency: string;
  category: string;
  country_of_origin: string;
  inferred_hs_code?: string;
  destination_markets: string[];
}

interface ActiveAuditContextValue {
  activeAudit: AuditResponse | null;
  activeProduct: ActiveProductInfo | null;
  activeInspectionId: string | null;
  setActiveAudit: (audit: AuditResponse | null) => void;
  selectInspection: (inspectionId: string) => Promise<void>;
  recentInspections: any[];
  refreshInspections: () => Promise<any[]>;
  isLoadingAudit: boolean;
}

const ActiveAuditContext = createContext<ActiveAuditContextValue | null>(null);

const STORAGE_KEY = 'lexport_active_audit';

export function ActiveAuditProvider({ children }: { children: ReactNode }) {
  const [activeAudit, setActiveAuditState] = useState<AuditResponse | null>(null);
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);
  const [recentInspections, setRecentInspections] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);

  // Derive active product information
  const activeProduct: ActiveProductInfo | null = activeAudit ? {
    title: (activeAudit as any).title || activeAudit.extracted_attributes?.category || 'Audited Product',
    brand_name: (activeAudit as any).brand_name || 'Verified Seller',
    price: (activeAudit as any).price || 34.99,
    currency: (activeAudit as any).currency || 'USD',
    category: activeAudit.extracted_attributes?.category || 'General Consumer Merchandise',
    country_of_origin: (activeAudit as any).country_of_origin || 'India',
    inferred_hs_code: activeAudit.hs_tariff?.reclassified_hs_code || activeAudit.extracted_attributes?.inferred_hs_code || '3304.99',
    destination_markets: activeAudit.destination_markets || ['US', 'EU', 'UK', 'CA', 'JP'],
  } : null;

  const setActiveAudit = (audit: AuditResponse | null) => {
    setActiveAuditState(audit);
    if (audit) {
      if (audit.inspection_id) setActiveInspectionId(audit.inspection_id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(audit));
      } catch {}
    } else {
      setActiveInspectionId(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  };

  const refreshInspections = async () => {
    try {
      const list = await fetchInspections();
      setRecentInspections(list);
      return list;
    } catch {
      return [];
    }
  };

  const selectInspection = async (inspectionId: string) => {
    setIsLoadingAudit(true);
    try {
      const detail = await fetchInspectionById(inspectionId);
      if (detail && detail.inspection) {
        // Convert get_inspection_by_id response to AuditResponse-compatible structure
        const insp = detail.inspection;
        const listing = detail.listing || {};
        const results = detail.results || [];

        // Group results into country matrix
        const matrix: Record<string, any[]> = {};
        const summary: Record<string, any> = {};
        results.forEach((r: any) => {
          const c = r.country_code || 'US';
          if (!matrix[c]) matrix[c] = [];
          matrix[c].push(r);

          if (!summary[c]) summary[c] = { pass: 0, warning: 0, violation: 0, escalation: 0 };
          const st = r.status || 'pass';
          if (summary[c][st] !== undefined) summary[c][st]++;
        });

        const auditObj: any = {
          listing_id: insp.listing_id,
          inspection_id: insp.id,
          title: listing.title || 'Product Audit',
          brand_name: listing.brand_name || '',
          price: listing.price || 34.99,
          currency: listing.currency || 'USD',
          country_of_origin: listing.country_of_origin || 'India',
          timestamp_utc: insp.timestamp_utc,
          rule_engine_version: insp.rule_engine_version,
          compliance_hash: insp.compliance_hash,
          prev_hash: insp.prev_hash,
          overall_verdict: insp.overall_verdict,
          destination_markets: insp.destination_markets || ['US', 'EU', 'UK', 'CA', 'JP'],
          extracted_attributes: insp.extracted_attributes || {},
          matrix: matrix,
          summary_by_country: summary,
          results_flat: results,
        };

        setActiveAuditState(auditObj);
        setActiveInspectionId(inspectionId);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(auditObj));
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to load inspection by id:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Initial load from storage or fetch latest inspection
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // 1. Try local storage first
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (mounted && parsed && parsed.inspection_id) {
            setActiveAuditState(parsed);
            setActiveInspectionId(parsed.inspection_id);
          }
        }
      } catch {}

      // 2. Fetch recent inspections to populate list
      try {
        const list = await refreshInspections();
        if (mounted && list && list.length > 0) {
          // If no active audit yet, load the latest one from DB
          setActiveAuditState(curr => {
            if (!curr) {
              selectInspection(list[0].id);
            }
            return curr;
          });
        }
      } catch {}
    };

    init();
    return () => { mounted = false; };
  }, []);

  return (
    <ActiveAuditContext.Provider
      value={{
        activeAudit,
        activeProduct,
        activeInspectionId,
        setActiveAudit,
        selectInspection,
        recentInspections,
        refreshInspections,
        isLoadingAudit,
      }}
    >
      {children}
    </ActiveAuditContext.Provider>
  );
}

export function useActiveAudit() {
  const ctx = useContext(ActiveAuditContext);
  if (!ctx) {
    throw new Error('useActiveAudit must be used within an ActiveAuditProvider');
  }
  return ctx;
}
