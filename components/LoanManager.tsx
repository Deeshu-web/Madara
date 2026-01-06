
import React, { useState } from 'react';
import { Member, Loan, LoanRepayment } from '../types';
import { formatCurrency } from '../utils';

interface LoanManagerProps {
  members: Member[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  onAddLoan: (loan: Loan) => void;
  onAddRepayment: (repayment: LoanRepayment) => void;
  onAddMember: (member: Member) => void;
}

const LoanManager: React.FC<LoanManagerProps> = ({ members, loans, loanRepayments, onAddLoan, onAddRepayment, onAddMember }) => {
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [isAddingNewBorrower, setIsAddingNewBorrower] = useState(false);
  const [viewingLoanHistory, setViewingLoanHistory] = useState<string | null>(null);
  const [isRepaying, setIsRepaying] = useState<string | null>(null);
  
  const [loanForm, setLoanForm] = useState({
    memberId: '',
    amount: 0,
    interestRate: 1,
    notes: ''
  });

  const [newBorrowerForm, setNewBorrowerForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [repayAmount, setRepayAmount] = useState(0);

  const getNextLoanId = () => {
    if (loans.length === 0) return 'L-1001';
    const ids = loans.map(l => parseInt(l.id.replace('L-', ''))).filter(n => !isNaN(n));
    const max = Math.max(...ids, 1000);
    return `L-${max + 1}`;
  };

  const getNextExternalMemberId = () => {
    const extMembers = members.filter(m => m.id.startsWith('EXT-'));
    if (extMembers.length === 0) return 'EXT-501';
    const ids = extMembers.map(m => parseInt(m.id.replace('EXT-', ''))).filter(n => !isNaN(n));
    const max = Math.max(...ids, 500);
    return `EXT-${max + 1}`;
  };

  const handleRegisterBorrower = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = getNextExternalMemberId();
    onAddMember({
      id: newId,
      ...newBorrowerForm
    });
    setLoanForm({ ...loanForm, memberId: newId });
    setIsAddingNewBorrower(false);
    setNewBorrowerForm({ name: '', phone: '', address: '' });
  };

  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.memberId || loanForm.amount <= 0) return;
    
