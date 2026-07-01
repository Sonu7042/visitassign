import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <ShieldAlert className="h-12 w-12 text-red-400" />
      <h1 className="text-xl font-semibold text-slate-800">Access denied</h1>
      <p className="text-sm text-slate-500">You don't have permission to view this page.</p>
      <Link to="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
}
