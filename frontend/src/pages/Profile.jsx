import { useAuth } from '../context/AuthContext';
import StudentProfile from './StudentProfile';
import CompanyProfile from './CompanyProfile';

export default function Profile() {
  const { user } = useAuth();
  if (user?.role === 'company') return <CompanyProfile />;
  return <StudentProfile />;
}
