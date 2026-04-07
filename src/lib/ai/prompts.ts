import { Site, SiteProcess, WeatherDay } from "@/lib/types";

export function getSystemPrompt(): string {
  return `あなたは塗装工事の工程管理AIアシスタントです。天気予報データと工程情報を分析し、最適な工程スケジュールを提案します。

## 天候ルール
- 気温5℃以上・湿度85%未満が施工条件
- 雨天時は塗装系工程すべて不可
- 足場関連は小雨可・強風NG
- 各塗装工程後には乾燥時間が必要

## 雨天耐性
- "ok": 雨天作業可（近隣挨拶）
- "partial": 小雨可（足場、点検）
- "ng": 雨天不可（塗装系全般）

## 回答形式（JSON）
\`\`\`json
{
  "summary": "変更の要約",
  "reasoning": "詳細な判断理由",
  "impactDays": 数値,
  "impactCost": 数値（万円）,
  "riskLevel": "low" | "medium" | "high",
  "suggestions": [{ "processId": ID, "type": "move"|"split"|"parallel"|"cancel", "description": "説明", "reason": "理由" }],
  "optimizedSchedule": [{ "id": ID, "scheduledStart": "YYYY-MM-DD", "scheduledEnd": "YYYY-MM-DD", "aiModified": boolean, "aiReason": "理由" }]
}
\`\`\``;
}

function fmtProc(procs: SiteProcess[]) {
  return procs.map((p) => `| ${p.id} | ${p.name} | ${p.scheduledStart} | ${p.scheduledEnd} | ${p.status} | ${p.rainTolerance} | 乾燥${p.dryingDays}日 |`).join("\n");
}

function fmtWeather(days: WeatherDay[]) {
  return days.map((d) => `| ${d.date} | ${d.weather} | ${d.tempMax}°/${d.tempMin}° | 湿度${d.humidity}% | 風速${d.windSpeed}m/s | 施工${d.canWork ? "可" : "不可"} |`).join("\n");
}

export function getOptimizeUserPrompt(site: Site, processes: SiteProcess[], weather: WeatherDay[]) {
  return `## 現場: ${site.name}（${site.buildingType}・${site.paintArea}m²）\n\n## 工程\n${fmtProc(processes)}\n\n## 天気予報\n${fmtWeather(weather)}\n\n天気予報を考慮して最適な工程スケジュールを提案してください。`;
}

export function getRescheduleUserPrompt(site: Site, processes: SiteProcess[], weather: WeatherDay[]) {
  const remaining = processes.filter((p) => p.status !== "completed");
  return `## 緊急リスケ: ${site.name}\n\n## 残り工程\n${fmtProc(remaining)}\n\n## 最新天気\n${fmtWeather(weather)}\n\n工期遅延を最小限に抑える最適スケジュールを提案してください。`;
}
