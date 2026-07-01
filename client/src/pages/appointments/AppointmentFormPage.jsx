import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, X } from 'lucide-react';
import { getVisitors } from '../../api/visitors';
import { getHosts } from '../../api/users';
import { createAppointment } from '../../api/appointments';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/format';

export default function AppointmentFormPage() {
  const navigate = useNavigate();

  const [hosts, setHosts] = useState([]);
  const [visitorQuery, setVisitorQuery] = useState('');
  const [visitorResults, setVisitorResults] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    hostId: '',
    purpose: '',
    visitDate: '',
    expectedCheckIn: '',
    expectedCheckOut: '',
    notes: '',
  });

  useEffect(() => {
    getHosts()
      .then((res) => setHosts(res.data.data.hosts))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!visitorQuery || selectedVisitor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisitorResults([]);
      return;
    }
    const timer = setTimeout(() => {
      getVisitors({ search: visitorQuery, limit: 5 })
        .then((res) => setVisitorResults(res.data.data.visitors))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [visitorQuery, selectedVisitor]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVisitor) return toast.error('Select a visitor');
    if (selectedVisitor.isBlacklisted) return toast.error('This visitor is blacklisted');

    setSaving(true);
    try {
      await createAppointment({ ...form, visitorId: selectedVisitor._id });
      toast.success('Appointment created');
      navigate('/appointments');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/appointments" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">New appointment</h1>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Visitor</span>
            {selectedVisitor ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{selectedVisitor.fullName}</p>
                  <p className="text-slate-500">{selectedVisitor.email}</p>
                  {selectedVisitor.isBlacklisted && (
                    <p className="text-xs text-red-600">This visitor is blacklisted</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVisitor(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search visitor by name, email or phone"
                  value={visitorQuery}
                  onChange={(e) => setVisitorQuery(e.target.value)}
                />
                {visitorResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {visitorResults.map((v) => (
                      <button
                        type="button"
                        key={v._id}
                        onClick={() => {
                          setSelectedVisitor(v);
                          setVisitorQuery('');
                        }}
                        className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">{v.fullName}</span>
                        <span className="text-slate-500">{v.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Visitor not registered yet?{' '}
                  <Link to="/visitors/new" className="text-primary-600 hover:underline">
                    Add them first
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          <Select label="Host" name="hostId" required value={form.hostId} onChange={handleChange}>
            <option value="">Select a host</option>
            {hosts.map((host) => (
              <option key={host._id} value={host._id}>
                {host.name} ({host.role})
              </option>
            ))}
          </Select>

          <Input label="Purpose of visit" name="purpose" required value={form.purpose} onChange={handleChange} />
          <Input
            label="Visit date"
            type="date"
            name="visitDate"
            required
            value={form.visitDate}
            onChange={handleChange}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Expected check-in"
              type="datetime-local"
              name="expectedCheckIn"
              required
              value={form.expectedCheckIn}
              onChange={handleChange}
            />
            <Input
              label="Expected check-out"
              type="datetime-local"
              name="expectedCheckOut"
              required
              value={form.expectedCheckOut}
              onChange={handleChange}
            />
          </div>
          <Textarea label="Notes (optional)" name="notes" rows={3} value={form.notes} onChange={handleChange} />

          <div className="flex justify-end gap-2 pt-2">
            <Link to="/appointments">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              Create appointment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
