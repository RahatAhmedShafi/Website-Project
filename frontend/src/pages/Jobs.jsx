import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  MapPin, 
  Plus, 
  Search as SearchIcon, 
  Compass, 
  Building, 
  ArrowUpRight, 
  X,
  Check,
  Trash2
} from 'lucide-react';

export default function Jobs() {
  const { user, getHeaders } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState(''); // Internship, Part-time, Remote, Full-time

  // Modal creation states
  const [createOpen, setCreateOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Internship');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [salary, setSalary] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Application simulator states
  const [appliedJobs, setAppliedJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let url = '/api/utilities/jobs';
      const params = [];
      if (activeType) params.push(`type=${activeType}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeType, searchQuery]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/utilities/jobs', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ companyName, title, type, description, requirements, salary, link })
      });

      if (res.ok) {
        const newJob = await res.json();
        setJobs([newJob, ...jobs]);
        setCreateOpen(false);
        setSuccess('Job posting published successfully!');
        
        // Reset
        setCompanyName('');
        setTitle('');
        setType('Internship');
        setDescription('');
        setRequirements('');
        setSalary('');
        setLink('');

        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Error publishing job listing');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure');
    }
  };

  const handleApply = (jobId) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs([...appliedJobs, jobId]);
      alert("Application submitted successfully! The hiring company will review your Vibora profile details.");
    }
  };

  const [deletingJobId, setDeletingJobId] = useState(null);

  const jobTypes = ['Internship', 'Part-time', 'Remote', 'Full-time'];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Hero */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-gradient-to-r from-blue-950/20 via-slate-900 to-[#111827] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <span>Internship & Job Board</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl">
            Discover local internships, remote gigs, part-time jobs, and career opportunities from tech startups and companies in Bangladesh.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Post an Opening</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Search Openings
          </label>
          <input
            type="text"
            placeholder="Search by role, skill, or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 pl-10 text-xs text-gray-200 focus:outline-none"
          />
          <SearchIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-10" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Job / Gigs Type
          </label>
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
          >
            <option value="">All Job Types</option>
            {jobTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stream */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Searching open jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 text-gray-500 text-sm">
          No job postings match your criteria. Check back later!
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const hasApplied = appliedJobs.includes(job._id);
            return (
              <div 
                key={job._id}
                className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {job.type}
                    </span>
                    <span className="text-[10px] text-gray-500">Salary: {job.salary}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-base leading-snug">{job.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-teal-400" />
                      <span>{job.companyName}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-gray-300 leading-relaxed font-semibold">Description:</p>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    <p className="text-xs text-gray-300 leading-relaxed font-semibold pt-1">Requirements:</p>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col items-stretch w-full md:w-32 gap-2">
                  <button
                    onClick={() => handleApply(job._id)}
                    disabled={hasApplied}
                    className={`w-full py-2 px-4 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                      hasApplied 
                        ? 'bg-transparent border border-emerald-500/20 text-emerald-400 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {hasApplied ? 'Applied' : 'Quick Apply'}
                  </button>

                  {job.link && (
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#1f2937] hover:bg-[#374151] text-gray-200 border border-white/5 py-2 px-4 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>External Link</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}

                  {((job.user?._id || job.user) === user?._id) && (
                    <button
                      onClick={() => setDeletingJobId(job._id)}
                      className="w-full bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 py-2 px-4 rounded-xl text-[10px] font-bold text-center transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

            <h3 className="text-lg font-extrabold text-white mb-4">Post a Job or Internship</h3>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Company / Startup Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vibora Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Position Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Junior Frontend Dev Intern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Position Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-400 focus:text-gray-200 focus:outline-none"
                  >
                    {jobTypes.map(jt => (
                      <option key={jt} value={jt}>{jt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Monthly Salary (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15,000 Tk, Negotiable"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  External Application Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://careers.company.com/apply"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Job Description
                </label>
                <textarea
                  required
                  placeholder="Write roles, job responsibilities, working hours, and benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Position Requirements
                </label>
                <textarea
                  required
                  placeholder="Write educational qualifications, skills, language, framework checklist..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
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
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Job Modal */}
      {deletingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl w-full max-w-sm p-6 border border-white/10 relative animate-scaleIn text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Job Posting?</h3>
              <p className="text-xs text-gray-400 mt-1">This action cannot be undone. Are you sure you want to delete this job listing?</p>
            </div>
            <div className="flex gap-3 pt-2 justify-center">
              <button
                onClick={() => setDeletingJobId(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-4 py-2 rounded-xl border border-white/5 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/utilities/jobs/${deletingJobId}`, {
                      method: 'DELETE',
                      headers: getHeaders()
                    });

                    if (res.ok) {
                      setJobs(jobs.filter(j => j._id !== deletingJobId));
                      setDeletingJobId(null);
                    } else {
                      const data = await res.json();
                      alert(data.message || 'Failed to delete job posting');
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
