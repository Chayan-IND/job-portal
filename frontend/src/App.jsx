import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import JobsList from './pages/JobsList';
import JobDetail from './pages/JobDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import JobApplicants from './pages/JobApplicants';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<JobsList />} />
              <Route path="/jobs/:jobId" element={<JobDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student', 'company']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['student', 'company']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:jobId/applicants"
                element={
                  <ProtectedRoute allowedRoles={['company']}>
                    <JobApplicants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute allowedRoles={['student', 'company']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
