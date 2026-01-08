
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Member, Committee, PaymentRecord, TabType, Loan, LoanRepayment, MemberSubscription } from './types.ts';
import { loadFromStorage, saveToStorage } from './utils.ts';
import Dashboard from './components/Dashboard.tsx';
import MemberManager from './components/MemberManager.tsx';
import CommitteeManager from './components/CommitteeManager.tsx';
import PaymentGrid from './components/PaymentGrid.tsx';
import LoanManager from './components/LoanManager.tsx';
import SearchPortal from './components/SearchPortal.tsx';

interface AppContextType {
  triggerAction: (message: string, duration?: number) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  const [members, setMembers] = useState<Member[]>(() => loadFromStorage('members', []));
  const [committees, setCommittees] = useState<Committee[]>(() => loadFromStorage('committees', []));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadFromStorage('payments', []));
  const [loans, setLoans] = useState<Loan[]>(() => loadFromStorage('loans', []));
  const [loanRepayments, setLoanRepayments] = useState<LoanRepayment[]>(() => loadFromStorage('loan_repayments', []));
  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>(() => loadFromStorage('subscriptions', []));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { saveToStorage('members', members); }, [members]);
  useEffect(() => { saveToStorage('committees', committees); }, [committees]);
  useEffect(() => { saveToStorage('payments', payments); }, [payments]);
  useEffect(() => { saveToStorage('loans', loans); }, [loans]);
  useEffect(() => { saveToStorage('loan_repayments', loanRepayments); }, [loanRepayments]);
  useEffect(() => { saveToStorage('subscriptions', subscriptions); }, [subscriptions]);

  const triggerAction = async (message: string, duration: number = 1200) => {
    setActionMessage(message);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setActionMessage(null);
        resolve();
      }, duration);
    });
  };

  const addMember = async (member: Member) => {
    await triggerAction("Adding Member...");
    setMembers(prev => [...prev, member]);
  };

  const addCommittee = async (committee: Committee) => {
    await triggerAction("Starting New Batch...");
    setCommittees(prev => [...prev, committee]);
  };
  
  const addSubscription = async (sub: MemberSubscription) => {
    await triggerAction("Enrolling Member...");
    setSubscriptions(prev => {
      const filtered = prev.filter(s => !(s.memberId === sub.memberId && s.committeeYear === sub.committeeYear));
      return [...filtered, sub];
    });
  };

  const updatePayment = (newPayment: PaymentRecord) => {
    setPayments(prev => {
      const filtered = prev.filter(p => 
        !(p.memberId === newPayment.memberId && 
          p.committeeYear === newPayment.committeeYear && 
          p.monthIndex === newPayment.monthIndex)
      );
      return [...filtered, newPayment];
    });
  };

  const addLoan = async (loan: Loan) => {
    await triggerAction("Issuing Loan...");
    setLoans(prev => [...prev, loan]);
  };

  const addLoanRepayment = async (repayment: LoanRepayment) => {
    await triggerAction("Recording Repayment...");
    setLoanRepayments(prev => [...prev, repayment]);
  };

  return (
    <AppContext.Provider value={{ triggerAction }}>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
        
        {actionMessage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
            <div className="bg-white p-12 rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.3)] border border-white flex flex-col items-center gap-6 animate-in zoom-in slide-in-from-bottom-10 duration-500 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <i className="fas fa-om text-indigo-600/30 text-xl"></i>
                </div>
              </div>
              <p className="text-xl font-black text-slate-800 uppercase tracking-tight">{actionMessage}</p>
            </div>
          </div>
        )}

        <nav className="w-full md:w-72 bg-slate-950 text-white flex flex-col shrink-0 z-20 transition-all duration-300">
          <div className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                <i className="fas fa-om text-xl text-white"></i>
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tighter leading-none">JAI MATA DI</h1>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">SADA SAHAY</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1 pl-6">
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fas fa-grid-2" label="Dashboard" />
            <NavItem active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon="fas fa-magnifying-glass" label="Member Search" />
            <NavItem active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon="fas fa-user-group" label="Members" />
            <NavItem active={activeTab === 'committees'} onClick={() => setActiveTab('committees')} icon="fas fa-layer-group" label="Batches" />
            <NavItem active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon="fas fa-file-invoice-dollar" label="Ledger" />
            <NavItem active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} icon="fas fa-hand-holding-usd" label="Loans" />
          </div>

          <div className="p-8 mt-auto space-y-4">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-4">
               <div className="w-8 h-8 bg-white/5 text-white/40 rounded-xl flex items-center justify-center">
                  <i className="fas fa-clock text-xs"></i>
               </div>
               <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  <p className="text-xs font-black text-white tracking-tighter">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
               </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          <div className="p-4 md:p-12 animate-in fade-in duration-500">
            {activeTab === 'dashboard' && (
              <Dashboard 
                members={members} 
                committees={committees} 
                payments={payments} 
                loans={loans} 
                subscriptions={subscriptions} 
                loanRepayments={loanRepayments}
              />
            )}
            {activeTab === 'search' && (
              <SearchPortal
                members={members}
                committees={committees}
                payments={payments}
                subscriptions={subscriptions}
                loans={loans}
                loanRepayments={loanRepayments}
              />
            )}
            {activeTab === 'members' && <MemberManager members={members} onAdd={addMember} />}
            {activeTab === 'committees' && (
              <CommitteeManager 
                committees={committees} 
                members={members}
                subscriptions={subscriptions}
                onAdd={addCommittee} 
                onAddSubscription={addSubscription}
              />
            )}
            {activeTab === 'payments' && (
              <PaymentGrid 
                members={members} 
                committees={committees} 
                payments={payments} 
                subscriptions={subscriptions}
                onUpdatePayment={updatePayment} 
              />
            )}
            {activeTab === 'loans' && (
              <LoanManager 
                members={members} 
                loans={loans} 
                loanRepayments={loanRepayments} 
                onAddLoan={addLoan} 
                onAddRepayment={addLoanRepayment}
                onAddMember={addMember}
              />
            )}
          </div>
        </main>

        <style>{`
          .nav-item-active {
            background-color: #f8fafc;
            color: #0f172a;
            border-radius: 40px 0 0 40px;
            position: relative;
            z-index: 10;
          }
          .nav-item-active::before,
          .nav-item-active::after {
            content: "";
            position: absolute;
            right: 0;
            width: 40px;
            height: 40px;
            background-color: transparent;
            pointer-events: none;
          }
          .nav-item-active::before {
            top: -40px;
            border-radius: 0 0 40px 0;
            box-shadow: 20px 20px 0 20px #f8fafc;
          }
          .nav-item-active::after {
            bottom: -40px;
            border-radius: 0 40px 0 0;
            box-shadow: 20px -20px 0 20px #f8fafc;
          }
        `}</style>
      </div>
    </AppContext.Provider>
  );
};

const NavItem: React.FC<{active: boolean, onClick: () => void, icon: string, label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 group ${
      active 
        ? 'nav-item-active text-slate-900' 
        : 'text-white/40 hover:text-white/80'
    }`}
  >
    <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'group-hover:bg-white/5'
    }`}>
      <i className={`${icon} text-sm`}></i>
    </div>
    <span className={`font-black text-[11px] uppercase tracking-[0.15em] transition-all ${
      active ? 'opacity-100 translate-x-1 font-black' : 'opacity-100 translate-x-0'
    }`}>
      {label}
    </span>
  </button>
);

export default App;
