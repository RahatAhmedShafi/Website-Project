import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  MapPin, 
  Plus, 
  Search as SearchIcon, 
  Phone, 
  FileText, 
  User, 
  DollarSign, 
  GraduationCap, 
  X,
  Check,
  Trash2
} from 'lucide-react';

export default function Tuition() {
  const { user, getHeaders } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states: 'student_requests' (find tutors) or 'tutor_profiles' (available tutors)
  const [activeTab, setActiveTab] = useState('student_request');

  // Search filter query parameters
  const [subjectQuery, setSubjectQuery] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');

  // Form registration states
  const [createOpen, setCreateOpen] = useState(false);
  const [type, setType] = useState('student_request'); // student_request or tutor_profile
  const [title, setTitle] = useState('');
  const [subjects, setSubjects] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const districts = [
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh',
    'Comilla', 'Narayanganj', 'Gazipur', 'Bograt', 'Cox\'s Bazar', 'Feni', 'Jessore'
  ];

  const fetchTuitionPosts = async () => {
    try {
      setLoading(true);
      let url = `/api/utilities/tuition?type=${activeTab}`;
      if (districtQuery) url += `&district=${encodeURIComponent(districtQuery)}`;
      if (subjectQuery) url += `&subject=${encodeURIComponent(subjectQuery)}`;

      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching tuition posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTuitionPosts();
  }, [activeTab, subjectQuery, districtQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/utilities/tuition', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type,
          title,
          subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
          district,
          area,
          salary,
          details,
          phone
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        setCreateOpen(false);
        setSuccess('Listing posted successfully!');
        
        // Reset form
        setTitle('');
        setSubjects('');
        setDistrict('');
        setArea('');
        setSalary('');
        setPhone('');
        setDetails('');

        // Switch to appropriate tab and refresh listings
        setActiveTab(type);
        fetchTuitionPosts();
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Error posting tuition listing');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure');
    }
  };

  const [deletingPostId, setDeletingPostId] = useState(null);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-gradient-to-r from-teal-950/20 via-slate-900 to-[#111827] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-400" />
            <span>Tuition Marketplace</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl">
            Tutors can search for students nearby, and parents/students can find qualified teachers for home tutor or online tutoring in Bangladesh.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Create a Listing</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveTab('student_request')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'student_request'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Student Requests (Find Tuition Gigs)
        </button>
        <button
          onClick={() => setActiveTab('tutor_profile')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'tutor_profile'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Available Tutors (Find a Teacher)
        </button>
      </div>

      {/* Filters Form */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Subject Search
          </label>
          <input
            type="text"
            placeholder="e.g. Physics, Math, English"
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2 px-4 text-xs text-gray-200 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            District / City
          </label>
          <select
            value={districtQuery}
            onChange={(e) => setDistrictQuery(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2 px-4 text-xs text-gray-200 focus:outline-none"
          >
            <option value="">Any District</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <button 
            onClick={() => { setSubjectQuery(''); setDistrictQuery(''); }}
            className="w-full bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold py-2 px-4 rounded-2xl text-xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Stream listings */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading listings...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 text-gray-500 text-sm">
          No tuition listings match your filters. Be the first to create one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div 
              key={post._id}
              className="glass-panel rounded-3xl p-5 border border-white/5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-extrabold text-white text-base leading-snug">{post.title}</h3>
                  <span className="shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {post.salary}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{post.area ? `${post.area}, ` : ''}{post.district}</span>
                </p>

                <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
                  {post.details}
                </p>

                {/* Subjects Tags */}
                {post.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {post.subjects.map((sub, i) => (
                      <span key={i} className="bg-[#111827] border border-white/5 text-gray-400 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                    {post.user?.name ? post.user.name.charAt(0) : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{post.user?.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {((post.user?._id || post.user) === user?._id) && (
                    <button 
                      onClick={() => setDeletingPostId(post._id)}
                      className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-gray-500 border border-transparent transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Delete Tuition Listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a
                    href={`tel:${post.phone}`}
                    className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 font-bold px-4 py-1.5 rounded-xl text-[10px] flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Contact</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl w-full max-w-lg p-6 border border-white/10 relative animate-scaleIn max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setCreateOpen(false)}
              className="absolute top-4 right-4 p-2 bg-[#111827] border border-white/5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white mb-4">Post a Tuition Marketplace Listing</h3>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Listing Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('student_request')}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                      type === 'student_request'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-[#111827] border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    I am Student / Parent (Find Tutor)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('tutor_profile')}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                      type === 'tutor_profile'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-[#111827] border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    I am Tutor (Advertise Profile)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Listing Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need Class 9 Science Group tutor near Dhanmondi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    <option value="">Select District</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Area / Neighborhood
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanmondi, Banani"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Subjects (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Chemistry"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Expected Salary / Fees
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6000 Tk/month, Negotiable"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                  />
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Details & Requirements
                </label>
                <textarea
                  required
                  placeholder="Write tutoring schedule, classes, expectations, and tutor criteria..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold px-4 py-2 rounded-2xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-2xl text-xs"
                >
                  Post Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Tuition Modal */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl w-full max-w-sm p-6 border border-white/10 relative animate-scaleIn text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Tuition listing?</h3>
              <p className="text-xs text-gray-400 mt-1">This action cannot be undone. Are you sure you want to delete this listing?</p>
            </div>
            <div className="flex gap-3 pt-2 justify-center">
              <button
                onClick={() => setDeletingPostId(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-4 py-2 rounded-xl border border-white/5 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/utilities/tuition/${deletingPostId}`, {
                      method: 'DELETE',
                      headers: getHeaders()
                    });

                    if (res.ok) {
                      setPosts(posts.filter(p => p._id !== deletingPostId));
                      setDeletingPostId(null);
                    } else {
                      const data = await res.json();
                      alert(data.message || 'Failed to delete tuition listing');
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
