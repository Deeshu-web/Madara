
import React, { useState } from 'react';

interface AuthProps {
  onAuthSuccess: (token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // New Supabase Project Details with provided API Key
  const SUPABASE_URL = "https://plyqhelkzjqbijtunhkx.supabase.co";
  const SUPABASE_KEY = "AIzaSyD9wY8t8gCeL0GgeVIUSOmI5R1WQF1ShqE";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLogin ? 'token?grant_type=password' : 'signup';
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.msg || 'Authentication failed');
      }

      if (isLogin) {
        onAuthSuccess(data.access_token);
      } else {
        alert("Registration successful! Please login.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-3">Cloud Ledger - Secure Access</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-6 text-center tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Admin Account'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 mb-2 block">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 mb-2 block">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-xs font-black text-rose-400 uppercase tracking-tight text-center">{error}</p>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/40 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>

        <p className="text-center mt-12 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
          Securely connected • JAI MATA DI
        </p>
      </div>
    </div>
  );
};

export default Auth;
