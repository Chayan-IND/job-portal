import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyApplications, getMyApplicationStats } from '../api/applications';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import StatsBar from '../components/StatsBar';

export default function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    listMyApplications({ page, limit: 10 })
      .then((res) => {
        setApplications(res.data);
        setPagination(res.pagination);
      })
      .finally(() => setIsLoading(false));
  }, [page]);

  useEffect(() => {
    getMyApplicationStats().then((res) => setStats(res.data)).catch(() => {});
  }, [page]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl mb-6">My applications</h1>

      {stats && stats.total > 0 && (
        <StatsBar
          stats={[
            { label: 'Total applied', value: stats.total },
            { label: 'Shortlisted', value: stats.shortlisted },
            { label: 'Hired', value: stats.hired },
            { label: 'Rejected', value: stats.rejected },
          ]}
        />
      )}

      {isLoading ? (
        <p className="text-ink-light">Loading…</p>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Browse open roles and apply — they'll show up here once you do."
          action={
            <Link to="/" className="text-gold-dark hover:underline text-sm font-medium">
              Browse jobs →
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-hairline border-t border-b border-hairline">
          {applications.map((app) => (
            <div key={app._id} className="py-4 flex items-center justify-between">
              <div>
                <Link
                  to={`/jobs/${app.job?._id}`}
                  className="font-medium text-ink hover:text-gold-dark transition-colors"
                >
                  {app.job?.title || 'Job no longer available'}
                </Link>
                <p className="text-sm text-ink-light">{app.job?.location}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
