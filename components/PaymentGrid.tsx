
import React, { useState, useMemo } from 'react';
import { Member, Committee, PaymentRecord, MemberSubscription } from '../types.ts';
import { formatCurrency, getMonthLabel } from '../utils.ts';
import ReceiptModal from './ReceiptModal.tsx';

interface PaymentGridProps {
  members: Member[];
  committees: Committee[];
  payments: PaymentRecord[];
  subscriptions: MemberSubscription[];
  onUpdatePayment: (payment: PaymentRecord) => void;
}

// Fixed missing component implementation and default export
const PaymentGrid: React.FC<PaymentGridProps> = ({ members, committees, payments, subscriptions, onUpdatePayment }) => {
  const [selectedYear, setSelectedYear] = useState<number | ''>(committees.length > 0 ? committees[0].year : '');
  const [receiptData, setReceiptData] = useState<any>(null);

  const activeCommittee = committees.find(c => c.year === selectedYear);
  const committeeSubs = useMemo(() => 
    subscriptions.filter(s => s.committeeYear === selectedYear),
    [subscriptions, selectedYear]
  );

  const handlePay = (sub: MemberSubscription, monthIdx: number) => {
    const payment: PaymentRecord = {
      memberId: sub.memberId,
      committeeYear: sub.committeeYear,
      monthIndex: monthIdx,
      amountPaid: sub.monthlyAmount,
      expectedAmount: sub.monthlyAmount,
      datePaid: new Date().toISOString(),
      isPaid: true,
      interestCharged: 0,
      paymentMethod: 'Cash'
    };
    onUpdatePayment(payment);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Ledger Terminal</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Verified Real-time Audit</p>
        </div>
        <div className="bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-2">
           <span className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Batch</span>
           <select 
             value={selectedYear} 
             onChange={e => setSelectedYear(parseInt(e.target.value))}
             className="px-8 py-3 bg-slate-950 text-white border-none rounded-[1.5rem] font-bold outline-none cursor-pointer hover:bg-slate-800 transition-all"
           >
             {committees.map(c => <option key={c.year} value={c.year}>{c.year} Batch Session</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto custom-dashboard-scroll">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky left-0 bg-slate-50/50 z-10 backdrop-blur-md">Account Holder</th>
                {activeCommittee && Array.from({ length: activeCommittee.durationMonths }).map((_, i) => (
                  <th key={i} className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[160px]">
                    <span className="block text-slate-900 text-xs mb-1">{getMonthLabel(i).split(' ')[0]}</span>
                    <span className="opacity-40">{getMonthLabel(i).split(' ')[1]} {getMonthLabel(i).split(' ')[2]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {committeeSubs.map(sub => {
                const m = members.find(mem => mem.id === sub.memberId);
                return (
                  <tr key={sub.memberId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 border-r border-slate-50 sticky left-0 bg-white/95 z-10 backdrop-blur-md">
                      <p className="font-black text-slate-900 tracking-tight">{m?.name}</p>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1">ID #{sub.memberId} • ₹{sub.monthlyAmount}</p>
                    </td>
                    {activeCommittee && Array.from({ length: activeCommittee.durationMonths }).map((_, i) => {
                      const p = payments.find(pay => pay.memberId === sub.memberId && pay.committeeYear === selectedYear && pay.monthIndex === i);
                      return (
                        <td key={i} className="p-6 text-center group">
                          {p?.isPaid ? (
                            <button 
                              onClick={() => setReceiptData({ member: m, committeeYear: selectedYear, month: getMonthLabel(i), amount: p.amountPaid, interest: p.interestCharged, date: p.datePaid })}
                              className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-emerald-200"
                            >
                              <i className="fas fa-check-circle mr-2"></i> Verified
                            </button>
                          ) : (
                            <button 
                              onClick={() => handlePay(sub, i)}
                              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-300 rounded-2xl text-[10px] font-black uppercase hover:border-indigo-600 hover:text-indigo-600 transition-all hover:bg-indigo-50"
                            >
                              Collect ₹{sub.monthlyAmount}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {receiptData && <ReceiptModal isOpen={!!receiptData} onClose={() => setReceiptData(null)} data={receiptData} />}
      
      <style>{`
        .custom-dashboard-scroll::-webkit-scrollbar { height: 8px; }
        .custom-dashboard-scroll::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-dashboard-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default PaymentGrid;
