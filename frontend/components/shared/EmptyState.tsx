import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  onClear?: () => void;
}

export default function EmptyState({
  title = "No results found",
  message = "No works match your current filters.",
  onClear,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <SearchX size={22} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{message}</p>
      {onClear && (
        <button
          onClick={onClear}
          className="mt-4 px-4 py-2 text-sm font-medium text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
