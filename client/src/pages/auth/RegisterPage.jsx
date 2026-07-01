import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/format';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee',
    organizationName: '',
    organizationId: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        ...(mode === 'create'
          ? { organizationName: form.organizationName }
          : { organizationId: form.organizationId, role: form.role }),
      };
      await register(payload);
      toast.success('Account created!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Create your account</h2>
      <p className="mb-5 text-sm text-slate-500">
        Set up a new organization or join an existing one as staff.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`rounded-md py-1.5 transition-colors ${
            mode === 'create' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          New organization
        </button>
        <button
          type="button"
          onClick={() => setMode('join')}
          className={`rounded-md py-1.5 transition-colors ${
            mode === 'join' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Join organization
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full name" name="name" required value={form.name} onChange={handleChange} />
        <Input label="Email" type="email" name="email" required value={form.email} onChange={handleChange} />
        <Input label="Phone" name="phone" required value={form.phone} onChange={handleChange} />
        <Input
          label="Password"
          type="password"
          name="password"
          required
          minLength={6}
          value={form.password}
          onChange={handleChange}
        />

        {mode === 'create' ? (
          <Input
            label="Organization name"
            name="organizationName"
            required
            value={form.organizationName}
            onChange={handleChange}
            placeholder="Acme Corp"
          />
        ) : (
          <>
            <Input
              label="Organization ID"
              name="organizationId"
              required
              value={form.organizationId}
              onChange={handleChange}
              placeholder="Provided by your admin"
            />
            <Select label="Role" name="role" value={form.role} onChange={handleChange}>
              <option value="employee">Employee</option>
              <option value="security">Security</option>
              <option value="admin">Admin</option>
            </Select>
          </>
        )}

        <Button type="submit" loading={loading} className="w-full">
          {mode === 'create' ? 'Create organization' : 'Join organization'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
