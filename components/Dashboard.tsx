
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { Member, Committee, PaymentRecord, Loan, MemberSubscription, LoanRepayment } from '../types.ts';
import { formatCurrency, getMonthLabel } from '../utils.ts';
import { AppContext } from '../App.tsx';

interface DashboardProps {
  members: Member[];
  committees: Committee[];
  payments: PaymentRecord[];
  loans: Loan[];
  subscriptions: MemberSubscription[];
  loanRepayments: LoanRepayment[];
}

const StatCard: React.FC<{ label: string; value: string; sub: string; icon: string; color: string }> = ({ label, value, sub, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-2 transition-all duration-500 overflow-hidden relative">
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
      <i className={`${icon} text-9xl`}></i>
    </div>
    <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 relative z-10`}>
      <i className={`${icon} text-2xl`}></i>
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{value}</h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{sub}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ members, committees, payments, loans, subscriptions, loanRepayments }) => {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const loanStats = useMemo(() => {
    let totalIssued = 0;
    let totalRecovered = 0;
    let totalBalance = 0;
    const pendingBorrowerIds = new Set<string>();

    loans.forEach(loan => {
      totalIssued += loan.amount;
      const repayments = loanRepayments.filter(r => r.loanId === loan.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const startDate = new Date(loan.startDate);
      const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      
      let principal = loan.amount;
      let accruedInterest = 0;
      let totalPaidForThisLoan = 0;

      for (let m = 0; m <= monthsElapsed; m++) {
        // RULE: LOAN ME INTREST JO MONTH ME LEGA USKE NEXT MONTH SE INTREST LAGEGA
        // m = 0 is the month loan was taken. Interest starts from m = 1.
        if (m > 0) {
          const monthlyInterest = principal * (loan.interestRate / 100);
          accruedInterest += monthlyInterest;
        }

        const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
        const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + m + 1, 0, 23, 59, 59);

        const paymentsThisMonth = repayments.filter(r => {
          const d = new Date(r.date);
          return d >= startOfMonth && d <= endOfMonth;
        });

        for (const r of paymentsThisMonth) {
          totalPaidForThisLoan += r.amount;
          const appliedToInterest = Math.min(r.amount, accruedInterest);
          accruedInterest -= appliedToInterest;
          const appliedToPrincipal = r.amount - appliedToInterest;
          principal -= appliedToPrincipal;
        }
      }

      totalRecovered += totalPaidForThisLoan;
      const finalBalance = Math.max(0, principal + accruedInterest);
      totalBalance += finalBalance;
      
      if (finalBalance > 1) {
        pendingBorrowerIds.add(loan.memberId);
      }
    });

    return { totalIssued, totalRecovered, totalBalance, pendingBorrowers: pendingBorrowerIds.size };
  }, [loans, loanRepayments, now]);

  const getBatchDefaulters = (batch: Committee) => {
    const batchSubs = subscriptions.filter(s => s.committeeYear === batch.year);
    const defaulters: { memberId: string; name: string; totalArrears: number; monthsMissed: number }[] = [];
    
    const elapsedMonths = Math.min(
      batch.durationMonths,
      (currentYear - batch.year) * 12 + currentMonth + 1
    );

    batchSubs.forEach(sub => {
      let arrears = 0;
      let missedCount = 0;
      const m = members.find(mem => mem.id === sub.memberId);

      for (let i = 0; i < elapsedMonths; i++) {
        const payment = payments.find(p => p.memberId === sub.memberId && p.committeeYear === batch.year && p.monthIndex === i);
        if (!payment || !payment.isPaid) {
          // Interest/Fine logic for committee payments can also start after first month
          const interest = i > 0 ? sub.monthlyAmount * 0.01 : 0;
          arrears += sub.monthlyAmount + interest;
          missedCount++;
        }
      }

      if (arrears > 0) {
        defaulters.push({
          memberId: sub.memberId,
          name: m?.name || 'Unknown',
          totalArrears: arrears,
          monthsMissed: missedCount
        });
      }
    });

    return defaulters.sort((a, b) => b.totalArrears - a.totalArrears);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6 group">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-950/20 border border-white/10 group-hover:rotate-6 transition-transform duration-700 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
               <i className="fas fa-om text-5xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"></i>
            </div>
          </div>

          <div>
            <div className="flex flex-col">
              <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85] flex flex-col">
                <span className="text-indigo-600 text-2xl tracking-[0.2em] mb-1">SHREE</span>
                <span>JAI MATA DI</span>
              </h2>
              <div className="flex items-center gap-4 mt-3">
                 <div className="h-[2px] w-12 bg-indigo-600/30"></div>
                 <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Secure Local Ledger</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 flex items-center gap-6 border border-slate-100 group">
             <div className="w-16 h-16 bg-slate-950 text-white rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
               <i className="fas fa-calendar-day text-2xl"></i>
             </div>
             <div className="pr-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Live Audit Time</p>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                 {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
               </h3>
             </div>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <i className="fas fa-chart-line-up"></i>
          </div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Investment Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard label="Total Issued" value={formatCurrency(loanStats.totalIssued)} sub="Current Outflow" icon="fas fa-money-bill-transfer" color="bg-slate-950" />
          <StatCard label="Total Recovered" value={formatCurrency(loanStats.totalRecovered)} sub="Current Inflow" icon="fas fa-sack-dollar" color="bg-emerald-600" />
          <StatCard label="Active Debt" value={formatCurrency(loanStats.totalBalance)} sub="Interest Starts Next Month" icon="fas fa-hourglass-half" color="bg-rose-600" />
          <StatCard label="Member Count" value={members.length.toString()} sub="Registered Profiles" icon="fas fa-users-viewfinder" color="bg-indigo-600" />
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <i className="fas fa-layer-group"></i>
            </div>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Active Batch Audit</h3>
          </div>
        </div>
        
        <div className="max-h-[800px] overflow-y-auto pr-4 custom-dashboard-scroll">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-10">
            {committees.sort((a, b) => b.year - a.year).map(batch => {
              const defaulters = getBatchDefaulters(batch);
              const totalArrearsForBatch = defaulters.reduce((sum, d) => sum + d.totalArrears, 0);
              
              const batchSubs = subscriptions.filter(s => s.committeeYear === batch.year);
              const totalBatchCollected = payments
                .filter(p => p.committeeYear === batch.year && p.isPaid)
                .reduce((sum, p) => sum + p.amountPaid, 0);
              
              const currentMonthIdx = Math.max(0, (currentYear - batch.year) * 12 + currentMonth);
              const paidThisMonthCount = payments.filter(p => 
                p.committeeYear === batch.year && 
                p.monthIndex === currentMonthIdx && 
                p.isPaid
              ).length;
              
              const pendingThisMonthCount = batchSubs.length - paidThisMonthCount;
              const isBatchRunning = (currentYear - batch.year) * 12 + currentMonth >= 0;

              return (
                <div key={batch.year} className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col relative overflow-hidden group h-fit">
                  <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <i className="fas fa-om text-[15rem]"></i>
                  </div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{batch.year} Batch</h4>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">
                        {isBatchRunning ? 'In Progress' : 'Closed Batch'}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collected</p>
                       <p className="text-2xl font-black text-indigo-600">{formatCurrency(totalBatchCollected)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Paid (Month)</p>
                        <p className="text-xl font-black text-emerald-700">{paidThisMonthCount}</p>
                      </div>
                      <i className="fas fa-user-check text-emerald-200 text-xl"></i>
                    </div>
                    <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100/50 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Pending (Month)</p>
                        <p className="text-xl font-black text-rose-700">{pendingThisMonthCount}</p>
                      </div>
                      <i className="fas fa-user-clock text-rose-200 text-xl"></i>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-6 flex-1 relative z-10 border border-slate-100">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overdue Analysis ({defaulters.length})</h5>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">Total Overdue Arrears</p>
                        <p className="text-sm font-black text-rose-600">{formatCurrency(totalArrearsForBatch)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {defaulters.length > 0 ? defaulters.map(d => (
                        <div key={d.memberId} className="bg-white p-4 rounded-2xl border border-slate-200/50 flex justify-between items-center hover:border-rose-200 transition-all hover:shadow-lg">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{d.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID #{d.memberId} • {d.monthsMissed} Months</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-rose-600 text-sm">{formatCurrency(d.totalArrears)}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-10 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-100">
                          <i className="fas fa-circle-check text-emerald-400 text-2xl mb-2"></i>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Zero Arrears - All Paid!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center relative z-10">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">JAI MATA DI • SADA SAHAY</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        .custom-dashboard-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-dashboard-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-dashboard-scroll::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
