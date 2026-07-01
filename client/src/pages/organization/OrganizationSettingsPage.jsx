import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';
import { getMyOrganization, updateMyOrganization } from '../../api/organizations';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import FileInput from '../../components/ui/FileInput';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDate, getErrorMessage } from '../../utils/format';

const PLANS = ['free', 'basic', 'pro', 'enterprise'];

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [organization, setOrganization] = useState(null);
  const [form, setForm] = useState({ organizationName: '', address: '', subscriptionPlan: 'free' });
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyOrganization();
        const org = res.data.data.organization;
        setOrganization(org);
        setForm({
          organizationName: org.organizationName || '',
          address: org.address || '',
          subscriptionPlan: org.subscriptionPlan || 'free',
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (logo) data.append('logo', logo);

      const res = await updateMyOrganization(data);
      setOrganization(res.data.data.organization);
      toast.success('Organization updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (!organization) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Organization</h1>
        <p className="text-sm text-slate-500">
          {isAdmin ? 'Manage your organization profile and subscription.' : 'View your organization details.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          {organization.logo ? (
            <img src={organization.logo} alt="" className="h-24 w-24 rounded-lg object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
              <Building2 className="h-10 w-10" />
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-slate-900">{organization.organizationName}</p>
            <p className="text-sm capitalize text-slate-500">{organization.subscriptionPlan} plan</p>
          </div>
          <p className="text-xs text-slate-400">Created {formatDate(organization.createdAt)}</p>
        </Card>

        <Card title={isAdmin ? 'Edit details' : 'Details'} className="lg:col-span-2">
          {isAdmin ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Organization name"
                name="organizationName"
                required
                value={form.organizationName}
                onChange={handleChange}
              />
              <Textarea label="Address" name="address" rows={2} value={form.address} onChange={handleChange} />
              <Select
                label="Subscription plan"
                name="subscriptionPlan"
                value={form.subscriptionPlan}
                onChange={handleChange}
              >
                {PLANS.map((plan) => (
                  <option key={plan} value={plan} className="capitalize">
                    {plan}
                  </option>
                ))}
              </Select>
              <FileInput
                label="Logo"
                name="logo"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0])}
                currentUrl={organization.logo}
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Organization name" value={organization.organizationName} />
              <Field label="Subscription plan" value={organization.subscriptionPlan} className="capitalize" />
              <Field label="Address" value={organization.address || '-'} />
              <Field label="Created on" value={formatDate(organization.createdAt)} />
            </dl>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, className = '' }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`text-sm font-medium text-slate-800 ${className}`}>{value}</dd>
    </div>
  );
}
