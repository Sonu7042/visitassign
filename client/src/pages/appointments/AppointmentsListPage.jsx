import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Eye } from 'lucide-react';
import { getAppointments } from '../../api/appointments';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table, { Td } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { APPOINTMENT_STATUSES } from '../../utils/constants';
import { formatDate, formatTime, getErrorMessage } from '../../utils/format';

export default function AppointmentsListPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const canCreate = ['admin', 'security', 'employee'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAppointments({
        status: filters.status || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        limit: meta.limit,
      });
      setAppointments(res.data.data.appointments);
      setMeta(res.data.meta || { total: res.data.data.appointments.length, page: 1, limit: 20 });
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
  }, [filters, page]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500">
            {user.role === 'visitor'
              ? 'Your visit requests and their status.'
              : user.role === 'employee'
              ? 'Appointments you are hosting.'
              : 'All appointments in your organization.'}
          </p>
        </div>
        {canCreate && (
          <Link to="/appointments/new">
            <Button>
              <Plus className="h-4 w-4" /> New appointment
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select label="Status" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All statuses</option>
            {APPOINTMENT_STATUSES.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status}
              </option>
            ))}
          </Select>
          <Input label="From" type="date" name="from" value={filters.from} onChange={handleFilterChange} />
          <Input label="To" type="date" name="to" value={filters.to} onChange={handleFilterChange} />
        </div>

        {loading ? (
          <Spinner />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments found" />
        ) : (
          <>
            <Table columns={['Visitor', 'Host', 'Purpose', 'Visit Date', 'Time', 'Status', '']}>
              {appointments.map((appt) => (
                <tr key={appt._id}>
                  <Td className="font-medium text-slate-800">{appt.visitorId?.fullName}</Td>
                  <Td>{appt.hostId?.name}</Td>
                  <Td>{appt.purpose}</Td>
                  <Td>{formatDate(appt.visitDate)}</Td>
                  <Td>
                    {formatTime(appt.expectedCheckIn)} - {formatTime(appt.expectedCheckOut)}
                  </Td>
                  <Td>
                    <Badge status={appt.status} />
                  </Td>
                  <Td>
                    <Link to={`/appointments/${appt._id}`}>
                      <Button size="sm" variant="ghost" title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </Td>
                </tr>
              ))}
            </Table>
            <div className="mt-4">
              <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
