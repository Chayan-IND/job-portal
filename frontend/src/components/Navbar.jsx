import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listMyNotifications } from '../api/notifications';
import { getMyCompanyProfile } from '../api/profiles';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [companyLogo, setCompanyLogo] = useState(null);

  useEffect(() => {
    if (!user) return;
    listMyNotifications({ limit: 1 })
      .then((res) => setUnreadCount(res.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'company') {
      setCompanyLogo(null);
      return;
    }
    getMyCompanyProfile()
      .then((res) => setCompanyLogo(res.data.profile.logoUrl))
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-hairline bg-paper sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink">
          {companyLogo && (
            <img src={companyLogo} alt="" className="h-7 w-7 rounded-sm object-contain border border-hairline" />
          )}
          Job Portal
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className="text-ink hover:text-gold-dark transition-colors">
            Browse jobs
          </Link>

          {!user && (
            <>
              <Link to="/login" className="text-ink hover:text-gold-dark transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink-light transition-colors"
              >
                Sign up
              </Link>
            </>
          )}

          {user?.role === 'student' && (
            <>
              <Link to="/dashboard" className="text-ink hover:text-gold-dark transition-colors">
                My applications
              </Link>
              <Link to="/profile" className="text-ink hover:text-gold-dark transition-colors">
                Profile
              </Link>
            </>
          )}

          {user?.role === 'company' && (
            <>
              <Link to="/dashboard" className="text-ink hover:text-gold-dark transition-colors">
                My jobs
              </Link>
              <Link to="/profile" className="text-ink hover:text-gold-dark transition-colors">
                Company profile
              </Link>
            </>
          )}

          {user && (
            <>
              <Link to="/notifications" className="relative text-ink hover:text-gold-dark transition-colors">
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-gold text-ink text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} className="text-ink-light hover:text-danger transition-colors">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
