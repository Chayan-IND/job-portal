import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listApplicationsForJob, updateApplicationStatus } from '../api/applications';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';

const NEXT_ACTIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['hired', 'rejected'],
  hired: [],
  rejected: [],
};

export default function JobApplicants() {
  const { jobId } = useParams();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    listApplicationsForJob(jobId, { page, limit: 10 })
      .then((res) => {
        setApplications(res.data);
        setPagination(res.pagination);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [jobId, page]);

  const handleStatusChange = async (applicationId, status) => {
    await updateApplicationStatus(applicationId, status);
    load();
    toast.success(`Marked as ${status}.`);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/dashboard" className="text-sm text-gold-dark hover:underline mb-4 inline-block">← Back to my jobs</Link>
      <h1 className="font-serif text-3xl mb-8">Applicants</h1>

      {isLoading ? (
        <p className="text-ink-light">Loading…</p>
      ) : applications.length === 0 ? (
        <EmptyState title="No applicants yet" description="Check back once students start applying." />
      ) : (
        <div className="divide-y divide-hairline border-t border-b border-hairline">
          {applications.map((app) => (
            <div key={app._id} className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{app.student?.name}</p>
                <p className="text-sm text-ink-light">{app.student?.email}</p>
                <a href={app.resumeUrlSnapshot} target="_blank" rel="noreferrer" className="text-sm text-gold-dark hover:underline">
                  View resume
                </a>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={app.status} />
                {NEXT_ACTIONS[app.status]?.map((action) => (
                  <button key={action} onClick={() => handleStatusChange(app._id, action)}
                    className="text-xs border border-hairline rounded-full px-3 py-1 text-ink-light hover:border-gold hover:text-gold-dark transition-colors capitalize">
                    Mark {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
