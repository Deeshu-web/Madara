
import React from 'react';
import { formatCurrency } from '../utils.ts';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    member: any;
    committeeYear: number;
    month: string;
    amount: number;
    interest: number;
    date: string;
    method?: string;
    pending?: number;
    arrears?: number;
  };
}

// Fixed missing component implementation and default export
const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-[0_50px_120px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
        <div className="p-16 text-center bg-slate-950 text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <i className="fas fa-om text-7xl mb-6 text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]"></i>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Official Receipt</h2>
          <p className="text-[10px] font-black text-indigo-400 tracking-[0.6em] mt-4 uppercase">Jai Mata Di • Sada Sahay</p>
          <button onClick={onClose} className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-16 space-y-10">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Account Holder</span>
              <span className="text-xl font-black text-slate-900 tracking-tight">{data.member?.name}</span>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Batch Session</span>
              <span className="text-xl font-black text-slate-900 tracking-tight">{data.committeeYear} Batch</span>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Billing Month</span>
              <span className="font-bold text-slate-700">{data.month}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Transaction Date</span>
              <span className="font-bold text-slate-700">{new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Interest / Fine</span>
              <span className="font-bold text-slate-400">{formatCurrency(data.interest)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">Total Amount Paid</span>
              <span className="text-4xl font-black text-slate-950 tracking-tighter">{formatCurrency(data.amount)}</span>
            </div>
          </div>
          
          <div className="pt-6 flex gap-4">
            <button onClick={() => window.print()} className="flex-1 py-6 bg-slate-950 text-white font-black rounded-3xl shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
              <i className="fas fa-print"></i> Print Voucher
            </button>
            <button onClick={onClose} className="px-10 py-6 bg-slate-50 text-slate-400 font-black rounded-3xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[11px]">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
