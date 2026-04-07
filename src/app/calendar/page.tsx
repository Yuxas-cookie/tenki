"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWeatherMode } from "@/providers/weather-mode-provider";
import { useSchedule } from "@/providers/schedule-provider";
import { sampleSites } from "@/lib/data/sites";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { getWeatherEmoji } from "@/lib/utils";
import { WeatherDay } from "@/lib/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const SITE_COLORS = ["bg-blue-400", "bg-emerald-400", "bg-amber-400"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 3, 1)); // April 2026
  const { getEffectiveDays } = useWeatherMode();
  const { getAllAdoptedSchedules } = useSchedule();
  const days = getEffectiveDays();
  const adopted = getAllAdoptedSchedules();

  const weatherMap = useMemo(() => {
    const map = new Map<string, WeatherDay>();
    days.forEach((d) => map.set(d.date, d));
    return map;
  }, [days]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentMonth]);

  // Get processes for a specific date
  function getProcessesForDate(dateStr: string) {
    const results: { siteName: string; processName: string; color: string }[] = [];

    adopted.forEach(({ siteId, plan }) => {
      const siteIdx = sampleSites.findIndex((s) => s.id === siteId);
      const site = sampleSites[siteIdx];
      const color = SITE_COLORS[siteIdx % SITE_COLORS.length];

      plan.schedule.forEach((proc) => {
        if (proc.scheduledStart <= dateStr && proc.scheduledEnd >= dateStr) {
          results.push({ siteName: site?.name || siteId, processName: proc.name, color });
        }
      });
    });

    return results;
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  return (
    <div>
      <PageHeader title="カレンダー" description="登録済みスケジュールを一覧で確認" />

      {adopted.length === 0 && (
        <Card className="mb-8 bg-amber-50 border-amber-200">
          <CardContent className="p-6 text-center">
            <p className="text-lg text-amber-700">まだスケジュールが登録されていません。</p>
            <p className="text-base text-amber-600 mt-1">AIシミュレーションでプランを採用すると、ここに表示されます。</p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {adopted.length > 0 && (
        <div className="flex items-center flex-wrap gap-3 sm:gap-6 mb-6">
          {adopted.map(({ siteId }) => {
            const siteIdx = sampleSites.findIndex((s) => s.id === siteId);
            const site = sampleSites[siteIdx];
            const color = SITE_COLORS[siteIdx % SITE_COLORS.length];
            return (
              <div key={siteId} className="flex items-center gap-2">
                <span className={`h-4 w-4 rounded ${color}`} />
                <span className="text-base font-medium text-gray-700">{site?.name || siteId}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="lg" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
              <ChevronLeft size={20} />
            </Button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {year}年 {month + 1}月
            </h2>
            <Button variant="outline" size="lg" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {WEEKDAYS.map((wd, i) => (
              <div key={wd} className={`text-center text-base font-bold py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={idx} className="min-h-[70px] sm:min-h-[90px] lg:min-h-[100px]" />;

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const weather = weatherMap.get(dateStr);
              const procs = getProcessesForDate(dateStr);
              const dow = idx % 7;

              return (
                <div
                  key={idx}
                  className={`min-h-[70px] sm:min-h-[90px] lg:min-h-[100px] rounded-lg border p-2 transition-colors ${
                    weather && !weather.canWork ? "bg-red-50 border-red-200" : "bg-white border-gray-100 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm sm:text-base font-bold ${dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-700"}`}>
                      {day}
                    </span>
                    {weather && (
                      <span className="text-lg">{getWeatherEmoji(weather.weather)}</span>
                    )}
                  </div>
                  {weather && !weather.canWork && (
                    <Badge className="bg-red-100 text-red-600 text-[11px] mb-1">施工不可</Badge>
                  )}
                  <div className="space-y-0.5">
                    {procs.slice(0, 3).map((p, i) => (
                      <div key={i} className={`${p.color} text-white text-[11px] font-medium px-1.5 py-0.5 rounded truncate`}>
                        {p.processName}
                      </div>
                    ))}
                    {procs.length > 3 && (
                      <p className="text-[11px] text-gray-400">+{procs.length - 3}件</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
