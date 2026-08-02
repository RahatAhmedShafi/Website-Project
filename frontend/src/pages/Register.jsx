import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Mail, Lock, School, MapPin } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // List of standard districts in Bangladesh for dropdown
  const districts = [
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh',
    'Comilla', 'Narayanganj', 'Gazipur', 'Bograt', 'Cox\'s Bazar', 'Feni', 'Jessore'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, university, district);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 dark:bg-gradient-to-b dark:from-[#0b0f17] dark:to-[#111827] bg-slate-50 transition-colors duration-300">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Accents */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-emerald-500/10 to-emerald-500/5 rounded-2xl text-emerald-400 mb-3 border border-emerald-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight dark:bg-gradient-to-r dark:from-white dark:via-gray-100 dark:to-gray-300 dark:bg-clip-text dark:text-transparent text-slate-800">
            Join Vibora
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Create an account to connect with communities in Bangladesh
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahat Ahmed"
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 pl-11 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-200"
                />
                <User className="w-4 h-4 text-gray-500 absolute left-4 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahat@example.com"
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 pl-11 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-200"
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 pl-11 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-200"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                University (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. BUET, DU, NSU"
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 pl-11 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-200"
                />
                <School className="w-4 h-4 text-gray-500 absolute left-4 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                District / City
              </label>
              <div className="relative">
                <select
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 pl-11 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-400 focus:text-gray-200 appearance-none"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-gray-500 absolute left-4 top-3" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all hover:-translate-y-0.5 focus:outline-none text-sm mt-2"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
}
