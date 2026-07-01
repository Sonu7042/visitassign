import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getUsers, deleteUser } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table, { Td } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { STAFF_ROLES, ROLE_LABELS } from '../../utils/constants';
import { formatDate, getErrorMessage } from '../../utils/format';

export default function UsersListPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ role: role || undefined, page, limit: meta.limit });
      setUsers(res.data.data.users);
      setMeta(res.data.meta);
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
  }, [role, page]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500">Manage admin, security and employee accounts.</p>
        </div>
        <Link to="/users/new">
          <Button>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 max-w-xs">
          <Select
            label="Role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState title="No staff found" />
        ) : (
          <>
            <Table columns={['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', '']}>
              {users.map((u) => (
                <tr key={u._id}>
                  <Td className="font-medium text-slate-800">{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.phone}</Td>
                  <Td className="capitalize">{ROLE_LABELS[u.role] || u.role}</Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td>{formatDate(u.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Link to={`/users/${u._id}/edit`}>
                        <Button size="sm" variant="ghost" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {u._id !== currentUser._id && (
                        <Button size="sm" variant="ghost" title="Delete" onClick={() => setDeleteTarget(u)}>
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
        title="Delete staff member"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
