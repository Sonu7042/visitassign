import { STATUS_BADGE_COLORS } from '../../utils/constants';

export default function Badge({ children, status, className = '' }) {
  const color = STATUS_BADGE_COLORS[status] ?? 'bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${color} ${className}`}
    >
      {children ?? status}
    </span>
  );
}
