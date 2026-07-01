import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { getVisitorById, createVisitor, updateVisitor } from '../../api/visitors';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import FileInput from '../../components/ui/FileInput';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { getErrorMessage } from '../../utils/format';

const EMPTY_FORM = { fullName: '', email: '', phone: '', company: '', address: '' };
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function VisitorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [governmentId, setGovernmentId] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await getVisitorById(id);
        const visitor = res.data.data.visitor;
        setExisting(visitor);
        setForm({
          fullName: visitor.fullName,
          email: visitor.email,
          phone: visitor.phone,
          company: visitor.company || '',
          address: visitor.address || '',
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const selectFile = (setter, { allowPdf = false } = {}) => (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setter(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      event.target.value = '';
      setter(null);
      toast.error('Files must be smaller than 4 MB for Vercel uploads');
      return;
    }

    const allowedTypes = allowPdf ? ALLOWED_FILE_TYPES : ALLOWED_FILE_TYPES.slice(0, 3);
    if (!allowedTypes.includes(file.type)) {
      event.target.value = '';
      setter(null);
      toast.error(allowPdf ? 'Use JPG, PNG, WebP, or PDF' : 'Use a JPG, PNG, or WebP image');
      return;
    }

    setter(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((photo?.size || 0) + (governmentId?.size || 0) > MAX_FILE_SIZE) {
      toast.error('The photo and government ID must be smaller than 4 MB combined');
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (photo) data.append('photo', photo);
      if (governmentId) data.append('governmentId', governmentId);

      if (isEdit) {
        await updateVisitor(id, data);
        toast.success('Visitor updated');
      } else {
        await createVisitor(data);
        toast.success('Visitor created');
      }
      navigate('/visitors');
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
        <Link to="/visitors" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">{isEdit ? 'Edit visitor' : 'Add visitor'}</h1>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" name="fullName" required value={form.fullName} onChange={handleChange} />
            <Input label="Email" type="email" name="email" required value={form.email} onChange={handleChange} />
            <Input label="Phone" name="phone" required value={form.phone} onChange={handleChange} />
            <Input label="Company" name="company" value={form.company} onChange={handleChange} />
          </div>
          <Textarea label="Address" name="address" rows={2} value={form.address} onChange={handleChange} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FileInput
              label="Photo"
              name="photo"
              accept="image/*"
              onChange={selectFile(setPhoto)}
              currentUrl={existing?.photo}
              hint={photo ? `${photo.name} selected` : 'JPG, PNG, or WebP; maximum 4 MB'}
            />
            <FileInput
              label="Government ID"
              name="governmentId"
              accept="image/*,.pdf"
              onChange={selectFile(setGovernmentId, { allowPdf: true })}
              currentUrl={existing?.governmentId}
              hint={governmentId ? `${governmentId.name} selected` : 'JPG, PNG, WebP, or PDF; maximum 4 MB'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link to="/visitors">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save changes' : 'Create visitor'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
