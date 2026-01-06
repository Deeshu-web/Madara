
import React, { useState, useEffect } from 'react';
import { Member } from '../types';

interface MemberManagerProps {
  members: Member[];
  onAdd: (member: Member) => void;
}

const MemberManager: React.FC<MemberManagerProps> = ({ members, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', address: '', phone: '' });

  // Function to calculate next ID
  const getNextId = () => {
    if (members.length === 0) return '101';
    const numericIds = members
      .map(m => parseInt(m.id))
      .filter(id => !isNaN(id));
    if (numericIds.length === 0) return (members.length + 101).toString();
    const maxId = Math.max(...numericIds);
    return (maxId + 1).toString();
  };

  // Set ID whenever the "Add" modal opens
  useEffect(() => {
    if (isAdding) {
      setFormData(prev => ({ ...prev, id: getNextId() }));
    }
  }, [isAdding, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return;
    onAdd(formData);
    setFormData({ id: '', name: '', address: '', phone: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Members</h2>
          <p className="text-sm text-slate-500">Manage all participants across batches.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          <i className="fas fa-plus text-sm"></i>
          New Member
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Register New Member</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number (Auto)</label>
                  <div className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-bold">
                    #{formData.id}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                  <input 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="Contact No"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  required
                  autoFocus
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                <textarea 
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]" 
                  placeholder="Street, City, Pin"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.length > 0 ? members.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">#{m.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{m.name}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{m.phone}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm truncate max-w-[200px]">{m.address}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <i className="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <i className="fas fa-users-slash text-3xl mb-3 opacity-20"></i>
                    <p>No members registered yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberManager;
