import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob } from '../api/jobs';
import { applyToJob } from '../api/applications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import { timeAgo } from '../utils/timeAgo';

export default function JobDetail() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [applyState, setApplyState] = useState('idle');

  useEffect(() => {
    getJob(jobId).then((res) => setJob(res.data.job));
  }, [jobId]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setApplyState('submitting');
    try {
      await applyToJob(jobId, { coverNote });
      setApplyState('applied');
      toast.success('Application submitted.');
    } catch (err) {
      setApplyState('error');
      toast.error(err.response?.data?.message || 'Could not submit application.');
    }
  };

  if (!job) return <div className="mx-auto max-w-3xl px-6 py-16 text-ink-light">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-start gap-4 mb-2">
        {job.company?.logoUrl ? (
          <img
            src={job.company.logoUrl}
            alt=""
            className="h-14 w-14 rounded-sm object-contain border border-hairline flex-shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-sm border border-hairline bg-paper flex items-center justify-center text-lg text-ink-light flex-shrink-0">
            {job.company?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-serif text-3xl leading-tight">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-ink-light">{job.company?.name}</p>
        </div>
      </div>

      <p className="text-ink-light mb-6">
        {job.location} · {job.jobType}
        {(job.salaryMin || job.salaryMax) && ` · ₹${job.salaryMin ?? '?'} – ₹${job.salaryMax ?? '?'}`}
        {' · '}
        posted {timeAgo(job.createdAt)}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-8">
        {job.skillsRequired?.map((skill) => (
          <span key={skill} className="text-xs bg-paper border border-hairline rounded-full px-2.5 py-1 text-ink-light">
            {skill}
          </span>
        ))}
      </div>

      <p className="whitespace-pre-line text-ink leading-relaxed mb-12">{job.description}</p>

      {user?.role === 'student' && job.status === 'open' && (
        <div className="border-t border-hairline pt-8">
          <h2 className="font-serif text-xl mb-3">Apply to this role</h2>
          {applyState === 'applied' ? (
            <p className="text-success">
              Application submitted. You can track its status from your dashboard.
            </p>
          ) : (
            <form onSubmit={handleApply} className="space-y-3">
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Add a short note to the recruiter (optional)"
                rows={4}
                className="w-full border border-hairline rounded-sm px-4 py-3 text-sm focus:border-gold outline-none"
              />
              <button
                type="submit"
                disabled={applyState === 'submitting'}
                className="bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-ink-light transition-colors disabled:opacity-50"
              >
                {applyState === 'submitting' ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          )}
        </div>
      )}

      {!user && job.status === 'open' && (
        <div className="border-t border-hairline pt-8">
          <button
            onClick={() => navigate('/login')}
            className="bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-ink-light transition-colors"
          >
            Log in to apply
          </button>
        </div>
      )}
    </div>
  );
}
