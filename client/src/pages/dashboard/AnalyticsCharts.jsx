import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { monthLabel } from '../../utils/format';
import Card from '../../components/ui/Card';

export default function AnalyticsCharts({ analytics }) {
  const months = new Map();

  const merge = (trend, key) => {
    trend.forEach(({ _id, count }) => {
      const label = monthLabel(_id.year, _id.month);
      const entry = months.get(label) || { month: label };
      entry[key] = count;
      months.set(label, entry);
    });
  };

  merge(analytics.visitorTrend || [], 'visitors');
  merge(analytics.appointmentTrend || [], 'appointments');

  const data = Array.from(months.values());

  return (
    <Card title="Last 6 months trend">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="visitors" stroke="#aa3bff" strokeWidth={2} name="New visitors" />
            <Line type="monotone" dataKey="appointments" stroke="#22c55e" strokeWidth={2} name="Appointments" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
