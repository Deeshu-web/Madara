
import React, { useState, useContext, useMemo } from 'react';
import { Member, Loan, LoanRepayment } from '../types';
import { formatCurrency } from '../utils';
import { AppContext } from '../App';

interface LoanManagerProps {
  members: Member[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  onAddLoan: (loan: Loan) => void;
  onAddRepayment: (repayment: LoanRepayment) => void;
  onAddMember: (member: Member) => void;
}

const ITEMS_PER_PAGE = 12;

const LoanManager: React.FC<LoanManagerProps> = ({ members, loans, loanRepayments, onAddLoan, onAddRepayment, onAddMember }) => {
  const context = useContext(AppContext);
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [isAddingNewBorrower, setIsAddingNewBorrower] = useState(false);
  const [viewingLoanHistory, setViewingLoanHistory] = useState<string | null>(null);
  const [isRepaying, setIsRepaying] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [loanForm, setLoanForm] = useState({
    memberId: '',
    amount: 0,
    interestRate: 1,
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [newBorrowerForm, setNewBorrowerForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [repayForm, setRepayForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

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

  const handleRegisterBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    await context?.triggerAction("Registering Borrower...");
    const newId = getNextExternalMemberId();
    onAddMember({
      id: newId,
      ...newBorrowerForm
    });
    setLoanForm({ ...loanForm, memberId: newId });
    setIsAddingNewBorrower(false);
    setNewBorrowerForm({ name: '', phone: '', address: '' });
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.memberId || loanForm.amount <= 0) return;
    
    await context?.triggerAction("Generating Loan...");
    const newLoan: Loan = {
      id: getNextLoanId(),
      memberId: loanForm.memberId,
      amount: loanForm.amount,
      interestRate: loanForm.interestRate,
      startDate: new Date(loanForm.startDate).toISOString(),
      status: 'active',
      notes: loanForm.notes
    };
    onAddLoan(newLoan);
    setIsAddingLoan(false);
    setCurrentPage(1); // Back to page 1 to see new loan
  };

  const calculateLoanStats = (loan: Loan) => {
    const startDate = new Date(loan.startDate);
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    const repayments = loanRepayments.filter(r => r.loanId === loan.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let principal = loan.amount;
    let currentAccruedInterest = 0;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    for (let m = 0; m <= monthsElapsed; m++) {
      const monthlyInterest = principal * (loan.interestRate / 100);
      currentAccruedInterest += monthlyInterest;
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

    const principalPending = Math.max(0, principal);
    const interestPending = Math.max(0, currentAccruedInterest);
    const isClosed = (principalPending + interestPending) <= 1;

    return { principalPending, interestPending, totalPaid: totalInterestPaid + totalPrincipalPaid, isClosed };
  };

  // Sorting and Pagination Logic
  const processedLoans = useMemo(() => {
    const mapped = loans.map(loan => ({
      ...loan,
      stats: calculateLoanStats(loan)
    }));

    // Sort: Active first, then Closed. Within each group, newest first.
    return mapped.sort((a, b) => {
      if (a.stats.isClosed && !b.stats.isClosed) return 1;
      if (!a.stats.isClosed && b.stats.isClosed) return -1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [loans, loanRepayments]);

  const totalPages = Math.ceil(processedLoans.length / ITEMS_PER_PAGE);
  const currentLoans = processedLoans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleRepay = async (loanId: string) => {
    if (repayForm.amount <= 0) return;
    await context?.triggerAction("Recording Repayment...");
    onAddRepayment({
      id: Date.now().toString(),
      loanId,
      amount: repayForm.amount,
      date: new Date(repayForm.date).toISOString(),
      interestPaid: 0, 
      principalPaid: 0
    });
    setIsRepaying(null);
    setRepayForm({ amount: 0, date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Loan Management</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Active loans shown first • 12 per page.</p>
        </div>
        <button 
          onClick={() => setIsAddingLoan(true)} 
          className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
        >
          <i className="fas fa-plus mr-2"></i>Issue New Loan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentLoans.map(loan => {
          const member = members.find(m => m.id === loan.memberId);
          const { principalPending, interestPending, totalPaid, isClosed } = loan.stats;

          return (
            <div key={loan.id} className={`bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col transition-all hover:-translate-y-1 relative ${isClosed ? 'opacity-60 grayscale bg-slate-50/50' : ''}`}>
              {isClosed && (
                <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200 z-10">
                  Closed
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2">{member?.name || 'Borrower'}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">ID: #{member?.id}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(loan.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-2 rounded-xl text-center border ${isClosed ? 'bg-slate-100 border-slate-200' : 'bg-rose-50 border-rose-100'}`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Rate</p>
                  <p className={`text-sm font-black ${isClosed ? 'text-slate-500' : 'text-rose-600'}`}>{loan.interestRate}%</p>
                </div>
              </div>

              <div className="space-y-4 mb-8 bg-white/50 p-6 rounded-[1.5rem] border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-black uppercase tracking-widest">Initial Pesa</span>
                  <span className="font-black text-slate-700">{formatCurrency(loan.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-black uppercase tracking-widest">Pending Interest</span>
                  <span className={`font-black ${isClosed ? 'text-slate-400' : 'text-amber-600'}`}>+{formatCurrency(interestPending)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-black uppercase tracking-widest">Principal Bal</span>
                  <span className="font-black text-slate-700">{formatCurrency(principalPending)}</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                    <p className={`text-2xl font-black tracking-tighter ${isClosed ? 'text-slate-400' : 'text-rose-600'}`}>{formatCurrency(principalPending + interestPending)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Recovered</p>
                    <p className="text-sm font-black text-emerald-600">{formatCurrency(totalPaid)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex gap-3">
                {!isClosed && (
                  <button 
                    onClick={() => {
                      setIsRepaying(loan.id);
                      setRepayForm({ ...repayForm, date: new Date().toISOString().split('T')[0] });
                    }}
                    className="flex-[2] py-4 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 tracking-widest"
                  >
                    Accept Repayment
                  </button>
                )}
                <button 
                  onClick={() => setViewingLoanHistory(loan.id)}
                  className={`flex-1 py-4 text-[10px] font-black uppercase rounded-2xl transition-all tracking-widest ${isClosed ? 'bg-slate-200 text-slate-500 hover:bg-slate-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12 pb-10">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-sm transition-all shadow-sm ${
                  currentPage === i + 1 
                  ? 'bg-indigo-600 text-white scale-110 shadow-indigo-100' 
                  : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* New Loan Modal */}
      {isAddingLoan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-300">
          <form onSubmit={handleSubmitLoan} className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Issue New Loan</h3>
            
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Borrower</label>
                  <select 
                    required 
                    value={loanForm.memberId} 
                    onChange={e => setLoanForm({...loanForm, memberId: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-700 appearance-none shadow-inner"
                  >
                    <option value="">Search Member...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} (#{m.id})</option>)}
                  </select>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddingNewBorrower(true)}
                  className="mt-6 w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Initial Amount</label>
                  <input 
                    type="number" 
                    required
                    placeholder="₹ 0.00" 
                    onChange={e => setLoanForm({...loanForm, amount: parseFloat(e.target.value)})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-black text-xl shadow-inner" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Int % (Monthly)</label>
                  <input 
                    type="number" 
                    required
                    value={loanForm.interestRate}
                    onChange={e => setLoanForm({...loanForm, interestRate: parseFloat(e.target.value)})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-black text-xl shadow-inner" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Loan Issuance Date</label>
                <input 
                  type="date" 
                  required
                  value={loanForm.startDate}
                  onChange={e => setLoanForm({...loanForm, startDate: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-black text-sm shadow-inner" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Remarks</label>
                <textarea 
                  placeholder="Notes for future audit..." 
                  onChange={e => setLoanForm({...loanForm, notes: e.target.value})} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold min-h-[100px] shadow-inner" 
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setIsAddingLoan(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Cancel</button>
              <button type="submit" className="flex-1 py-5 bg-rose-600 text-white font-black text-xs uppercase rounded-2xl shadow-xl shadow-rose-100 tracking-widest hover:bg-rose-700 transition-all">Confirm Pesa</button>
            </div>
          </form>
        </div>
      )}

      {/* Accept Repayment Modal */}
      {isRepaying && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-hand-holding-dollar text-2xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Accept Repayment</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Update Member Credit Score</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Received Amount</label>
                <input 
                  type="number" 
                  autoFocus
                  placeholder="0.00" 
                  onChange={e => setRepayForm({...repayForm, amount: parseFloat(e.target.value)})} 
                  className="w-full px-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-emerald-500 font-black text-4xl text-center text-emerald-600 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Payment Date</label>
                <input 
                  type="date" 
                  required
                  value={repayForm.date}
                  onChange={e => setRepayForm({...repayForm, date: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm text-center shadow-inner" 
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsRepaying(null)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Back</button>
              <button onClick={() => handleRepay(isRepaying)} className="flex-1 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">Record</button>
            </div>
          </div>
        </div>
      )}

      {isAddingNewBorrower && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[160]">
          <form onSubmit={handleRegisterBorrower} className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
            <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tighter uppercase text-center">New External Borrower</h3>
            <div className="space-y-4">
              <input required placeholder="Full Name" onChange={e => setNewBorrowerForm({...newBorrowerForm, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              <input placeholder="Phone No" onChange={e => setNewBorrowerForm({...newBorrowerForm, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
              <textarea placeholder="Full Address" onChange={e => setNewBorrowerForm({...newBorrowerForm, address: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold min-h-[120px]" />
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setIsAddingNewBorrower(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Back</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100">Register</button>
            </div>
          </form>
        </div>
      )}

      {viewingLoanHistory && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Payment History</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Digital Audit Trail</p>
              </div>
              <button onClick={() => setViewingLoanHistory(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4 text-center">Amount Received</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loanRepayments.filter(r => r.loanId === viewingLoanHistory).length > 0 ? (
                    loanRepayments.filter(r => r.loanId === viewingLoanHistory).reverse().map(r => (
                      <tr key={r.id} className="hover:bg-white transition-colors group">
                        <td className="px-6 py-5 text-sm font-black text-slate-700">
                          {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-5 font-black text-slate-900 text-center">
                          {formatCurrency(r.amount)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-emerald-100">Verified</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm italic">No payment logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumulative Log: {loanRepayments.filter(r => r.loanId === viewingLoanHistory).length} entries</p>
              <button onClick={() => setViewingLoanHistory(null)} className="px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManager;
