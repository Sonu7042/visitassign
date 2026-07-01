import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Spinner from './components/ui/Spinner';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SelfRegisterPage from './pages/public/SelfRegisterPage';

import DashboardPage from './pages/dashboard/DashboardPage';

import VisitorsListPage from './pages/visitors/VisitorsListPage';
import VisitorFormPage from './pages/visitors/VisitorFormPage';
import VisitorDetailPage from './pages/visitors/VisitorDetailPage';

import AppointmentsListPage from './pages/appointments/AppointmentsListPage';
import AppointmentFormPage from './pages/appointments/AppointmentFormPage';
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage';

import PassDetailPage from './pages/passes/PassDetailPage';
import MyPassesPage from './pages/passes/MyPassesPage';

import CheckInPage from './pages/checkin/CheckInPage';
import OrganizationSettingsPage from './pages/organization/OrganizationSettingsPage';

import UsersListPage from './pages/users/UsersListPage';
import UserFormPage from './pages/users/UserFormPage';

import ReportsPage from './pages/reports/ReportsPage';

import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

const STAFF_ROLES = ['admin', 'security', 'employee'];

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading..." />
      </div>
    );
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/visit-request/:organizationId" element={<SelfRegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/appointments" element={<AppointmentsListPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/passes/:id" element={<PassDetailPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
        <Route element={<AppLayout />}>
          <Route path="/visitors" element={<VisitorsListPage />} />
          <Route path="/visitors/new" element={<VisitorFormPage />} />
          <Route path="/visitors/:id" element={<VisitorDetailPage />} />
          <Route path="/visitors/:id/edit" element={<VisitorFormPage />} />

          <Route path="/appointments/new" element={<AppointmentFormPage />} />

          <Route path="/organization" element={<OrganizationSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin', 'security']} />}>
        <Route element={<AppLayout />}>
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/users/:id/edit" element={<UserFormPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['visitor']} />}>
        <Route element={<AppLayout />}>
          <Route path="/my-passes" element={<MyPassesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
