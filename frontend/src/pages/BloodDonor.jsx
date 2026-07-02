import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  Search as SearchIcon, 
  Phone, 
  MapPin, 
  UserCheck, 
  AlertCircle,
  Plus,
  X,
  Check
} from 'lucide-react';

export default function BloodDonor() {
  const { user, getHeaders } = useAuth();
  
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search query filters
  const [searchGroup, setSearchGroup] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');

  // Register modal states
  const [registerOpen, setRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [available, setAvailable] = useState(true);
  const [myProfile, setMyProfile] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const districts = [
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh',
    'Comilla', 'Narayanganj', 'Gazipur', 'Bograt', 'Cox\'s Bazar', 'Feni', 'Jessore'
  ];

  // Fetch all donors matching active search filters
  const fetchDonors = async () => {
    try {
      setLoading(true);
      let url = '/api/utilities/blood/search?available=true';
      if (searchGroup) url += `&bloodGroup=${encodeURIComponent(searchGroup)}`;
      if (searchDistrict) url += `&district=${encodeURIComponent(searchDistrict)}`;

      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDonors(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user donor profile
  const fetchMyDonorProfile = async () => {
    try {
      const res = await fetch('/api/utilities/blood/me', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setMyProfile(data);
          setName(data.name || '');
          setBloodGroup(data.bloodGroup || '');
          setDistrict(data.district || '');
          setPhone(data.phone || '');
          setAvailable(data.available !== undefined ? data.available : true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDonors();
    fetchMyDonorProfile();
  }, [searchGroup, searchDistrict]);

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/utilities/blood/register', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, bloodGroup, district, phone, available })
      });

      if (res.ok) {
        const data = await res.json();
        setMyProfile(data);
        setRegisterOpen(false);
        setSuccess('Donor status updated successfully!');
        fetchDonors(); // refresh list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Error updating donor details');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Hero card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-gradient-to-r from-red-950/20 via-slate-900 to-[#111827] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-current animate-pulse" />
            <span>Blood Donor Finder</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl">
            Urgent medical emergency? Search active blood donors by blood type and district in Bangladesh, or register to save lives.
          </p>
        </div>

        <button
          onClick={() => setRegisterOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-red-500/10"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>{myProfile ? 'Edit Donor Status' : 'Register as Donor'}</span>
        </button>
      </div>

      {/* Donor list filter search section */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Blood Group
          </label>
          <select
            value={searchGroup}
            onChange={(e) => setSearchGroup(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
          >
            <option value="">Any Blood Group</option>
            {bloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            District / Division
          </label>
          <select
            value={searchDistrict}
            onChange={(e) => setSearchDistrict(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
          >
            <option value="">Any District</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => { setSearchGroup(''); setSearchDistrict(''); }}
            className="w-full bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold py-2.5 rounded-2xl text-xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Active Donors Stream */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Searching donors database...</p>
        </div>
      ) : donors.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-300 mb-1">No Donors Found</h3>
          <p className="text-gray-500 text-sm">Try broadening your search query filters or invite friends to register!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map((donor) => (
            <div 
              key={donor._id}
              className="glass-panel rounded-3xl p-5 border border-white/5 flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 font-black rounded-2xl flex items-center justify-center text-lg shadow-inner">
                {donor.bloodGroup}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-bold text-gray-200 text-sm">{donor.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-500 pt-0.5">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" /> {donor.district}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Available</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex gap-2">
                  <a
                    href={`tel:${donor.phone}`}
                    className="flex-1 bg-[#1f2937] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 text-gray-300 border border-white/5 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Donor</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Donor Registration Modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl w-full max-w-md p-6 border border-white/10 relative animate-scaleIn">
            <button 
              onClick={() => setRegisterOpen(false)}
              className="absolute top-4 right-4 p-2 bg-[#111827] border border-white/5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              <span>Blood Donor Registry</span>
            </h3>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterDonor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Donor Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahat Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Blood Group
                  </label>
                  <select
                    required
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-400 focus:text-gray-200 focus:outline-none"
                  >
                    <option value="">Group</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    District
                  </label>
                  <select
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-400 focus:text-gray-200 focus:outline-none"
                  >
                    <option value="">District</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="avail"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="rounded border-white/10 bg-[#111827] text-emerald-600 focus:ring-emerald-500/20"
                />
                <label htmlFor="avail" className="text-xs text-gray-300 cursor-pointer font-semibold">
                  I am currently available for urgent donation
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold px-4 py-2 rounded-2xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-2xl text-xs flex items-center gap-1"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
