import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { getUserById, createUser, updateUser } from '../../api/users';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { STAFF_ROLES, ROLE_LABELS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/format';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', role: 'employee', isActive: true };

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await getUserById(id);
        const u = res.data.data.user;
        setForm({
          name: u.name,
          email: u.email,
          phone: u.phone,
          password: '',
          role: u.role,
          isActive: u.isActive,
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateUser(id, { name: form.name, phone: form.phone, role: form.role, isActive: form.isActive });
        toast.success('Staff member updated');
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
        });
        toast.success('Staff member created');
      }
      navigate('/users');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/users" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">{isEdit ? 'Edit staff member' : 'Add staff member'}</h1>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full name" name="name" required value={form.name} onChange={handleChange} />
          <Input
            label="Email"
            type="email"
            name="email"
            required
            disabled={isEdit}
            value={form.email}
            onChange={handleChange}
          />
          <Input label="Phone" name="phone" required value={form.phone} onChange={handleChange} />
          {!isEdit && (
            <Input
              label="Password"
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
            />
          )}
          <Select label="Role" name="role" value={form.role} onChange={handleChange}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Account is active
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Link to="/users">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save changes' : 'Create staff member'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
