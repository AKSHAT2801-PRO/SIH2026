"use client"
import axios from "axios";

type MP = {
  _id?: string;
  mpName?: string;
  constituency?: string;
  state?: string;
  house?: string;
  allocatedAmount?: number | string;
  totalExpenditure?: number | string;
  utilizationPercentage?: number | string;
  completedWorks?: number | string;
  recommendedWorks?: number | string;
  completionRatePercentage?: number | string;
  unspentAmount?: number | string;
  transactionCount?: number | string;
  successfulPayments?: number | string;
  pendingPayments?: number | string;
  averageRating?: number | string | null;
};

function formatCurrency(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("en-IN") : "N/A";
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());

  return parts.join("").slice(0, 2) || "MP";
}

async function getMps(): Promise<MP[]> {
  try {
    const response = await axios.get("http://localhost:6005/mps?page=2&limit=10");
    const raw = response?.data;

    const items: MP[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.mps)
          ? raw.mps
          : Array.isArray(raw?.results)
            ? raw.results
            : [];

    return items.slice(0, 10);
  } catch (error) {
    console.error("Error fetching MPs:", error);
    return [];
  }
}

export default async function AllMps() {
  const mps = await getMps();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">All MPs</h2>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          {mps.length} MPs
        </span>
      </div>

      {mps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          No MPs found.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {mps.map((mp, index) => {
            const name = mp.mpName || `MP ${index + 1}`;
            const state = mp.state || "N/A";
            const house = mp.house || "N/A";
            const constituency = mp.constituency || "N/A";

            return (
              <div
                key={mp._id || `${name}-${index}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                    {getInitials(name)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                      {house}
                    </p>
                    <h3 className="truncate text-lg font-bold text-slate-900">{name}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 text-sm text-slate-700">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      State
                    </p>
                    <p className="mt-1 font-medium text-slate-800">{state}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Constituency
                    </p>
                    <p className="mt-1 font-medium text-slate-800">{constituency}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Allocated
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatCurrency(mp.allocatedAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Expenditure
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatCurrency(mp.totalExpenditure)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Utilization
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatNumber(mp.utilizationPercentage)}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Completion
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatNumber(mp.completionRatePercentage)}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Completed Works
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatNumber(mp.completedWorks)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Recommended
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatNumber(mp.recommendedWorks)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Unspent
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatCurrency(mp.unspentAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Transactions
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatNumber(mp.transactionCount)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Successful
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatNumber(mp.successfulPayments)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Pending
                    </p>
                    <p className="mt-1 font-medium text-slate-800">
                      {formatNumber(mp.pendingPayments)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}