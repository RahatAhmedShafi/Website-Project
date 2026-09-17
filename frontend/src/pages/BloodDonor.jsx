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
  Check,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Info,
  Loader2
} from 'lucide-react';

export default function BloodDonor() {
  const { user, getHeaders } = useAuth();
  
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search query filters
  const [searchGroup, setSearchGroup] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');

  // PII Unmasking states
  const [revealedPhones, setRevealedPhones] = useState({}); // { [donorId]: string }
  const [requestingId, setRequestingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

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
    'Comilla', 'Narayanganj', 'Gazipur', 'Bogura', 'Cox\'s Bazar', 'Feni', 'Jessore', 'Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan'
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

          // If current user is donor, automatically show unmasked phone for own profile
          if (data._id && data.phone) {
            setRevealedPhones(prev => ({ ...prev, [data._id]: data.phone }));
          }
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

  // Request & Unmask Contact Number (PII Authorization Step)
  const handleRequestContact = async (donorId, donorName) => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    try {
      setRequestingId(donorId);
      const res = await fetch(`/api/utilities/blood/reveal-contact/${donorId}`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.unmaskedPhone) {
          setRevealedPhones(prev => ({ ...prev, [donorId]: data.unmaskedPhone }));
          setSuccess(`Verified access granted. Contact number revealed for ${donorName}.`);
          setTimeout(() => setSuccess(''), 4000);
        }
      } else {
        const data = await res.json();
        setError(data.message || 'Authorization failed for PII unmasking');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.error('Error requesting donor contact:', err);
      setError('Connection error while contacting security endpoint');
      setTimeout(() => setError(''), 4000);
    } finally {
      setRequestingId(null);
    }
  };

  // Copy phone number to clipboard
  const handleCopyPhone = (donorId, phoneNum) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedId(donorId);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2 animate-fadeIn">
          <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2 animate-fadeIn">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PII Privacy Shield Notification Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-transparent border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-300">Vibora PII Data Protection Active</span>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-400/30">
              Zero-Scraping Shield
            </span>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Donor contact numbers are masked by default (e.g. <span className="font-mono text-gray-300">017*****890</span>) to protect against automated web crawlers and unauthorized data harvesting. Logged-in verified users can request authorized access on-demand.
          </p>
        </div>
      </div>

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
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-red-500/10 cursor-pointer shrink-0"
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
            className="w-full bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold py-2.5 rounded-2xl text-xs transition-colors cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {donors.map((donor) => {
            const isRevealed = Boolean(revealedPhones[donor._id]) || donor.isMasked === false;
            const displayPhone = revealedPhones[donor._id] || donor.phone;
            const isRequesting = requestingId === donor._id;

            return (
              <div 
                key={donor._id}
                className="glass-panel rounded-3xl p-5 border border-white/5 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-red-500/20 transition-all shadow-lg"
              >
                {/* Header: Blood Group & Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 bg-gradient-to-br from-red-500/20 to-red-950/40 border border-red-500/30 text-red-500 font-black rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0">
                    {donor.bloodGroup}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base truncate">{donor.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 pt-0.5">
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" /> 
                        {donor.district}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phone & PII Security Status Box */}
                <div className="bg-[#111827]/80 rounded-2xl p-3 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-medium">Contact Phone:</span>
                    {isRevealed ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>PII Unmasked</span>
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Masked (Protected)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm font-bold tracking-wider text-gray-100">
                      {displayPhone}
                    </div>

                    {isRevealed && (
                      <button
                        onClick={() => handleCopyPhone(donor._id, displayPhone)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy phone number"
                      >
                        {copiedId === donor._id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Interactive Action Controls */}
                <div className="pt-1">
                  {!isRevealed ? (
                    <button
                      onClick={() => handleRequestContact(donor._id, donor.name)}
                      disabled={isRequesting}
                      className="w-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-400 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isRequesting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Verifying Authorization...</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 text-amber-400" />
                          <span>Request Contact Number</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 animate-fadeIn">
                      <a
                        href={`tel:${displayPhone}`}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        <Phone className="w-4 h-4 fill-current" />
                        <span>Call Donor Now</span>
                      </a>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Guest Login Required Modal */}
      {authPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl w-full max-w-sm p-6 border border-white/10 relative animate-scaleIn text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Authentication Required</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                To protect donor privacy from automated scrapers and bots, please log in to request and reveal direct contact numbers.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAuthPromptOpen(false)}
                className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold py-2.5 rounded-2xl text-xs transition-colors"
              >
                Close
              </button>
              <a
                href="/login"
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-2xl text-xs transition-colors flex items-center justify-center"
              >
                Sign In
              </a>
            </div>
          </div>
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
                  placeholder="e.g. Rahim Ahmed"
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
                    District / Area
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
                  Contact Phone Number (Stored Securely)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  🔒 Your number will be masked in public listings to preserve privacy.
                </p>
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
                  className="bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold px-4 py-2 rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-2xl text-xs flex items-center gap-1 cursor-pointer"
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
