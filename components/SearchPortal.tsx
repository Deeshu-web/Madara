
import React, { useState, useMemo } from 'react';
import { Member, Committee, PaymentRecord, MemberSubscription, Loan, LoanRepayment } from '../types.ts';
import { formatCurrency, getMonthLabel } from '../utils.ts';

interface SearchPortalProps {
  members: Member[];
  committees: Committee[];
  payments: PaymentRecord[];
  subscriptions: MemberSubscription[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
}

// Fixed missing component implementation and default export
const SearchPortal: React.FC<SearchPortalProps> = ({ members, committees, payments, subscriptions, loans, loanRepayments }) => {
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return members.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.id.includes(q) || 
      m.phone.includes(q)
    ).slice(0, 5);
  }, [search, members]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Central Registry</h2>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Cross-Batch Member Verification</p>
      </div>

      <div className="relative z-50">
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-600/10 blur-[80px] rounded-full group-focus-within:opacity-100 opacity-0 transition-opacity"></div>
          <i className="fas fa-magnifying-glass absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 text-2xl"></i>
          <input 
            type="text" 
            placeholder="Search Name, Account ID or Phone..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedMember(null); }}
            className="w-full pl-24 pr-12 py-10 bg-white border border-slate-100 rounded-[3.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.1)] text-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-200"
          />
        </div>

        {filteredMembers.length > 0 && !selectedMember && (
          <div className="absolute top-full left-0 right-0 mt-6 bg-white rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.2)] border border-slate-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-500">
            {filteredMembers.map(m => (
              <button key={m.id} onClick={() => { setSelectedMember(m); setSearch(''); }} className="w-full p-8 text-left hover:bg-slate-50 flex justify-between items-center transition-all border-b border-slate-50 last:border-none group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">#{m.id}</div>
                  <div>
                    <p className="text-xl font-black text-slate-900 tracking-tight">{m.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{m.phone} • {m.address.slice(0, 30)}...</p>
                  </div>
                </div>
                <i className="fas fa-arrow-right text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all"></i>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMember && (
        <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="p-16 bg-slate-950 text-white relative flex justify-between items-end">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10">
              <h3 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">{selectedMember.name}</h3>
              <p className="text-[11px] font-black text-indigo-400 tracking-[0.5em] mt-6 uppercase">Registered Account • #{selectedMember.id}</p>
            </div>
            <button onClick={() => setSelectedMember(null)} className="relative z-10 w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center hover:bg-rose-500 transition-all group">
              <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform"></i>
            </button>
          </div>
          
          <div className="p-16 space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Details</h4>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                      <i className="fas fa-phone"></i>
                    </div>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{selectedMember.phone}</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                      <i className="fas fa-location-dot"></i>
                    </div>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{selectedMember.address}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Quick Summary</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-950 p-6 rounded-[2.5rem] text-white">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total Batches</p>
                    <p className="text-3xl font-black tracking-tighter">{subscriptions.filter(s => s.memberId === selectedMember.id).length}</p>
                  </div>
                  <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white">
                    <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest mb-2">Active Loans</p>
                    <p className="text-3xl font-black tracking-tighter">{loans.filter(l => l.memberId === selectedMember.id && l.status === 'active').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPortal;
