
import { PaymentRecord, Committee } from './types';

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Updated Supabase Configuration for new Project ID
const SUPABASE_URL = "https://plyqhelkzjqbijtunhkx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseXFoZWxrempxYmlqdHVuaGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Nzk0NTEsImV4cCI6MjA4MzM1NTQ1MX0.svthqULb3ykqXdJfAZJF6_LmAt2bc1kMAe8F3rBAT0A";

export const getMonthLabel = (index: number) => {
  const yearOffset = Math.floor(index / 12);
  const monthIdx = index % 12;
  return `${MONTHS[monthIdx]} (Year ${yearOffset + 1})`;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getStorageKey = (key: string) => `jmd_ledger_v2_${key}`;

/**
 * Supabase Data Sync Utility
 */
export const syncToSupabase = async (tableName: string, data: any) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (error) {
    console.error(`Supabase Sync Error [${tableName}]:`, error);
    return false;
  }
};

export const fetchFromSupabase = async (tableName: string) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error(`Supabase Fetch Error [${tableName}]:`, error);
    return null;
  }
};

export const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(getStorageKey(key), JSON.stringify(data));
  
  const tableNameMap: Record<string, string> = {
    'members': 'members',
    'committees': 'committees',
    'payments': 'payments',
    'loans': 'loans',
    'loan_repayments': 'loan_repayments',
    'subscriptions': 'subscriptions'
  };
  
  if (tableNameMap[key]) {
    syncToSupabase(tableNameMap[key], data);
  }
};

export const loadFromStorage = (key: string, defaultValue: any) => {
  const stored = localStorage.getItem(getStorageKey(key));
  return stored ? JSON.parse(stored) : defaultValue;
};
