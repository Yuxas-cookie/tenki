import { AIOptimizationResult, SiteProcess, ScheduleProposal } from "@/lib/types";
import { getDaysBetween } from "@/lib/utils";

export function extractJSON(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return m[1].trim();
  const j = text.match(/\{[\s\S]*\}/);
  return j ? j[0] : text;
}

export function parseAIResponse(text: string, original: SiteProcess[]): AIOptimizationResult {
  const raw = JSON.parse(extractJSON(text));
  const optimized = original.map((proc) => {
    const ai = raw.optimizedSchedule?.find((i: { id: number }) => i.id === proc.id);
    if (ai?.aiModified) return { ...proc, scheduledStart: ai.scheduledStart, scheduledEnd: ai.scheduledEnd, aiModified: true, aiReason: ai.aiReason || "" };
    return { ...proc, aiModified: false };
  });
  return { originalSchedule: original, optimizedSchedule: optimized, summary: raw.summary || "", reasoning: raw.reasoning || "", impactDays: raw.impactDays || 0, impactCost: raw.impactCost || 0, riskLevel: raw.riskLevel || "medium", suggestions: raw.suggestions || [] };
}

function shiftProcesses(original: SiteProcess[], shiftDays: number, fromId: number): SiteProcess[] {
  return original.map((p) => {
    if (p.id >= fromId) {
      const s = new Date(p.scheduledStart);
      const e = new Date(p.scheduledEnd);
      s.setDate(s.getDate() + shiftDays);
      e.setDate(e.getDate() + shiftDays);
      return {
        ...p,
        scheduledStart: s.toISOString().split("T")[0],
        scheduledEnd: e.toISOString().split("T")[0],
        aiModified: true,
        aiReason: `工程を${shiftDays}日後にずらしました`,
      };
    }
    return { ...p, aiModified: false };
  });
}

function calcTotalDays(procs: SiteProcess[]): number {
  const first = procs[0]?.scheduledStart;
  const last = procs[procs.length - 1]?.scheduledEnd;
  return first && last ? getDaysBetween(first, last) : 0;
}

export function generateMockProposals(original: SiteProcess[]): ScheduleProposal[] {
  const originalDays = calcTotalDays(original);

  // Plan A: 最速 — 雨天リスク承知で1日だけずらす
  const fastSchedule = shiftProcesses(original, 1, 7);
  const fastDays = calcTotalDays(fastSchedule);

  // Plan B: バランス — 雨回避で3日ずらす
  const balancedSchedule = shiftProcesses(original, 3, 7);
  const balancedDays = calcTotalDays(balancedSchedule);

  // Plan C: 安全 — 全雨天日回避+バッファ2日で5日ずらす
  const safeSchedule = shiftProcesses(original, 5, 7);
  const safeDays = calcTotalDays(safeSchedule);

  return [
    {
      id: "plan-a",
      name: "最速プラン",
      type: "fastest",
      schedule: fastSchedule,
      totalDays: fastDays,
      impactDays: fastDays - originalDays,
      impactCost: 2,
      riskLevel: "high",
      summary: "雨天リスクを一部許容し、最小限の遅延（+1日）で工期を短縮します。小雨なら施工を継続し、本降りの場合のみ中断します。",
      suggestions: [
        { processId: 7, type: "move", description: "下塗りを1日だけ後ろにずらす", reason: "雨ピーク直前を回避" },
        { processId: 10, type: "parallel", description: "付帯部塗装を上塗りと同時並行", reason: "工期短縮のため" },
      ],
    },
    {
      id: "plan-b",
      name: "バランスプラン",
      type: "balanced",
      schedule: balancedSchedule,
      totalDays: balancedDays,
      impactDays: balancedDays - originalDays,
      impactCost: 5,
      riskLevel: "medium",
      summary: "雨天期間を完全に回避しつつ、工期延長を+3日に抑えます。品質と工期のバランスが最適なプランです。",
      suggestions: [
        { processId: 7, type: "move", description: "下塗りを3日後に移動", reason: "雨予報期間を完全回避" },
        { processId: 8, type: "move", description: "中塗りを3日後に移動", reason: "下塗り乾燥待ち+雨天回避" },
        { processId: 9, type: "move", description: "上塗りを3日後に移動", reason: "中塗り乾燥待ち+雨天回避" },
        { processId: 10, type: "parallel", description: "付帯部塗装を上塗りと並行", reason: "工期短縮のため" },
      ],
    },
    {
      id: "plan-c",
      name: "安全プラン",
      type: "safe",
      schedule: safeSchedule,
      totalDays: safeDays,
      impactDays: safeDays - originalDays,
      impactCost: 8,
      riskLevel: "low",
      summary: "全ての雨天日を回避し、さらにバッファ日を設けた最も安全なプランです。天候リスクゼロで品質を最優先します。",
      suggestions: [
        { processId: 7, type: "move", description: "下塗りを5日後に移動", reason: "全雨天日+バッファ2日を確保" },
        { processId: 8, type: "move", description: "中塗りを5日後に移動", reason: "十分な乾燥時間を確保" },
        { processId: 9, type: "move", description: "上塗りを5日後に移動", reason: "十分な乾燥時間を確保" },
      ],
    },
  ];
}

// Keep for backward compatibility
export function generateMockResult(original: SiteProcess[], mode: "optimize" | "reschedule"): AIOptimizationResult {
  const proposals = generateMockProposals(original);
  const p = proposals[1]; // balanced
  return {
    originalSchedule: original,
    optimizedSchedule: p.schedule,
    summary: p.summary,
    reasoning: "天気予報を分析した結果、工事開始5日目から3日間の降雨が予想されます。下塗り以降の工程を雨天明けに移動することで、塗膜品質を確保しつつ工期延長を最小限に抑えます。",
    impactDays: p.impactDays,
    impactCost: p.impactCost,
    riskLevel: p.riskLevel,
    suggestions: p.suggestions,
  };
}
