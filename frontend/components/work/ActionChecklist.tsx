import { ActionItem } from "@/types";
import { CheckSquare } from "lucide-react";

interface ActionChecklistProps {
  actions: ActionItem[];
}

export default function ActionChecklist({ actions }: ActionChecklistProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Recommended Actions</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          AI-suggested next steps — authorized officer to confirm before acting
        </p>
      </div>

      <ul className="space-y-2.5" role="list">
        {actions.map((action, i) => (
          <li
            key={action.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-sky-200 hover:bg-sky-50/40 transition-colors"
          >
            <div className="shrink-0 w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center mt-0.5">
              <span className="text-sky-600 text-xs font-bold">{i + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 leading-snug">{action.text}</p>
            </div>
            <CheckSquare size={16} className="text-slate-300 shrink-0 mt-0.5" aria-hidden />
          </li>
        ))}
      </ul>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 italic leading-relaxed">
          AI recommendation ≠ final decision — for authorized review only. No administrative action
          should be taken based solely on this system&apos;s output.
        </p>
      </div>
    </div>
  );
}
