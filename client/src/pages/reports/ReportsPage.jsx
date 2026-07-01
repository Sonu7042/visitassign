import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Eye } from 'lucide-react';
import {
  getVisitorsReport,
  getAppointmentsReport,
  getCheckLogsReport,
  downloadReportCsv,
} from '../../api/reports';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table, { Td } from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { APPOINTMENT_STATUSES } from '../../utils/constants';
import { formatDateTime, getErrorMessage } from '../../utils/format';

const TABS = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'check-logs', label: 'Check logs' },
];

const EMPTY_FILTERS = {
  visitors: { search: '', isBlacklisted: '', startDate: '', endDate: '' },
  appointments: { status: '', startDate: '', endDate: '' },
  'check-logs': { scanType: '', startDate: '', endDate: '' },
};

export default function ReportsPage() {
  const [tab, setTab] = useState('visitors');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const currentFilters = filters[tab];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [tab]: { ...currentFilters, [name]: value } });
  };

  const buildParams = () => {
    const params = {};
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    return params;
  };

  const handleView = async () => {
    setLoading(true);
    setRows(null);
    try {
      const params = buildParams();
      let res;
      if (tab === 'visitors') res = await getVisitorsReport(params);
      else if (tab === 'appointments') res = await getAppointmentsReport(params);
      else res = await getCheckLogsReport(params);

      const key = tab === 'visitors' ? 'visitors' : tab === 'appointments' ? 'appointments' : 'logs';
      setRows(res.data.data[key]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReportCsv(tab, buildParams(), `${tab}-report.csv`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">View and export reports for your organization.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setRows(null);
            }}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {tab === 'visitors' && (
            <>
              <Input label="Search" name="search" value={filters.visitors.search} onChange={handleFilterChange} />
              <Select
                label="Blacklisted"
                name="isBlacklisted"
                value={filters.visitors.isBlacklisted}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Blacklisted</option>
                <option value="false">Active</option>
              </Select>
            </>
          )}

          {tab === 'appointments' && (
            <Select
              label="Status"
              name="status"
              value={filters.appointments.status}
              onChange={handleFilterChange}
            >
              <option value="">All statuses</option>
              {APPOINTMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          )}

          {tab === 'check-logs' && (
            <Select
              label="Scan type"
              name="scanType"
              value={filters['check-logs'].scanType}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="check-in">Check-in</option>
              <option value="check-out">Check-out</option>
            </Select>
          )}

          <Input
            label="Start date"
            type="date"
            name="startDate"
            value={currentFilters.startDate}
            onChange={handleFilterChange}
          />
          <Input
            label="End date"
            type="date"
            name="endDate"
            value={currentFilters.endDate}
            onChange={handleFilterChange}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleView} loading={loading}>
            <Eye className="h-4 w-4" /> View
          </Button>
          <Button variant="secondary" onClick={handleDownload} loading={downloading}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : rows === null ? null : rows.length === 0 ? (
        <EmptyState title="No data found" description="Try adjusting the filters and view again." />
      ) : (
        <Card>
          {tab === 'visitors' && <VisitorsTable rows={rows} />}
          {tab === 'appointments' && <AppointmentsTable rows={rows} />}
          {tab === 'check-logs' && <CheckLogsTable rows={rows} />}
        </Card>
      )}
    </div>
  );
}

function VisitorsTable({ rows }) {
  return (
    <Table columns={['Full Name', 'Email', 'Phone', 'Company', 'Status', 'Registered On']}>
      {rows.map((v) => (
        <tr key={v._id}>
          <Td className="font-medium text-slate-800">{v.fullName}</Td>
          <Td>{v.email}</Td>
          <Td>{v.phone}</Td>
          <Td>{v.company || '-'}</Td>
          <Td>
            <Badge status={String(v.isBlacklisted)}>{v.isBlacklisted ? 'Blacklisted' : 'Active'}</Badge>
          </Td>
          <Td>{formatDateTime(v.createdAt)}</Td>
        </tr>
      ))}
    </Table>
  );
}

function AppointmentsTable({ rows }) {
  return (
    <Table columns={['Visitor', 'Visitor Email', 'Host', 'Purpose', 'Visit Date', 'Status']}>
      {rows.map((a) => (
        <tr key={a._id}>
          <Td className="font-medium text-slate-800">{a.visitorId?.fullName}</Td>
          <Td>{a.visitorId?.email}</Td>
          <Td>{a.hostId?.name}</Td>
          <Td>{a.purpose}</Td>
          <Td>{formatDateTime(a.visitDate)}</Td>
          <Td>
            <Badge status={a.status} />
          </Td>
        </tr>
      ))}
    </Table>
  );
}

function CheckLogsTable({ rows }) {
  return (
    <Table columns={['Pass Number', 'Visitor', 'Host', 'Type', 'Location', 'Scanned By', 'Timestamp']}>
      {rows.map((log, idx) => (
        <tr key={idx}>
          <Td className="font-medium text-slate-800">{log.passNumber}</Td>
          <Td>{log.visitorName}</Td>
          <Td>{log.hostName}</Td>
          <Td className="capitalize">{log.scanType}</Td>
          <Td>{log.location}</Td>
          <Td>{log.scannedBy}</Td>
          <Td>{formatDateTime(log.timestamp)}</Td>
        </tr>
      ))}
    </Table>
  );
}
