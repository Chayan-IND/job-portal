import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listJobs } from '../api/jobs';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { timeAgo } from '../utils/timeAgo';

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [jobType, setJobType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Debounced: the API call only fires once you pause typing for 400ms,
  // instead of on every keystroke.
  const search = useDebouncedValue(searchInput, 400);
  const location = useDebouncedValue(locationInput, 400);

  useEffect(() => {
    setIsLoading(true);
    listJobs({ page, limit: 9, search: search || undefined, location: location || undefined, jobType: jobType || undefined })
      .then((res) => {
        setJobs(res.data);
        setPagination(res.pagination);
      })
      .finally(() => setIsLoading(false));
  }, [page, search, location, jobType]);

  // Reset to page 1 whenever a filter actually changes the debounced value.
  useEffect(() => {
    setPage(1);
  }, [search, location, jobType]);

  return (
    <div>
      <section className="border-b border-hairline bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-gold text-sm font-medium mb-3">Campus placements, open now</p>
          <h1 className="font-serif text-5xl leading-tight max-w-xl">
            Find the role that starts your career.
          </h1>
          <p className="mt-4 text-paper/70 max-w-md">
            Every listing here comes straight from verified companies recruiting on campus this
            season.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by title or keyword"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 min-w-[200px] border border-hairline rounded-sm px-4 py-2 text-sm bg-white focus:border-gold outline-none"
          />
          <input
            type="text"
            placeholder="Location"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="border border-hairline rounded-sm px-4 py-2 text-sm bg-white focus:border-gold outline-none"
          />
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="border border-hairline rounded-sm px-4 py-2 text-sm bg-white focus:border-gold outline-none"
          >
            <option value="">All types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-hairline rounded-sm p-5 bg-white animate-pulse h-40" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No jobs match yet"
            description="Try widening your search, or check back soon — new roles are posted regularly."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="border border-hairline rounded-sm p-5 bg-white hover:border-gold transition-colors flex flex-col"
              >
                <div className="flex items-start gap-3 mb-2">
                  {job.company?.logoUrl ? (
                    <img
                      src={job.company.logoUrl}
                      alt=""
                      className="h-9 w-9 rounded-sm object-contain border border-hairline flex-shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-sm border border-hairline bg-paper flex items-center justify-center text-xs text-ink-light flex-shrink-0">
                      {job.company?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg leading-snug truncate">{job.title}</h3>
                    <p className="text-sm text-ink-light truncate">{job.company?.name}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-sm text-ink-light mb-3">{job.location}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {job.skillsRequired?.slice(0, 2).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-paper border border-hairline rounded-full px-2 py-0.5 text-ink-light"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-ink-light flex-shrink-0">{timeAgo(job.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
