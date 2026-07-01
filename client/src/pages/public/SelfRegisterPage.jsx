import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { getOrganizationHosts } from '../../api/organizations';
import { sendOtp, verifyOtp } from '../../api/auth';
import { selfRegisterAppointment } from '../../api/appointments';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { getErrorMessage } from '../../utils/format';

const STEPS = ['Verify', 'Visit details', 'Done'];

export default function SelfRegisterPage() {
  const { organizationId } = useParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    hostId: '',
    purpose: '',
    visitDate: '',
    expectedCheckIn: '',
    expectedCheckOut: '',
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getOrganizationHosts(organizationId);
        setOrg(res.data.data.organization);
        setHosts(res.data.data.hosts);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [organizationId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOtp = async () => {
    if (!form.email) return toast.error('Enter your email first');
    try {
      await sendOtp({ target: form.email, channel: 'email', purpose: 'visitor-registration' });
      setOtpSent(true);
      toast.success('Verification code sent to your email');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp({ target: form.email, code: otpCode, purpose: 'visitor-registration' });
      setOtpVerified(true);
      toast.success('Email verified');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await selfRegisterAppointment({ ...form, organizationId });
      setResult(res.data.data.appointment);
      setStep(2);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading organization..." />;

  if (!org) {
    return (
      <div className="text-center text-sm text-red-600">
        This visit request link is invalid or the organization could not be found.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Request a visit</h2>
      <p className="mb-5 text-sm text-slate-500">
        You're requesting a visit to <span className="font-medium text-slate-700">{org.organizationName}</span>.
      </p>

      <div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-400">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                i <= step ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? 'text-slate-700' : ''}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Input label="Full name" name="fullName" required value={form.fullName} onChange={handleChange} />
          <Input
            label="Email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            disabled={otpVerified}
          />
          <Input label="Phone" name="phone" required value={form.phone} onChange={handleChange} />

          {!otpVerified && (
            <div className="rounded-lg border border-slate-200 p-3">
              {!otpSent ? (
                <Button type="button" variant="secondary" onClick={handleSendOtp} className="w-full">
                  <MailCheck className="h-4 w-4" /> Send verification code
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    label="Enter the 6-digit code sent to your email"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                  />
                  <Button type="button" variant="secondary" onClick={handleVerifyOtp}>
                    Verify code
                  </Button>
                </div>
              )}
            </div>
          )}

          {otpVerified && (
            <p className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Email verified
            </p>
          )}

          <Button
            type="button"
            disabled={!form.fullName || !form.email || !form.phone || !otpVerified}
            onClick={() => setStep(1)}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Company (optional)" name="company" value={form.company} onChange={handleChange} />
          <Input label="Address (optional)" name="address" value={form.address} onChange={handleChange} />
          <Select label="Person you're visiting" name="hostId" required value={form.hostId} onChange={handleChange}>
            <option value="">Select a host</option>
            {hosts.map((host) => (
              <option key={host._id} value={host._id}>
                {host.name} ({host.email})
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
          <div className="grid grid-cols-2 gap-3">
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

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)} className="flex-1">
              Back
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              Submit request
            </Button>
          </div>
        </form>
      )}

      {step === 2 && result && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h3 className="text-lg font-semibold text-slate-900">Request submitted!</h3>
          <p className="text-sm text-slate-500">
            Thanks, {result.visitorId?.fullName}. Your visit request for{' '}
            {new Date(result.visitDate).toLocaleDateString()} has been sent to{' '}
            {result.hostId?.name} for approval. You'll be notified by email once it's reviewed.
          </p>
        </div>
      )}
    </div>
  );
}
