
import React, { useState, useMemo } from 'react';
import { Member, Committee, PaymentRecord, MemberSubscription, Loan, LoanRepayment } from '../types';
import { formatCurrency, getMonthLabel } from '../utils';

interface SearchPortalProps {
  members: Member[];
  committees: Committee[];
  payments: PaymentRecord[];
  subscriptions: MemberSubscription[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
}

const SearchPortal: React.FC<SearchPortalProps> = ({ members, committees, payments, subscriptions, loans, loanRepayments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = members.find(m => m.id === searchTerm.trim() || m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setSelectedMember(found || null);
    if (!found) alert("Member not found with this ID/Name");
  };

  const memberData = useMemo(() => {
    if (!selectedMember) return null;

    const memberSubs = subscriptions.filter(s => s.memberId === selectedMember.id);
    const memberPayments = payments.filter(p => p.memberId === selectedMember.id);
    const memberLoans = loans.filter(l => l.memberId === selectedMember.id);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const batchDetails = memberSubs.map(sub => {
      const batch = committees.find(c => c.year === sub.committeeYear);
      const batchPayments = memberPayments.filter(p => p.committeeYear === sub.committeeYear && p.isPaid);
      const totalPaid = batchPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const monthsPaid = batchPayments.length;
      const duration = batch?.durationMonths || 36;
      
      // Calculate how many months have actually passed since batch start
      const elapsedMonthsSinceStart = Math.min(
        duration,
        (currentYear - sub.committeeYear) * 12 + currentMonth + 1
      );

      // Identify specifically which months are pending
      const pendingMonthIndices: number[] = [];
      for (let i = 0; i < elapsedMonthsSinceStart; i++) {
        const hasPaid = memberPayments.some(p => p.committeeYear === sub.committeeYear && p.monthIndex === i && p.isPaid);
        if (!hasPaid) {
          pendingMonthIndices.push(i);
        }
      }

      // Calculation: ₹1000/mo for 36 months (36k) yields ₹50k maturity
      // Ratio = 50,000 / 36,000
      const maturityRatio = 50000 / 36000;
      const totalExpectedInvestment = sub.monthlyAmount * duration;
      const finalMaturityAmount = totalExpectedInvestment * maturityRatio;

      return {
        ...sub,
        batch,
        totalPaid,
        monthsPaid,
        pendingMonthIndices,
        finalMaturityAmount,
        history: batchPayments.sort((a, b) => b.monthIndex - a.monthIndex)
      };
    });

    const activeLoans = memberLoans.map(loan => {
      const repayments = loanRepayments.filter(r => r.loanId === loan.id);
      const totalRecovered = repayments.reduce((sum, r) => sum + r.amount, 0);
      
      // Calculate balance with interest (1% approx per month elapsed)
      const startDate = new Date(loan.startDate);
      const diffMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      const effectiveMonths = Math.max(0, diffMonths);
      const accruedInterest = (loan.amount * (loan.interestRate / 100)) * (effectiveMonths + 1);
      
      const currentBalance = (loan.amount + accruedInterest) - totalRecovered;
      const isClosed = loan.status === 'closed' || (currentBalance <= 0);

      return { 
        ...loan, 
        totalRecovered, 
        currentBalance: Math.max(0, currentBalance), 
        isClosed,
        repaymentHistory: repayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    });

    return { batchDetails, activeLoans };
  }, [selectedMember, committees, payments, subscriptions, loans, loanRepayments]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Member Dossier</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">Comprehensive Financial Profile</p>
        </div>
      </header>

      {/* Search Input */}
      <section className="bg-white p-2 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex-1 px-8">
            <input 
              type="text" 
              placeholder="Enter ID or Name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full py-6 text-xl font-bold bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-300"
            />
          </div>
          <button type="submit" className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 hover:scale-105 transition-transform active:scale-95">
            <i className="fas fa-search text-2xl"></i>
          </button>
        </form>
      </section>

      {selectedMember && memberData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Member Info & Loans */}
          <div className="lg:col-span-1 space-y-8">
            {/* Identity Card */}
            <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-1000">
                  <i className="fas fa-om text-[15rem]"></i>
               </div>
               <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                  <i className="fas fa-id-card text-5xl"></i>
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-1 uppercase">{selectedMember.name}</h3>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6">Unique ID: #{selectedMember.id}</p>
               
               <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <i className="fas fa-mobile-retro text-sm"></i>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{selectedMember.phone || 'No Contact'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <i className="fas fa-map-location-dot text-sm"></i>
                    </div>
                    <span className="text-sm font-bold text-slate-700 line-clamp-2">{selectedMember.address || 'No Address Recorded'}</span>
                  </div>
               </div>
            </div>

            {/* Detailed Loan Timeline */}
            <div className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl shadow-indigo-950/40">
               <div className="flex justify-between items-center mb-8">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">Udhaar / Credit Ledger</h4>
                 <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                   <i className="fas fa-hand-holding-dollar text-indigo-400"></i>
                 </div>
               </div>

               {memberData.activeLoans.length > 0 ? memberData.activeLoans.map(loan => (
                 <div key={loan.id} className="mb-8 last:mb-0 p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                         <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Loan Issued On</p>
                         <p className="text-xs font-black text-white/80">{new Date(loan.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${loan.isClosed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {loan.isClosed ? 'Cleared' : 'Due'}
                       </span>
                    </div>

                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                       <div>
                         <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Issued</p>
                         <p className="text-xl font-black">{formatCurrency(loan.amount)}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Pending Bal</p>
                         <p className="text-xl font-black text-rose-400">{formatCurrency(loan.currentBalance)}</p>
                       </div>
                    </div>

                    <div className="pt-2">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Repayment Timeline</p>
                       <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                         {loan.repaymentHistory.map(r => (
                           <div key={r.id} className="flex justify-between items-center text-[11px]">
                             <span className="text-white/40 font-medium">{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                             <span className="font-black text-emerald-400">+{formatCurrency(r.amount)}</span>
                           </div>
                         ))}
                         {loan.repaymentHistory.length === 0 && (
                           <p className="text-[10px] text-white/20 italic">No repayments recorded yet.</p>
                         )}
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-10">
                   <i className="fas fa-shield-check text-indigo-900/40 text-4xl mb-4"></i>
                   <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Clean credit history.</p>
                 </div>
               )}
            </div>
          </div>

          {/* Right Column: Committee Progress */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4 px-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center">
                <i className="fas fa-layer-group text-xl"></i>
              </div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Investment Portfolios</h3>
            </div>
            
            {memberData.batchDetails.length > 0 ? memberData.batchDetails.map(batch => (
              <div key={batch.committeeYear} className="bg-white rounded-[4rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-1000"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
                  <div>
                    <h4 className="text-5xl font-black text-slate-900 tracking-tighter">{batch.committeeYear} Batch</h4>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                         {batch.batch?.durationMonths || 36} Months Multi-Year
                       </span>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-lg shadow-emerald-100/20 text-center md:text-right">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 opacity-70 italic">Projected Maturity (3 Years)</p>
                    <p className="text-4xl font-black text-emerald-600 tracking-tighter">{formatCurrency(batch.finalMaturityAmount)}</p>
                    <p className="text-[9px] font-bold text-emerald-400 mt-2 uppercase tracking-tighter">Based on ₹{batch.monthlyAmount}/mo contribution</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
                   <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Pesa</p>
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(batch.monthlyAmount)}</p>
                   </div>
                   <div className="bg-indigo-950 rounded-3xl p-6 shadow-xl shadow-indigo-950/20">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Savings to Date</p>
                      <p className="text-2xl font-black text-white">{formatCurrency(batch.totalPaid)}</p>
                   </div>
                   <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration Progress</p>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-black text-slate-900">{batch.monthsPaid}</p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">/ {batch.batch?.durationMonths || 36} MO</span>
                      </div>
                   </div>
                </div>

                {/* Tracking Arrears */}
                <div className="mb-12 relative z-10">
                  <div className="flex justify-between items-center mb-4 px-4">
                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      Pending Installments ({batch.pendingMonthIndices.length})
                    </h5>
                    {batch.pendingMonthIndices.length > 0 && (
                      <span className="text-[9px] font-black text-rose-500 uppercase italic">Action Required</span>
                    )}
                  </div>
                  
                  <div className="bg-rose-50/30 rounded-[2.5rem] p-6 border border-rose-100/50">
                    {batch.pendingMonthIndices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {batch.pendingMonthIndices.map(idx => (
                          <div key={idx} className="px-4 py-2 bg-white rounded-xl border border-rose-100 shadow-sm text-[10px] font-black text-rose-600 uppercase tracking-tighter">
                            {getMonthLabel(idx)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-2 gap-3">
                        <i className="fas fa-circle-check text-emerald-500"></i>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">No arrears detected for this batch.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Visualization */}
                <div className="mb-12 relative z-10 px-4">
                   <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden p-1.5 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-500/40 relative overflow-hidden"
                        style={{ width: `${Math.min(100, (batch.monthsPaid / (batch.batch?.durationMonths || 36)) * 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                      </div>
                   </div>
                   <div className="flex justify-between mt-4 px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-2"><i className="fas fa-flag-checkered"></i> Start: Jan {batch.committeeYear}</span>
                      <span>Target Goal: {formatCurrency(batch.finalMaturityAmount)}</span>
                   </div>
                </div>

                {/* Historical Log */}
                <div className="space-y-3 relative z-10">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-4">Latest Verified Deposits</h5>
                   {batch.history.slice(0, 3).map(pay => (
                     <div key={pay.monthIndex} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100 group/item hover:bg-white hover:shadow-xl transition-all">
                        <div className="flex items-center gap-5">
                           <div className="w-10 h-10 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-md group-hover/item:scale-110 transition-transform">
                             <i className="fas fa-check-double text-xs"></i>
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-800">{getMonthLabel(pay.monthIndex)} Installment</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified on {new Date(pay.datePaid || '').toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-base font-black text-slate-900">{formatCurrency(pay.amountPaid)}</p>
                           <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Digital Auth</p>
                        </div>
                     </div>
                   ))}
                   {batch.history.length === 0 && (
                     <div className="text-center py-16 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <i className="fas fa-file-invoice text-3xl text-slate-200 mb-4"></i>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Awaiting first batch deposit.</p>
                     </div>
                   )}
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-[4rem] p-40 text-center border-2 border-dashed border-slate-200 shadow-inner">
                <i className="fas fa-folder-open text-6xl text-slate-100 mb-8"></i>
                <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm">No active batch profile</h4>
                <p className="text-slate-300 text-xs mt-3 uppercase font-black tracking-tighter">Initialize first contribution to generate reports</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-40 text-center flex flex-col items-center">
           <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-8 animate-pulse">
             <i className="fas fa-magnifying-glass text-4xl text-slate-300"></i>
           </div>
           <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Member Query Pending</h3>
           <p className="text-[10px] font-bold text-slate-400 tracking-[0.5em] uppercase mt-3">Enter Identity to unlock global financial view</p>
        </div>
      )}

      <style>{`
        @keyframes progress-bar-stripes {
          from { background-position: 20px 0; }
          to { background-position: 0 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default SearchPortal;