    const newLoan: Loan = {
      id: getNextLoanId(),
      memberId: loanForm.memberId,
      amount: loanForm.amount,
      interestRate: loanForm.interestRate,
      startDate: new Date().toISOString(),
      status: 'active',
      notes: loanForm.notes
    };
    onAddLoan(newLoan);
    setIsAddingLoan(false);
  };

  /**
   * REFINED CALCULATION LOGIC:
   * 1. Interest is added monthly based on the current principal.
   * 2. When a payment is made, it covers interest first.
   * 3. Remaining payment reduces the principal (premium).
   */
  const calculateLoanStats = (loan: Loan) => {
    const startDate = new Date(loan.startDate);
    const now = new Date();
    
    // Calculate total months since start
    const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    
    const repayments = loanRepayments
      .filter(r => r.loanId === loan.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let principal = loan.amount;
    let currentAccruedInterest = 0;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    // Process month by month to apply interest then subtract payments correctly
    for (let m = 0; m <= monthsElapsed; m++) {
      // Step A: Interest accrues on the principal at the start of the month
      const monthlyInterest = principal * (loan.interestRate / 100);
      currentAccruedInterest += monthlyInterest;

      // Step B: Filter and apply payments made in THIS specific month
      const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
      const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + m + 1, 0, 23, 59, 59);

      const paymentsThisMonth = repayments.filter(r => {
        const d = new Date(r.date);
        return d >= startOfMonth && d <= endOfMonth;
      });

      for (const r of paymentsThisMonth) {
        const appliedToInterest = Math.min(r.amount, currentAccruedInterest);
        currentAccruedInterest -= appliedToInterest;
        totalInterestPaid += appliedToInterest;

        const appliedToPrincipal = r.amount - appliedToInterest;
        principal -= appliedToPrincipal;
        totalPrincipalPaid += appliedToPrincipal;
      }
    }

    return {
      principalPending: Math.max(0, principal),
      interestPending: Math.max(0, currentAccruedInterest),
      totalPaid: totalInterestPaid + totalPrincipalPaid,
      totalInterestPaid,
      totalPrincipalPaid
    };
  };

  const handleRepay = (loanId: string) => {
    if (repayAmount <= 0) return;
    onAddRepayment({
      id: Date.now().toString(),
      loanId,
      amount: repayAmount,
      date: new Date().toISOString(),
      interestPaid: 0, // Split logic is handled by calculateLoanStats
      principalPaid: 0
    });
    setIsRepaying(null);
    setRepayAmount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Loan Management</h2>
          <p className="text-sm text-slate-500 font-medium">Interest Priority: Interest first, then Principal reduction.</p>
        </div>
        <button 
          onClick={() => setIsAddingLoan(true)} 
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
        >
          <i className="fas fa-plus mr-2"></i>Issue New Loan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map(loan => {
          const member = members.find(m => m.id === loan.memberId);
          const { principalPending, interestPending, totalPaid } = calculateLoanStats(loan);
          const isClosed = (principalPending + interestPending) <= 1;

          return (
            <div key={loan.id} className={`bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col transition-all hover:shadow-xl ${isClosed ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">{member?.name || 'Unknown'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ID: {member?.id} | {loan.id}</p>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <p className="text-[10px] font-black text-indigo-600 uppercase">
                      {new Date(loan.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-rose-50 rounded-lg text-[10px] font-black text-rose-600">
                  {loan.interestRate}% MON
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-tighter">Initial Pesa</span>
                  <span className="font-black text-slate-800">{formatCurrency(loan.amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-tighter">Interest Pending</span>
                  <span className="font-black text-amber-600">+{formatCurrency(interestPending)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-tighter">Principal Pending</span>
                  <span className="font-black text-slate-700">{formatCurrency(principalPending)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-tighter">Total Returned</span>
                  <span className="font-black text-emerald-600">-{formatCurrency(totalPaid)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Balance</span>
                  <span className="text-xl font-black text-rose-600">{formatCurrency(principalPending + interestPending)}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-2">
                {!isClosed && (
                  <button 
                    onClick={() => setIsRepaying(loan.id)}
                    className="flex-1 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  >
                    Accept Repayment
                  </button>
                )}
                <button 
                  onClick={() => setViewingLoanHistory(loan.id)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl hover:bg-slate-200 transition-colors"
                >
                  History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {loans.length === 0 && (
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
          <i className="fas fa-handshake text-4xl text-slate-200 mb-4"></i>
          <p className="text-slate-400 font-bold uppercase tracking-widest">No active loans issued yet</p>
        </div>
      )}

      {/* New Loan Modal */}
      {isAddingLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmitLoan} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Issue New Loan</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Borrower</label>
                  <select 
                    required 
                    value={loanForm.memberId} 
                    onChange={e => setLoanForm({...loanForm, memberId: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-700 appearance-none"
                  >
                    <option value="">Select Member...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} (#{m.id})</option>)}
                  </select>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddingNewBorrower(true)}
                  className="mt-5 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-colors"
                  title="Register External Borrower"
                >
                  <i className="fas fa-user-plus"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount</label>
                  <input 
                    type="number" 
                    placeholder="Principal" 
                    onChange={e => setLoanForm({...loanForm, amount: parseFloat(e.target.value)})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-black" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Int % (Monthly)</label>
                  <input 
                    type="number" 
                    placeholder="Rate" 
                    value={loanForm.interestRate}
                    onChange={e => setLoanForm({...loanForm, interestRate: parseFloat(e.target.value)})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-black" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Remarks</label>
                <textarea 
                  placeholder="Notes for reference" 
                  onChange={e => setLoanForm({...loanForm, notes: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold min-h-[80px]" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setIsAddingLoan(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Cancel</button>
              <button type="submit" className="flex-1 py-4 bg-rose-600 text-white font-black text-xs uppercase rounded-xl shadow-xl shadow-rose-100 tracking-widest">Confirm Loan</button>
            </div>
          </form>
        </div>
      )}

      {/* External Borrower Modal */}
      {isAddingNewBorrower && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <form onSubmit={handleRegisterBorrower} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight text-center">New External Borrower</h3>
            <div className="space-y-4">
              <input 
                required
                placeholder="Full Name" 
                onChange={e => setNewBorrowerForm({...newBorrowerForm, name: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              />
              <input 
                placeholder="Phone No" 
                onChange={e => setNewBorrowerForm({...newBorrowerForm, phone: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
              />
              <textarea 
                placeholder="Full Address" 
                onChange={e => setNewBorrowerForm({...newBorrowerForm, address: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setIsAddingNewBorrower(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Back</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100">Register User</button>
            </div>
          </form>
        </div>
      )}

      {/* Repayment History Modal */}
      {viewingLoanHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Repayment History</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Tracking System</p>
              </div>
              <button onClick={() => setViewingLoanHistory(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-50 rounded-3xl p-4 border border-slate-100">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4 text-center">Amount Paid</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loanRepayments.filter(r => r.loanId === viewingLoanHistory).length > 0 ? (
                    loanRepayments.filter(r => r.loanId === viewingLoanHistory).reverse().map(r => (
                      <tr key={r.id} className="hover:bg-white transition-colors">
                        <td className="px-6 py-5 text-sm font-bold text-slate-600">
                          {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-5 font-black text-slate-800 text-center">
                          {formatCurrency(r.amount)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-widest">Verified</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-slate-400 italic font-bold">No payments found for this loan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Total Logs: {loanRepayments.filter(r => r.loanId === viewingLoanHistory).length}
              </div>
              <button onClick={() => setViewingLoanHistory(null)} className="px-8 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Repayment Modal */}
      {isRepaying && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-hand-holding-usd text-2xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Accept Repayment</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Loan Recovery</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="number" 
                  autoFocus
                  placeholder="0" 
                  onChange={e => setRepayAmount(parseFloat(e.target.value))} 
                  className="w-full px-6 py-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-emerald-500 font-black text-4xl text-center text-emerald-600 transition-all placeholder:opacity-20" 
                />
                <div className="absolute top-2 left-0 right-0 text-[10px] font-black text-slate-300 uppercase">Enter Amount Received</div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsRepaying(null)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Back</button>
              <button onClick={() => handleRepay(isRepaying)} className="flex-1 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManager;
