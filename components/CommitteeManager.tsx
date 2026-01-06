
import React, { useState } from 'react';
import { Committee, Member, MemberSubscription } from '../types';
import { formatCurrency } from '../utils';

interface CommitteeManagerProps {
  committees: Committee[];
  members: Member[];
  subscriptions: MemberSubscription[];
  onAdd: (committee: Committee) => void;
  onAddSubscription: (sub: MemberSubscription) => void;
}

const CommitteeManager: React.FC<CommitteeManagerProps> = ({ committees, members, subscriptions, onAdd, onAddSubscription }) => {
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState<number | null>(null);
  
  const [batchForm, setBatchForm] = useState({ 
    year: new Date().getFullYear(), 
    durationMonths: 36
  });

  const [enrollForm, setEnrollForm] = useState({
    memberId: '',
    monthlyAmount: 1000
  });

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(batchForm);
    setIsAddingBatch(false);
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnrolling || !enrollForm.memberId) return;
    onAddSubscription({
      committeeYear: isEnrolling,
      memberId: enrollForm.memberId,
      monthlyAmount: enrollForm.monthlyAmount
    });
    setEnrollForm({ memberId: '', monthlyAmount: 1000 });
    setIsEnrolling(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Committee Batches</h2>
          <p className="text-sm text-slate-500">Manage batches and member enrollments.</p>
        </div>
        <button 
          onClick={() => setIsAddingBatch(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200"
        >
          <i className="fas fa-plus mr-2"></i>New Batch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {committees.map(c => {
          const batchSubs = subscriptions.filter(s => s.committeeYear === c.year);
          return (
            <div key={c.year} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">{c.year} Batch</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{c.durationMonths} Months Plan</p>
                </div>
                <button 
                  onClick={() => setIsEnrolling(c.year)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg transition-colors"
                >
                  Add Member
                </button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Enrolled Members ({batchSubs.length})</h4>
                <div className="space-y-2">
                  {batchSubs.length > 0 ? batchSubs.map(s => {
                    const m = members.find(mem => mem.id === s.memberId);
                    return (
                      <div key={s.memberId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{m?.name || 'Deleted Member'}</p>
                          <p className="text-[10px] text-slate-400 font-bold">ID: #{s.memberId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-indigo-600 text-sm">{formatCurrency(s.monthlyAmount)}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">MONTHLY</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-center py-4 text-xs text-slate-400 italic">No members in this batch yet.</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 border-t border-indigo-100 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-700">Estimated Total Monthly</span>
                <span className="font-black text-indigo-800">{formatCurrency(batchSubs.reduce((sum, s) => sum + s.monthlyAmount, 0))}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Batch Modal */}
      {isAddingBatch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddBatch} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Start New Batch</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Batch Start Year</label>
                <input 
                  type="number" 
                  value={batchForm.year}
                  onChange={e => setBatchForm({...batchForm, year: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Duration (Months)</label>
                <input 
                  type="number" 
                  value={batchForm.durationMonths}
                  onChange={e => setBatchForm({...batchForm, durationMonths: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setIsAddingBatch(false)} className="flex-1 py-2 text-slate-400 font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200">Start</button>
            </div>
          </form>
        </div>
      )}

      {/* Enroll Member Modal */}
      {isEnrolling && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEnroll} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Enroll to {isEnrolling} Batch</h3>
            <p className="text-xs text-slate-400 mb-4">Assign a specific monthly amount for this member.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Select Member</label>
                <select 
                  required
                  value={enrollForm.memberId}
                  onChange={e => setEnrollForm({...enrollForm, memberId: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                >
                  <option value="">Choose Member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (#{m.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Monthly Contribution (Pesa)</label>
                <input 
                  type="number" 
                  value={enrollForm.monthlyAmount}
                  onChange={e => setEnrollForm({...enrollForm, monthlyAmount: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 1000"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setIsEnrolling(null)} className="flex-1 py-2 text-slate-400 font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200">Enroll Member</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CommitteeManager;
