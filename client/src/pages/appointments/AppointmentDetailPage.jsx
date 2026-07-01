import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, X as XIcon, Ticket } from 'lucide-react';
import { getAppointmentById, approveAppointment, rejectAppointment } from '../../api/appointments';
import { generatePass } from '../../api/passes';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { formatDate, formatDateTime, getErrorMessage } from '../../utils/format';

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null); // 'approve' | 'reject'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      const res = await getAppointmentById(id);
      setAppointment(res.data.data.appointment);
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
  }, [id]);

  if (loading) return <Spinner />;
  if (!appointment) return null;

  const canDecide =
    appointment.status === 'pending' &&
    (user.role === 'admin' ||
      (user.role === 'employee' && appointment.hostId?._id === user._id));

  const canGeneratePass =
    appointment.status === 'approved' && ['admin', 'security', 'employee'].includes(user.role);

  const handleDecision = async () => {
    setDeciding(true);
    try {
      if (decision === 'approve') {
        await approveAppointment(id, { notes: decisionNotes || undefined });
        toast.success('Appointment approved');
      } else {
        await rejectAppointment(id, { notes: decisionNotes || undefined });
        toast.success('Appointment rejected');
      }
      setDecision(null);
      setDecisionNotes('');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeciding(false);
    }
  };

  const handleGeneratePass = async () => {
    setGenerating(true);
    try {
      const res = await generatePass(id);
      toast.success('Pass generated');
      navigate(`/passes/${res.data.data.pass._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/appointments" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Appointment details</h1>
          <Badge status={appointment.status} />
        </div>
        <div className="flex gap-2">
          {canDecide && (
            <>
              <Button variant="success" onClick={() => setDecision('approve')}>
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button variant="danger" onClick={() => setDecision('reject')}>
                <XIcon className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {canGeneratePass && (
            <Button onClick={handleGeneratePass} loading={generating}>
              <Ticket className="h-4 w-4" /> Generate pass
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Visitor">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={appointment.visitorId?.fullName} />
            <Field label="Email" value={appointment.visitorId?.email} />
            <Field label="Phone" value={appointment.visitorId?.phone} />
            <Field label="Company" value={appointment.visitorId?.company || '-'} />
          </dl>
          {appointment.visitorId?._id && (
            <Link
              to={`/visitors/${appointment.visitorId._id}`}
              className="mt-3 inline-block text-sm text-primary-600 hover:underline"
            >
              View visitor profile
            </Link>
          )}
        </Card>

        <Card title="Host">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={appointment.hostId?.name} />
            <Field label="Email" value={appointment.hostId?.email} />
            <Field label="Phone" value={appointment.hostId?.phone} />
            <Field label="Role" value={appointment.hostId?.role} />
          </dl>
        </Card>

        <Card title="Visit details" className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Purpose" value={appointment.purpose} />
            <Field label="Visit date" value={formatDate(appointment.visitDate)} />
            <Field label="Expected check-in" value={formatDateTime(appointment.expectedCheckIn)} />
            <Field label="Expected check-out" value={formatDateTime(appointment.expectedCheckOut)} />
          </dl>
          {appointment.notes && (
            <div className="mt-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Notes</dt>
              <dd className="mt-1 text-sm text-slate-700">{appointment.notes}</dd>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision === 'approve' ? 'Approve appointment' : 'Reject appointment'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)} disabled={deciding}>
              Cancel
            </Button>
            <Button
              variant={decision === 'approve' ? 'success' : 'danger'}
              onClick={handleDecision}
              loading={deciding}
            >
              {decision === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Notes (optional)"
          rows={3}
          value={decisionNotes}
          onChange={(e) => setDecisionNotes(e.target.value)}
        />
      </Modal>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
