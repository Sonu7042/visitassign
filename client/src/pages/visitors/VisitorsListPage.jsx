import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Eye, Pencil, Trash2, Ban, CheckCircle2, User as UserIcon } from 'lucide-react';
import { getVisitors, deleteVisitor, setVisitorBlacklist } from '../../api/visitors';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table, { Td } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { getErrorMessage } from '../../utils/format';

export default function VisitorsListPage() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [blacklistTarget, setBlacklistTarget] = useState(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklisting, setBlacklisting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getVisitors({ search: search || undefined, page, limit: meta.limit });
      setVisitors(res.data.data.visitors);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteVisitor(deleteTarget._id);
      toast.success('Visitor deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const openBlacklistModal = (visitor) => {
    setBlacklistTarget(visitor);
    setBlacklistReason(visitor.blacklistReason || '');
  };

  const handleBlacklistToggle = async () => {
    setBlacklisting(true);
    try {
      const isBlacklisted = !blacklistTarget.isBlacklisted;
      await setVisitorBlacklist(blacklistTarget._id, {
        isBlacklisted,
        blacklistReason: isBlacklisted ? blacklistReason : undefined,
      });
      toast.success(isBlacklisted ? 'Visitor blacklisted' : 'Visitor removed from blacklist');
      setBlacklistTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBlacklisting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Visitors</h1>
          <p className="text-sm text-slate-500">Manage visitor profiles for your organization.</p>
        </div>
        <Link to="/visitors/new">
          <Button>
            <Plus className="h-4 w-4" /> Add visitor
          </Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Search by name, email, phone or company"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : visitors.length === 0 ? (
          <EmptyState title="No visitors found" description="Try adjusting your search or add a new visitor." />
        ) : (
          <>
            <Table columns={['Visitor', 'Email', 'Phone', 'Company', 'Status', 'Actions']}>
              {visitors.map((visitor) => (
                <tr key={visitor._id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      {visitor.photo ? (
                        <img src={visitor.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                      <span className="font-medium text-slate-800">{visitor.fullName}</span>
                    </div>
                  </Td>
                  <Td>{visitor.email}</Td>
                  <Td>{visitor.phone}</Td>
                  <Td>{visitor.company || '-'}</Td>
                  <Td>
                    <Badge status={String(visitor.isBlacklisted)}>
                      {visitor.isBlacklisted ? 'Blacklisted' : 'Active'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Link to={`/visitors/${visitor._id}`}>
                        <Button size="sm" variant="ghost" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/visitors/${visitor._id}/edit`}>
                        <Button size="sm" variant="ghost" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {['admin', 'security'].includes(user.role) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title={visitor.isBlacklisted ? 'Remove from blacklist' : 'Blacklist'}
                          onClick={() => openBlacklistModal(visitor)}
                        >
                          {visitor.isBlacklisted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Ban className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete"
                          onClick={() => setDeleteTarget(visitor)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete visitor"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${deleteTarget?.fullName}"? This cannot be undone.`}
      />

      <Modal
        open={!!blacklistTarget}
        onClose={() => setBlacklistTarget(null)}
        title={blacklistTarget?.isBlacklisted ? 'Remove from blacklist' : 'Blacklist visitor'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBlacklistTarget(null)} disabled={blacklisting}>
              Cancel
            </Button>
            <Button
              variant={blacklistTarget?.isBlacklisted ? 'success' : 'danger'}
              onClick={handleBlacklistToggle}
              loading={blacklisting}
            >
              {blacklistTarget?.isBlacklisted ? 'Remove' : 'Blacklist'}
            </Button>
          </>
        }
      >
        {blacklistTarget?.isBlacklisted ? (
          <p>Remove "{blacklistTarget?.fullName}" from the blacklist?</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p>Blacklist "{blacklistTarget?.fullName}"? They won't be able to be checked in.</p>
            <Textarea
              label="Reason (optional)"
              rows={2}
              value={blacklistReason}
              onChange={(e) => setBlacklistReason(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
