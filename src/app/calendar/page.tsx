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
const SITE_COLORS = ["bg-blue-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400", "bg-rose-400"];

export default function CalendarPage() {
  const { getEffectiveDays } = useWeatherMode();
  const { getAllAdoptedSchedules } = useSchedule();
  const days = getEffectiveDays();
  const adopted = getAllAdoptedSchedules();

  // Auto-detect the right month from adopted schedules
  const initialMonth = useMemo(() => {
    if (adopted.length > 0) {
      const firstDate = adopted[0].plan.schedule[0]?.scheduledStart;
      if (firstDate) {
        const d = new Date(firstDate);
        return new Date(d.getFullYear(), d.getMonth(), 1);
      }
    }
    return new Date(2026, 3, 1); // fallback April 2026
  }, [adopted]);

  const [currentMonth, setCurrentMonth] = useState(() => initialMonth);

  const weatherMap = useMemo(() => {
    const map = new Map<string, WeatherDay>();
    days.forEach((d) => map.set(d.date, d));
    return map;
  }, [days]);

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

  function getSiteName(siteId: string) {
    const site = sampleSites.find((s) => s.id === siteId);
    return site?.name || siteId.replace("custom-site", "新規現場");
  }

  function getSiteColor(siteId: string) {
    const idx = sampleSites.findIndex((s) => s.id === siteId);
    if (idx >= 0) return SITE_COLORS[idx % SITE_COLORS.length];
    // For custom sites, use a hash-based color
    const hash = siteId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return SITE_COLORS[hash % SITE_COLORS.length];
  }

  function getProcessesForDate(dateStr: string) {
    const results: { siteName: string; processName: string; color: string }[] = [];
    adopted.forEach(({ siteId, plan }) => {
      const color = getSiteColor(siteId);
      const name = getSiteName(siteId);
      plan.schedule.forEach((proc) => {
        if (proc.scheduledStart <= dateStr && proc.scheduledEnd >= dateStr) {
          results.push({ siteName: name, processName: proc.name, color });
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
            <p className="text-base text-amber-700">まだスケジュールが登録されていません。</p>
            <p className="text-sm text-amber-600 mt-1">ダッシュボードでプランを採用すると、ここに表示されます。</p>
          </CardContent>
        </Card>
      )}

      {adopted.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6">
          {adopted.map(({ siteId }) => (
            <div key={siteId} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded ${getSiteColor(siteId)}`} />
              <span className="text-sm font-medium text-gray-700">{getSiteName(siteId)}</span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-3 sm:p-4 lg:p-6">
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

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {WEEKDAYS.map((wd, i) => (
              <div key={wd} className={`text-center text-sm sm:text-base font-bold py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={idx} className="min-h-[70px] sm:min-h-[90px] lg:min-h-[100px]" />;

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const weather = weatherMap.get(dateStr);
              const procs = getProcessesForDate(dateStr);
              const dow = idx % 7;

              return (
                <div key={idx}
                  className={`min-h-[70px] sm:min-h-[90px] lg:min-h-[100px] rounded-lg border p-1.5 sm:p-2 transition-colors ${
                    weather && !weather.canWork ? "bg-red-50 border-red-200" : "bg-white border-gray-100 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm sm:text-base font-bold ${dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-700"}`}>
                      {day}
                    </span>
                    {weather && <span className="text-base sm:text-lg">{getWeatherEmoji(weather.weather)}</span>}
                  </div>
                  {weather && !weather.canWork && (
                    <Badge className="bg-red-100 text-red-600 text-[10px] mb-1">施工不可</Badge>
                  )}
                  <div className="space-y-0.5">
                    {procs.slice(0, 3).map((p, i) => (
                      <div key={i} className={`${p.color} text-white text-[10px] sm:text-[11px] font-medium px-1 py-0.5 rounded truncate`}>
                        {p.processName}
                      </div>
                    ))}
                    {procs.length > 3 && (
                      <p className="text-[10px] text-gray-400">+{procs.length - 3}件</p>
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
