"use client";

import { Sun, CloudRain, Undo2 } from "lucide-react";
import Link from "next/link";
import { useWeatherMode } from "@/providers/weather-mode-provider";
import { useSchedule } from "@/providers/schedule-provider";
import { sampleSites } from "@/lib/data/sites";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { getWeatherEmoji, getWeatherLabel, formatDateFull } from "@/lib/utils";

export default function WeatherPage() {
  const { overrides, toggleRainOverride, clearOverrides, getEffectiveDays } = useWeatherMode();
  const { getAllAdoptedSchedules } = useSchedule();
  const days = getEffectiveDays();
  const adopted = getAllAdoptedSchedules();

  const workDays = days.filter((d) => d.canWork).length;
  const noWorkDays = days.filter((d) => !d.canWork).length;

  // Find affected processes for overridden days
  function getAffectedProcesses(date: string) {
    const results: string[] = [];
    adopted.forEach(({ siteId, plan }) => {
      const site = sampleSites.find((s) => s.id === siteId);
      plan.schedule.forEach((proc) => {
        if (proc.rainTolerance === "ng" && proc.scheduledStart <= date && proc.scheduledEnd >= date) {
          results.push(`${site?.name || siteId} / ${proc.name}`);
        }
      });
    });
    // Also check original site processes
    if (results.length === 0) {
      sampleSites.forEach((site) => {
        site.processes.forEach((proc) => {
          if (proc.rainTolerance === "ng" && proc.scheduledStart <= date && proc.scheduledEnd >= date) {
            results.push(`${site.name} / ${proc.name}`);
          }
        });
      });
    }
    return results;
  }

  return (
    <div>
      <PageHeader title="天気予報" description="大阪府高石市 ・ 日付クリックで雨シミュレーション">
        {overrides.length > 0 && (
          <Button variant="outline" onClick={clearOverrides} className="gap-2">
            <Undo2 size={18} /> オーバーライドをリセット
          </Button>
        )}
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-green-100 rounded-xl p-3"><Sun size={32} className="text-green-600" /></div>
            <div>
              <p className="text-base text-green-700">施工可能</p>
              <p className="text-4xl font-extrabold text-green-800">{workDays}<span className="text-xl font-semibold ml-1">日</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-red-100 rounded-xl p-3"><CloudRain size={32} className="text-red-600" /></div>
            <div>
              <p className="text-base text-red-700">施工不可</p>
              <p className="text-4xl font-extrabold text-red-800">{noWorkDays}<span className="text-xl font-semibold ml-1">日</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {overrides.length > 0 && (
        <Card className="mb-6 bg-purple-50 border-purple-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-purple-800">
                ✨ 雨シミュレーション中 — {overrides.length}日を雨に変更
              </p>
              <p className="text-sm text-purple-600 mt-1">変更を反映したスケジュールへの影響を確認できます</p>
            </div>
            <Link href="/simulation">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                この天気で再シミュレーション →
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Day grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {days.map((day) => {
          const isOverridden = overrides.some((o) => o.date === day.date);
          const affected = !day.canWork ? getAffectedProcesses(day.date) : [];

          return (
            <Card
              key={day.date}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isOverridden
                  ? "border-2 border-purple-400 bg-purple-50/50 ring-2 ring-purple-200"
                  : !day.canWork
                    ? "border-2 border-red-300 bg-red-50/50"
                    : "border border-gray-200 hover:border-blue-200"
              }`}
              onClick={() => toggleRainOverride(day.date)}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                {isOverridden && (
                  <Badge className="bg-purple-100 text-purple-700 text-sm mb-2">✨ 雨に変更中</Badge>
                )}
                <p className="text-base font-bold text-gray-700 mb-3">{formatDateFull(day.date)}</p>
                <div className="text-4xl sm:text-6xl mb-3">{getWeatherEmoji(day.weather)}</div>
                <p className="text-lg font-semibold text-gray-900 mb-3">{getWeatherLabel(day.weather)}</p>

                <div className="space-y-2 text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-400">気温</span>
                    <span className="font-semibold"><span className="text-red-500">{day.tempMax}°</span> / <span className="text-blue-500">{day.tempMin}°</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">湿度</span>
                    <span className="font-semibold">{day.humidity}%</span>
                  </div>
                </div>

                <div className="mt-4">
                  {day.canWork ? (
                    <Badge className="bg-green-100 text-green-700 text-base px-4 py-1.5">施工可能</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 text-base px-4 py-1.5">施工不可</Badge>
                  )}
                </div>

                {affected.length > 0 && (
                  <div className="mt-3 text-left space-y-1">
                    <p className="text-sm font-semibold text-red-600">影響を受ける工程:</p>
                    {affected.slice(0, 3).map((a, i) => (
                      <p key={i} className="text-sm text-red-500 truncate">{a}</p>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-400 mt-3">
                  {isOverridden ? "クリックで元に戻す" : day.canWork ? "クリックで雨に変更" : ""}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
