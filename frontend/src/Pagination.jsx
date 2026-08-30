import { IconChevronLeft, IconChevronRight } from "./icons.jsx";

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-slate-100">
      <button
        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        <IconChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-slate-600">
        Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages}</span>
      </span>
      <button
        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        <IconChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
