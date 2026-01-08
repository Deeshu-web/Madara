
import React, { useState } from 'react';
import { Member, Loan, LoanRepayment } from '../types.ts';
import { formatCurrency } from '../utils.ts';

interface LoanManagerProps {
  members: Member[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  onAddLoan: (loan: Loan) => void;
  onAddRepayment: (repayment: LoanRepayment) => void;
  onAddMember: (member: Member) => void;
}

// Fixed missing component implementation and default export
const LoanManager: React.FC<LoanManagerProps> = ({ members, loans, loanRepayments, onAddLoan, onAddRepayment }) => {
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [loanForm, setLoanForm] = useState({ memberId: '', amount: 0, interestRate: 2, notes: '' });

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.memberId || loanForm.amount <= 0) return;
    const newLoan: Loan = {
      id: `L-${Date.now()}`,
      memberId: loanForm.memberId,
      amount: loanForm.amount,
      interestRate: loanForm.interestRate,
      startDate: new Date().toISOString(),
      status: 'active',
      notes: loanForm.notes
    };
    onAddLoan(newLoan);
    setShowAddLoan(false);
    setLoanForm({ memberId: '', amount: 0, interestRate: 2, notes: '' });
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Credit Exchange</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Interest-First Capital Management</p>
        </div>
        <button onClick={() => setShowAddLoan(true)} className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[11px] flex items-center gap-3">
          <i className="fas fa-hand-holding-dollar text-lg"></i> Issue New Loan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {loans.map(loan => {
          const m = members.find(mem => mem.id === loan.memberId);
          const repayments = loanRepayments.filter(r => r.loanId === loan.id);
          const totalRepaid = repayments.reduce((sum, r) => sum + r.amount, 0);
          
          return (
            <div key={loan.id} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                <i className="fas fa-hand-holding-usd text-[12rem]"></i>
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{m?.name}</h4>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-3">Loan ID: {loan.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(loan.amount)}</p>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">{loan.interestRate}% Monthly Int.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Repaid to Date</p>
                   <p className="text-lg font-black text-emerald-600">{formatCurrency(totalRepaid)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                   <p className="text-lg font-black text-slate-700">{new Date(loan.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-50 relative z-10">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${loan.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  {loan.status} Portfolio
                </span>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform">
                  View Statement <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddLoan && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-xl">
          <form onSubmit={handleAddLoan} className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-[0_50px_120px_rgba(0,0,0,0.5)] space-y-8 animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Loan Initiation</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Borrower</label>
                <select required value={loanForm.memberId} onChange={e => setLoanForm({ ...loanForm, memberId: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                  <option value="">Select Member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} (#{m.id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Principal (₹)</label>
                  <input type="number" required placeholder="0.00" onChange={e => setLoanForm({ ...loanForm, amount: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Interest Rate (%)</label>
                  <input type="number" step="0.1" required defaultValue={2} onChange={e => setLoanForm({ ...loanForm, interestRate: parseFloat(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Internal Remarks</label>
                <textarea onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]" placeholder="Optional notes..."></textarea>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowAddLoan(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px]">Cancel</button>
              <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px]">Authorize Loan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoanManager;
