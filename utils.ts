
import { PaymentRecord, Committee } from './types';

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// User specified Google Sheet ID for data backup/reference
export const GOOGLE_SHEET_ID = "1XrFC-dd78t2xUyh3MJ3-A4Yyw99XZhlE1gOsa2mxYRg";

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

// This function acts as the bridge to the Google Sheet.
// In a production setup, you would deploy a Google Apps Script as a Web App
// and use that URL to push data into the specific Sheet ID.
export const syncDataToSheet = async (data: any) => {
  console.log(`[JAI MATA DI CLOUD] Syncing to Sheet: ${GOOGLE_SHEET_ID}`);
  // Example of how to send data to a Google Apps Script bridge:
  /*
  const SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ sheetId: GOOGLE_SHEET_ID, payload: data })
    });
  } catch (e) {
    console.error("Sync failed", e);
  }
  */
};

export const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(getStorageKey(key), JSON.stringify(data));
  // Trigger background sync
  syncDataToSheet({ [key]: data });
};

export const loadFromStorage = (key: string, defaultValue: any) => {
  const stored = localStorage.getItem(getStorageKey(key));
  return stored ? JSON.parse(stored) : defaultValue;
};
