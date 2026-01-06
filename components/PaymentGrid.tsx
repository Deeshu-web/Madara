
import React, { useState, useContext, useMemo } from 'react';
import { Member, Committee, PaymentRecord, MemberSubscription, PaymentMethod } from '../types';
import { formatCurrency, getMonthLabel } from '../utils';
import ReceiptModal from './ReceiptModal';
import { AppContext } from '../App';

interface PaymentGridProps {
  members: Member[];
  committees: Committee[];
  payments: PaymentRecord[];
  subscriptions: MemberSubscription[];
  onUpdatePayment: (payment: PaymentRecord) => void;
}

const PaymentGrid: React.FC<PaymentGridProps> = ({ members, committees, payments, subscriptions, onUpdatePayment }) => {
  const context = useContext(AppContext);
  const [selectedCommittee, setSelectedCommittee] = useState<number | null>(committees[0]?.year || null);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const [paymentInputs, setPaymentInputs] = useState<Record<string, number>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({});

  const committee = committees.find(c => c.year === selectedCommittee);
  
  const enrolledMembers = members.filter(m => 
    subscriptions.some(s => s.memberId === m.id && s.committeeYear === selectedCommittee)
  );

  // Helper to calculate cumulative financial state for a member up to a specific month
  const getMemberDues = (memberId: string, upToMonth: number) => {
    if (!selectedCommittee) return { arrears: 0, interest: 0 };
    
    const sub = subscriptions.find(s => s.memberId === memberId && s.committeeYear === selectedCommittee);
    if (!sub) return { arrears: 0, interest: 0 };

    let totalExpected = 0;
    let totalPaid = 0;
    let interestAccrued = 0;

    // We check all months from 0 up to the month BEFORE the current selection
    for (let i = 0; i < upToMonth; i++) {
      const record = payments.find(p => p.memberId === memberId && p.committeeYear === selectedCommittee && p.monthIndex === i);
      totalExpected += sub.monthlyAmount;
      if (record) {
        totalPaid += record.amountPaid;
        interestAccrued += record.interestCharged;
      }
    }

    const arrears = Math.max(0, (totalExpected + interestAccrued) - totalPaid);

    // Interest logic for the CURRENT selected month: 
    // 1% interest if there are arrears from previous months
    const currentInterest = arrears > 0 ? (sub.monthlyAmount * 0.01) : 0;

    return { 
      arrears, 
      currentInterest,
      premium: sub.monthlyAmount,
      totalDue: sub.monthlyAmount + currentInterest + arrears 
    };
  };

  const getPaymentStatus = (memberId: string, monthIdx: number) => {
    return payments.find(p => p.memberId === memberId && p.committeeYear === selectedCommittee && p.monthIndex === monthIdx);
  };

  const handleMarkPaid = async (member: Member) => {
    if (!selectedCommittee) return;
    
    const sub = subscriptions.find(s => s.memberId === member.id && s.committeeYear === selectedCommittee);
    if (!sub) return;

    const dues = getMemberDues(member.id, selectedMonth);
    const amountPaid = paymentInputs[member.id] !== undefined ? paymentInputs[member.id] : dues.totalDue;
    const method = paymentMethods[member.id] || 'Cash';

    // Current pending logic: (Total Due - Amount Paid)
    const pendingAmount = Math.max(0, dues.totalDue - amountPaid);

    await context?.triggerAction("Syncing Ledger...");

    const newPayment: PaymentRecord = {
      memberId: member.id,
      committeeYear: selectedCommittee,
      monthIndex: selectedMonth,
      amountPaid: amountPaid,
      expectedAmount: sub.monthlyAmount,
      isPaid: true,
      datePaid: new Date().toISOString(),
      interestCharged: dues.currentInterest,
      paymentMethod: method,
      pendingAmount: pendingAmount // This month's remaining balance
    };

    onUpdatePayment(newPayment);
    
    setReceiptData({
      member,
      committeeYear: selectedCommittee,
      month: getMonthLabel(selectedMonth),
      amount: amountPaid,
      interest: dues.currentInterest,
      date: new Date().toLocaleDateString(),
      method: method,
      pending: pendingAmount,
      arrears: dues.arrears // Previous unpaid debt
    });
    setIsReceiptOpen(true);
    
    // Reset local inputs for this member
    setPaymentInputs(prev => {
      const next = {...prev};
      delete next[member.id];
      return next;
    });
  };

  if (committees.length === 0) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No Batches Created. Go to Batches section.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</h2>
          <p className="text-sm text-slate-500 font-medium">Auto-calculating arrears & cumulative pending.</p>
        </div>
        <div className="flex gap-4">
          <select value={selectedCommittee || ''} onChange={e => setSelectedCommittee(parseInt(e.target.value))} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
            {committees.map(c => <option key={c.year} value={c.year}>Batch {c.year}</option>)}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
            {Array.from({ length: committee?.durationMonths || 36 }).map((_, i) => <option key={i} value={i}>{getMonthLabel(i)}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-8 py-6">Member Identity</th>
              <th className="px-8 py-6">Due Breakdown</th>
              <th className="px-8 py-6">Collection</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrolledMembers.length > 0 ? enrolledMembers.map(m => {
              const status = getPaymentStatus(m.id, selectedMonth);
              const dues = getMemberDues(m.id, selectedMonth);
              
              return (
                <tr key={m.id} className="group hover:bg-slate-50 transition-all">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-800 text-base">{m.name}</p>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">#{m.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase tracking-tighter">Premium:</span>
                        <span className="text-slate-700">{formatCurrency(dues.premium)}</span>
                      </div>
                      {dues.arrears > 0 && (
                        <div className="flex justify-between text-[10px] font-black text-rose-500">
                          <span className="uppercase tracking-tighter">Baki (Arrears):</span>
                          <span>+{formatCurrency(dues.arrears)}</span>
                        </div>
                      )}
                      {dues.currentInterest > 0 && (
                        <div className="flex justify-between text-[10px] font-black text-amber-600">
                          <span className="uppercase tracking-tighter">Interest (1%):</span>
                          <span>+{formatCurrency(dues.currentInterest)}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-100 pt-1 flex justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Due:</span>
                        <span className="text-sm font-black text-slate-900">{formatCurrency(dues.totalDue)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {status?.isPaid ? (
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-lg">{formatCurrency(status.amountPaid)}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status.paymentMethod}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input 
                          type="number"
                          placeholder={dues.totalDue.toString()}
                          value={paymentInputs[m.id] !== undefined ? paymentInputs[m.id] : ''}
                          onChange={e => setPaymentInputs({...paymentInputs, [m.id]: parseFloat(e.target.value)})}
                          className="w-32 px-4 py-2 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
                        />
                        <select 
                          value={paymentMethods[m.id] || 'Cash'}
                          onChange={e => setPaymentMethods({...paymentMethods, [m.id]: e.target.value as PaymentMethod})}
                          className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase outline-none"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Online">Online</option>
                          <option value="Bank">Bank</option>
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {status?.isPaid ? (
                      <div className="flex flex-col gap-1">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-center ${status.pendingAmount && status.pendingAmount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {status.pendingAmount && status.pendingAmount > 0 ? 'PARTIAL' : 'FULL PAID'}
                        </span>
                        {status.pendingAmount && status.pendingAmount > 0 && (
                          <span className="text-[9px] font-black text-rose-500 text-center">Pending: {formatCurrency(status.pendingAmount)}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">AWAITING</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {!status?.isPaid ? (
                      <button 
                        onClick={() => handleMarkPaid(m)}
                        className="px-5 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-xl shadow-indigo-100 uppercase tracking-widest hover:scale-105 transition-all"
                      >
                        Receive
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          // Find total arrears for receipt display
                          setReceiptData({ 
                            member: m, 
                            committeeYear: selectedCommittee, 
                            month: getMonthLabel(selectedMonth), 
                            amount: status.amountPaid, 
                            interest: status.interestCharged, 
                            date: new Date(status.datePaid || '').toLocaleDateString(),
                            method: status.paymentMethod,
                            pending: status.pendingAmount,
                            arrears: dues.arrears
                          });
                          setIsReceiptOpen(true);
                        }}
                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto border border-indigo-100 transition-all"
                      >
                        <i className="fas fa-receipt"></i> Bill
                      </button>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-8 py-32 text-center text-slate-300 italic">No batch data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isReceiptOpen && <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} data={receiptData} />}
    </div>
  );
};

export default PaymentGrid;
