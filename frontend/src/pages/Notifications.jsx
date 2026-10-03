import { useEffect, useState } from 'react';
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    listMyNotifications({ page, limit: 15 })
      .then((res) => {
        setNotifications(res.data);
        setPagination(res.pagination);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [page]);

  const handleRead = async (id) => {
    await markNotificationRead(id);
    load();
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    load();
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Notifications</h1>
        <button onClick={handleReadAll} className="text-sm text-gold-dark hover:underline">Mark all as read</button>
      </div>

      {isLoading ? (
        <p className="text-ink-light">Loading…</p>
      ) : notifications.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Updates on your applications will appear here." />
      ) : (
        <div className="divide-y divide-hairline border-t border-b border-hairline">
          {notifications.map((n) => (
            <button key={n._id} onClick={() => !n.isRead && handleRead(n._id)}
              className={`w-full text-left py-4 flex items-start gap-3 ${n.isRead ? 'opacity-60' : ''}`}>
              <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-gold'}`} />
              <div>
                <p className="text-sm text-ink">{n.message}</p>
                <p className="text-xs text-ink-light mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
