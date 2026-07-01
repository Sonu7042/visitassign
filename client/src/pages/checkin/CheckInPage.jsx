import { useState } from 'react';
import toast from 'react-hot-toast';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { checkIn, checkOut } from '../../api/checkin';
import QrScanner from '../../components/QrScanner';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDateTime, getErrorMessage } from '../../utils/format';

export default function CheckInPage() {
  const [qrData, setQrData] = useState('');
  const [location, setLocation] = useState('Main Gate');
  const [loading, setLoading] = useState(null); // 'in' | 'out' | null
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = (text) => {
    setQrData(text);
    setResult(null);
    setError('');
    toast.success('QR code scanned');
  };

  const runAction = async (action) => {
    if (!qrData.trim()) return toast.error('Scan or paste a QR code first');

    setLoading(action);
    setResult(null);
    setError('');
    try {
      const res = action === 'in' ? await checkIn({ qrData, location }) : await checkOut({ qrData, location });
      setResult(res.data.data);
      toast.success(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const pass = result?.pass;
  const appointment = pass?.appointmentId;
  const visitor = appointment?.visitorId;
  const host = appointment?.hostId;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Check-In / Check-Out</h1>
        <p className="text-sm text-slate-500">Scan a visitor's pass QR code or paste the QR data manually.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Scan QR code">
          <QrScanner onScan={handleScan} />
        </Card>

        <Card title="Manual entry">
          <div className="flex flex-col gap-4">
            <Textarea
              label="QR data"
              rows={4}
              placeholder='Paste the QR payload, e.g. {"passId":"...","sig":"..."}'
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
            />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => runAction('in')} loading={loading === 'in'} className="flex-1">
                <LogIn className="h-4 w-4" /> Check in
              </Button>
              <Button
                variant="secondary"
                onClick={() => runAction('out')}
                loading={loading === 'out'}
                className="flex-1"
              >
                <LogOut className="h-4 w-4" /> Check out
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

      {pass && visitor && (
        <Card title="Scan result">
          <div className="flex items-start gap-4">
            {visitor.photo ? (
              <img src={visitor.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                <UserIcon className="h-8 w-8" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-slate-900">{visitor.fullName}</p>
              <p className="text-sm text-slate-500">{visitor.email}</p>
              <p className="text-sm text-slate-500">Host: {host?.name}</p>
              <p className="text-sm text-slate-500">Purpose: {appointment?.purpose}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge status={pass.status} />
                <span className="text-xs text-slate-400">Pass {pass.passNumber}</span>
              </div>
            </div>
          </div>
          {result.checkLog && (
            <p className="mt-4 text-xs text-slate-400">
              {result.checkLog.scanType === 'check-in' ? 'Checked in' : 'Checked out'} at{' '}
              {formatDateTime(result.checkLog.createdAt)} ({result.checkLog.location})
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
