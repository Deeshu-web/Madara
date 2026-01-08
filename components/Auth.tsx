
import React, { useState } from 'react';

interface AuthProps {
  onAuthSuccess: (token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Simple local passcode for demonstration/local security
  // In a real local-only app, this just provides a barrier to accidental access
  const MASTER_PASSCODE = "123456"; 

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === MASTER_PASSCODE) {
      // Use a random string as a local "token"
      onAuthSuccess("local_authenticated_" + Date.now());
    } else {
      setError("Incorrect Passcode. Access Denied.");
      setPasscode('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-xl">
            <i className="fas fa-om text-5xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
            Shree Jai Mata Di
          </h1>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-3">Local Ledger - Private Access</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-6 text-center tracking-tight">
            Security Check
          </h2>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 mb-2 block">Enter Master Passcode</label>
              <input 
                type="password" 
                required
                autoFocus
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                className="w-full px-6 py-6 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-4xl tracking-[1em] outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                placeholder="••••••"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-xs font-black text-rose-400 uppercase tracking-tight text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/40 hover:bg-indigo-50 transition-all active:scale-95"
            >
              Unlock Ledger
            </button>
          </form>
        </div>

        <p className="text-center mt-12 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
          Local Storage Mode • JAI MATA DI
        </p>
      </div>
    </div>
  );
};

export default Auth;
