import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  UserX,
  UserCog,
  CalendarCheck,
  CalendarClock,
  Clock,
  Ticket,
  ScanLine,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getDashboardStats, getDashboardAnalytics } from '../../api/dashboard';
import { approveAppointment, rejectAppointment } from '../../api/appointments';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import AnalyticsCharts from './AnalyticsCharts';
import { formatDate, getErrorMessage } from '../../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res.data.data.stats);

      if (user.role === 'admin') {
        const analyticsRes = await getDashboardAnalytics();
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">Here's what's happening today.</p>
      </div>

      {user.role === 'admin' && <AdminDashboard stats={stats} />}
      {user.role === 'security' && <SecurityDashboard stats={stats} />}
      {user.role === 'employee' && <EmployeeDashboard stats={stats} onRefresh={load} />}
      {user.role === 'visitor' && <VisitorDashboard stats={stats} />}

      {user.role === 'admin' && analytics && <AnalyticsCharts analytics={analytics} />}
    </div>
  );
}

function AdminDashboard({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Visitors" value={stats.totalVisitors} icon={Users} />
      <StatCard
        label="Blacklisted Visitors"
        value={stats.blacklistedVisitors}
        icon={UserX}
        accent="bg-red-50 text-red-600"
      />
      <StatCard label="Staff Members" value={stats.totalStaff} icon={UserCog} />
      <StatCard label="Total Appointments" value={stats.totalAppointments} icon={CalendarCheck} />
      <StatCard label="Today's Appointments" value={stats.todaysAppointments} icon={CalendarClock} />
      <StatCard
        label="Pending Approvals"
        value={stats.pendingApprovals}
        icon={Clock}
        accent="bg-amber-50 text-amber-600"
      />
      <StatCard label="Active Passes" value={stats.activePasses} icon={Ticket} />
      <StatCard
        label="Checked-in Now"
        value={stats.checkedInNow}
        icon={ScanLine}
        accent="bg-emerald-50 text-emerald-600"
      />
    </div>
  );
}

function SecurityDashboard({ stats }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Checked-in Now"
          value={stats.checkedInNow}
          icon={ScanLine}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard label="Today's Check-ins" value={stats.todaysCheckIns} icon={LogIn} />
        <StatCard label="Today's Check-outs" value={stats.todaysCheckOuts} icon={LogOut} />
        <StatCard label="Today's Appointments" value={stats.todaysAppointments} icon={CalendarClock} />
      </div>
      <Card title="Quick action">
        <Link to="/checkin">
          <Button>
            <ScanLine className="h-4 w-4" /> Open check-in scanner
          </Button>
        </Link>
      </Card>
    </>
  );
}

function EmployeeDashboard({ stats, onRefresh }) {
  const [actingId, setActingId] = useState(null);

  const handleDecision = async (id, action) => {
    setActingId(id);
    try {
      if (action === 'approve') await approveAppointment(id, {});
      else await rejectAppointment(id, {});
      toast.success(`Appointment ${action}d`);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={Clock}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard label="Upcoming Approved Visits" value={stats.upcomingApprovals} icon={CalendarClock} />
        <StatCard label="Visitors Hosted" value={stats.totalVisitorsHosted} icon={Users} />
      </div>

      <Card title="Recent appointment requests">
        {stats.recentAppointments?.length ? (
          <div className="flex flex-col divide-y divide-slate-100">
            {stats.recentAppointments.map((appt) => (
              <div key={appt._id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-800">{appt.visitorId?.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {appt.purpose} &middot; {formatDate(appt.visitDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={appt.status} />
                  {appt.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        loading={actingId === appt._id}
                        onClick={() => handleDecision(appt._id, 'approve')}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actingId === appt._id}
                        onClick={() => handleDecision(appt._id, 'reject')}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  <Link to={`/appointments/${appt._id}`}>
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No recent appointments" />
        )}
      </Card>
    </>
  );
}

function VisitorDashboard({ stats }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total Completed Visits" value={stats.totalVisits} icon={CalendarCheck} />
        <Card title="Active pass" className="sm:col-span-1">
          {stats.activePass ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{stats.activePass.passNumber}</p>
                <Badge status={stats.activePass.status} />
              </div>
              <Link to={`/passes/${stats.activePass._id}`}>
                <Button size="sm">
                  <Ticket className="h-4 w-4" /> View pass
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">You don't have an active pass right now.</p>
          )}
        </Card>
      </div>

      <Card title="Recent appointments">
        {stats.appointments?.length ? (
          <div className="flex flex-col divide-y divide-slate-100">
            {stats.appointments.map((appt) => (
              <div key={appt._id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-800">{appt.purpose}</p>
                  <p className="text-sm text-slate-500">
                    Host: {appt.hostId?.name} &middot; {formatDate(appt.visitDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={appt.status} />
                  <Link to={`/appointments/${appt._id}`}>
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No appointments yet" />
        )}
      </Card>
    </>
  );
}
