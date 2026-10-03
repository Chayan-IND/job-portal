import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import CompanyDashboard from './CompanyDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'company') return <CompanyDashboard />;
  return <StudentDashboard />;
}
