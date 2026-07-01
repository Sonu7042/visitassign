import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, User as UserIcon, FileText } from 'lucide-react';
import { getVisitorById, deleteVisitor } from '../../api/visitors';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDateTime, getErrorMessage } from '../../utils/format';

export default function VisitorDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getVisitorById(id);
        setVisitor(res.data.data.visitor);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteVisitor(id);
      toast.success('Visitor deleted');
      navigate('/visitors');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!visitor) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link to="/visitors" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">{visitor.fullName}</h1>
          <Badge status={String(visitor.isBlacklisted)}>
            {visitor.isBlacklisted ? 'Blacklisted' : 'Active'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link to={`/visitors/${id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </Link>
          {user.role === 'admin' && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center lg:col-span-1">
          {visitor.photo ? (
            <img src={visitor.photo} alt={visitor.fullName} className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <UserIcon className="h-12 w-12" />
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-slate-900">{visitor.fullName}</p>
            <p className="text-sm text-slate-500">{visitor.company || 'No company specified'}</p>
          </div>
          {visitor.governmentId && (
            <a
              href={visitor.governmentId}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
            >
              <FileText className="h-4 w-4" /> View government ID
            </a>
          )}
        </Card>

        <Card title="Profile details" className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" value={visitor.email} />
            <Field label="Phone" value={visitor.phone} />
            <Field label="Address" value={visitor.address || '-'} />
            <Field label="Registered on" value={formatDateTime(visitor.createdAt)} />
          </dl>

          {visitor.isBlacklisted && visitor.blacklistReason && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <span className="font-medium">Blacklist reason: </span>
              {visitor.blacklistReason}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete visitor"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${visitor.fullName}"? This cannot be undone.`}
      />
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
