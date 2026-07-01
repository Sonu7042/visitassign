import { Upload } from 'lucide-react';

export default function FileInput({ label, error, onChange, name, accept, currentUrl, hint }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600">
        <Upload className="h-4 w-4" />
        <span>Choose file</span>
        <input type="file" name={name} accept={accept} onChange={onChange} className="hidden" />
      </label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary-600 underline"
        >
          View current file
        </a>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
