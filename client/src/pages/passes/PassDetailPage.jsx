import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, FileDown } from 'lucide-react';
import { getPassById, emailPass } from '../../api/passes';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDateTime, getErrorMessage } from '../../utils/format';

export default function PassDetailPage() {
  const { id } = useParams();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPassById(id);
        setPass(res.data.data.pass);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleEmail = async () => {
    setEmailing(true);
    try {
      await emailPass(id);
      toast.success('Pass emailed to visitor');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEmailing(false);
    }
  };

  if (loading) return <Spinner />;
  if (!pass) return null;

  const appointment = pass.appointmentId;
  const visitor = appointment?.visitorId;
  const host = appointment?.hostId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/dashboard" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Visitor pass</h1>
        <Badge status={pass.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          {pass.qrCode ? (
            <img src={pass.qrCode} alt="QR code" className="h-56 w-56 rounded-lg border border-slate-200 p-2" />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
              No QR code
            </div>
          )}
          <p className="text-sm font-semibold text-slate-900">{pass.passNumber}</p>
          <p className="text-xs text-slate-400">Generated {formatDateTime(pass.generatedAt)}</p>
        </Card>

        <Card title="Visitor" className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" value={visitor?.fullName} />
            <Field label="Email" value={visitor?.email} />
            <Field label="Phone" value={visitor?.phone} />
            <Field label="Company" value={visitor?.company || '-'} />
            <Field label="Host" value={host?.name} />
            <Field label="Purpose" value={appointment?.purpose} />
            <Field label="Visit date" value={formatDateTime(appointment?.visitDate)} />
            <Field label="Status" value={<Badge status={pass.status} />} />
          </dl>

          <div className="mt-5 flex gap-2">
            <Button onClick={handleEmail} loading={emailing} variant="secondary">
              <Mail className="h-4 w-4" /> Email pass to visitor
            </Button>
            {pass.pdfUrl && (
              <a href={pass.pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">
                  <FileDown className="h-4 w-4" /> Download PDF
                </Button>
              </a>
            )}
          </div>
        </Card>
      </div>
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
