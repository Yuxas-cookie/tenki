"use client";

import { Badge } from "@/components/ui/badge";
import { SiteProcess } from "@/lib/types";
import { getStatusLabel, getStatusColor } from "@/lib/utils";

interface ProcessListProps {
  processes: SiteProcess[];
}

function getRainLabel(t: string) {
  if (t === "ok") return { label: "雨天OK", cls: "bg-green-100 text-green-700" };
  if (t === "partial") return { label: "小雨可", cls: "bg-amber-100 text-amber-700" };
  return { label: "雨天NG", cls: "bg-red-100 text-red-700" };
}

export function ProcessList({ processes }: ProcessListProps) {
  return (
    <div className="space-y-3">
      {processes.map((p) => {
        const rain = getRainLabel(p.rainTolerance);
        return (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold text-gray-600">
              {p.id}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">{p.name}</span>
                {p.aiModified && (
                  <span className="text-sm text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
                    ✨ AI変更
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {p.scheduledStart} 〜 {p.scheduledEnd}
                {p.dryingDays > 0 && (
                  <span className="text-blue-500 ml-2">+乾燥{p.dryingDays}日</span>
                )}
              </p>
              {p.aiReason && (
                <p className="text-sm text-purple-600 mt-1">{p.aiReason}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge className={`${rain.cls} text-sm`} variant="secondary">{rain.label}</Badge>
              <Badge className={`${getStatusColor(p.status)} text-sm`} variant="secondary">
                {getStatusLabel(p.status)}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
