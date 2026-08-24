export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 skeleton-pulse">
      <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
      <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-20 bg-slate-100 rounded" />
    </div>
  );
}
