
import React, { useState } from 'react';
import { Committee, Member, MemberSubscription } from '../types.ts';
import { formatCurrency } from '../utils.ts';

interface CommitteeManagerProps {
  committees: Committee[];
  members: Member[];
  subscriptions: MemberSubscription[];
  onAdd: (committee: Committee) => void;
  onAddSubscription: (sub: MemberSubscription) => void;
}

// Fixed missing component implementation and default export
const CommitteeManager: React.FC<CommitteeManagerProps> = ({ committees, members, subscriptions, onAdd, onAddSubscription }) => {
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [duration, setDuration] = useState(12);
  const [subForm, setSubForm] = useState({ memberId: '', amount: 0, year: 0 });

  const handleAddCommittee = () => {
    onAdd({ year: newYear, durationMonths: duration });
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.memberId || !subForm.year || subForm.amount <= 0) return;
    onAddSubscription({
      memberId: subForm.memberId,
      committeeYear: subForm.year,
      monthlyAmount: subForm.amount
    });
    setSubForm({ ...subForm, memberId: '', amount: 0 });
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter uppercase">1. Initialize New Batch</h3>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Starting Year</label>
              <input type="number" value={newYear} onChange={e => setNewYear(parseInt(e.target.value))} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Duration (Months)</label>
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <button onClick={handleAddCommittee} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[11px]">Create Batch Session</button>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter uppercase">2. Enroll Member to Batch</h3>
          <form onSubmit={handleAddSubscription} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Batch</label>
              <select required value={subForm.year} onChange={e => setSubForm({ ...subForm, year: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                <option value="">Select Batch Year</option>
                {committees.map(c => <option key={c.year} value={c.year}>{c.year} Batch</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Choose Member</label>
              <select required value={subForm.memberId} onChange={e => setSubForm({ ...subForm, memberId: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                <option value="">Select Member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name} (#{m.id})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Monthly Commitment (₹)</label>
              <input required type="number" value={subForm.amount || ''} onChange={e => setSubForm({ ...subForm, amount: parseInt(e.target.value) })} placeholder="e.g. 1000" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <button type="submit" className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]">Confirm Enrollment</button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">Active Batches Audit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {committees.sort((a,b) => b.year - a.year).map(committee => {
            const batchSubs = subscriptions.filter(s => s.committeeYear === committee.year);
            return (
              <div key={committee.year} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                  <i className="fas fa-layer-group text-9xl"></i>
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{committee.year}</h4>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{committee.durationMonths} Months</p>
                  </div>
                  <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-users text-slate-300"></i>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrollment Status ({batchSubs.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {batchSubs.map(sub => {
                      const m = members.find(mem => mem.id === sub.memberId);
                      return (
                        <div key={sub.memberId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{m?.name}</span>
                          <span className="text-[10px] font-black text-indigo-600">{formatCurrency(sub.monthlyAmount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CommitteeManager;
