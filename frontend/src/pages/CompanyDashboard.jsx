import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyJobs, createJob, updateJob, getMyJobStats } from '../api/jobs';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import StatsBar from '../components/StatsBar';

const emptyForm = {
  title: '',
  description: '',
  location: '',
  jobType: 'full-time',
  skillsRequired: '',
  salaryMin: '',
  salaryMax: '',
};

export default function CompanyDashboard() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadJobs = () => {
    setIsLoading(true);
    listMyJobs({ page, limit: 10 })
      .then((res) => {
        setJobs(res.data);
        setPagination(res.pagination);
      })
      .finally(() => setIsLoading(false));
  };

  const loadStats = () => {
    getMyJobStats().then((res) => setStats(res.data)).catch(() => {});
  };

  useEffect(loadJobs, [page]);
  useEffect(loadStats, [page]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createJob({
        ...form,
        skillsRequired: form.skillsRequired ? form.skillsRequired.split(',').map((s) => s.trim()) : [],
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      setPage(1);
      loadJobs();
      loadStats();
      toast.success('Job posted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create job posting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    await updateJob(job._id, { status: newStatus });
    loadJobs();
    loadStats();
    toast.info(`Job marked ${newStatus}.`);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">My job postings</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-ink text-paper px-4 py-2 rounded-sm text-sm hover:bg-ink-light transition-colors"
        >
          {showForm ? 'Cancel' : '+ Post a job'}
        </button>
      </div>

      {stats && stats.totalJobs > 0 && (
        <StatsBar
          stats={[
            { label: 'Open jobs', value: stats.open },
            { label: 'Closed jobs', value: stats.closed },
            { label: 'Total postings', value: stats.totalJobs },
            { label: 'Total applicants', value: stats.totalApplicants },
          ]}
        />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-hairline rounded-sm p-6 mb-10 space-y-4 bg-white">
          <div>
            <label className="block text-sm text-ink-light mb-1">Job title</label>
            <input
              required
              value={form.title}
              onChange={update('title')}
              className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-light mb-1">Description</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={update('description')}
              className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-light mb-1">Location</label>
              <input
                required
                value={form.location}
                onChange={update('location')}
                className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-light mb-1">Job type</label>
              <select
                value={form.jobType}
                onChange={update('jobType')}
                className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink-light mb-1">Skills required (comma-separated)</label>
            <input
              value={form.skillsRequired}
              onChange={update('skillsRequired')}
              placeholder="react, node.js, sql"
              className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-light mb-1">Min salary (optional)</label>
              <input
                type="number"
                value={form.salaryMin}
                onChange={update('salaryMin')}
                className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-light mb-1">Max salary (optional)</label>
              <input
                type="number"
                value={form.salaryMax}
                onChange={update('salaryMax')}
                className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-ink-light transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting…' : 'Post job'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-ink-light">Loading…</p>
      ) : jobs.length === 0 ? (
        <EmptyState title="No job postings yet" description="Post your first opening to start receiving applications." />
      ) : (
        <div className="divide-y divide-hairline border-t border-b border-hairline">
          {jobs.map((job) => (
            <div key={job._id} className="py-4 flex items-center justify-between">
              <div>
                <Link to={`/jobs/${job._id}`} className="font-medium text-ink hover:text-gold-dark transition-colors">
                  {job.title}
                </Link>
                <p className="text-sm text-ink-light">
                  {job.location} · {job.applicantCount} applicant{job.applicantCount === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link to={`/jobs/${job._id}/applicants`} className="text-sm text-gold-dark hover:underline">
                  View applicants
                </Link>
                <button onClick={() => toggleStatus(job)}>
                  <StatusBadge status={job.status} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
