
import { PaymentRecord, Committee } from './types';

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

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
 * Local Data Storage Utility (Supabase Integration Removed)
 */
export const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(getStorageKey(key), JSON.stringify(data));
};

export const loadFromStorage = (key: string, defaultValue: any) => {
  const stored = localStorage.getItem(getStorageKey(key));
  return stored ? JSON.parse(stored) : defaultValue;
};
