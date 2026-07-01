import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-bold text-primary-500">404</p>
      <h1 className="text-xl font-semibold text-slate-800">Page not found</h1>
      <p className="text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
}
