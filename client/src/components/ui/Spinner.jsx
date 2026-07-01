import { Loader2 } from 'lucide-react';

export default function Spinner({ className = '', label = 'Loading...' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-10 text-slate-400 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
