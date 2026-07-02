import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      // Simulate Google Sign-In with a mockup profile
      const dummyId = Math.random().toString(36).substring(7);
      await googleLogin(
        'Rahat Ahmed', 
        `rahat.${dummyId}@gmail.com`, 
        `g_id_${dummyId}`, 
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
      );
      navigate('/');
    } catch (err) {
      setError('Google Sign-In failed');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#0b0f17] to-[#111827]">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Colorful Glow Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 mb-3 border border-emerald-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            Welcome to Vibora
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Share Your World & Connect Locally in Bangladesh
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@vibora.com"
                className="w-full bg-[#111827] border border-white/10 rounded-2xl py-3 px-4 pl-11 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-200"
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111827] border border-white/10 rounded-2xl py-3 px-4 pl-11 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-200"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all hover:-translate-y-0.5 focus:outline-none text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider">Or</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Mock Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full bg-[#1f2937] hover:bg-[#374151] text-gray-200 border border-white/5 font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition-colors text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.77 21.56,11.4 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.8c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.57c-0.9,0.6 -2.07,0.97 -3.3,0.97 -2.34,0 -4.33,-1.58 -5.04,-3.7H3v2.66C4.48,18.77 8.02,20.8 12,20.8z" fill="#34A853" />
              <path d="M6.96,13.3c-0.18,-0.55 -0.28,-1.13 -0.28,-1.7c0,-0.6 0.1,-1.19 0.28,-1.7V7.2H3c-0.65,1.3 -1.02,2.77 -1.02,4.3s0.37,3 1.02,4.3L6.96,13.3z" fill="#FBBC05" />
              <path d="M12,6.13c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.4 14.43,2.6 12,2.6 8.02,2.6 4.48,4.63 3,7.24l3.96,3.06c0.71,-2.12 2.7,-3.7 5.04,-3.7z" fill="#EA4335" />
            </g>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="mt-8 text-center text-sm text-gray-400">
          New to Vibora?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
}
