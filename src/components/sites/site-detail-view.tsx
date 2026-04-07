"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Check, ArrowRightLeft } from "lucide-react";
import { useWeatherMode } from "@/providers/weather-mode-provider";
import { useSchedule } from "@/providers/schedule-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Site } from "@/lib/types";
import { GanttChart } from "./gantt-chart";
import { ProcessList } from "./process-list";
import {
  getBuildingTypeIcon,
  getBuildingTypeLabel,
  getStatusLabel,
  getStatusColor,
  formatDateFull,
  getDaysBetween,
} from "@/lib/utils";

interface SiteDetailViewProps {
  site: Site;
}

export function SiteDetailView({ site }: SiteDetailViewProps) {
  const { getEffectiveDays } = useWeatherMode();
  const { getAdoptedSchedule, getAlternatives, switchPlan } = useSchedule();
  const days = getEffectiveDays();

  const adopted = getAdoptedSchedule(site.id);
  const alternatives = getAlternatives(site.id);
  const displayProcesses = adopted ? adopted.schedule : site.processes;

  const firstStart = displayProcesses[0]?.scheduledStart;
  const lastEnd = displayProcesses[displayProcesses.length - 1]?.scheduledEnd;
  const totalDays = firstStart && lastEnd ? getDaysBetween(firstStart, lastEnd) : 0;
  const weatherImpact = days.filter(
    (d) => !d.canWork && firstStart && lastEnd && d.date >= firstStart && d.date <= lastEnd
  ).length;

  return (
    <div>
      <Link href="/sites" className="inline-flex items-center gap-2 text-base text-gray-500 hover:text-blue-600 transition-colors mb-6">
        <ArrowLeft size={20} /> 現場一覧に戻る
      </Link>

      {/* Property header */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <span className="text-4xl sm:text-6xl">{getBuildingTypeIcon(site.buildingType)}</span>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white">{site.name}</h1>
                <p className="text-lg text-blue-100 mt-1">{site.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {adopted && (
                <Badge className="bg-purple-100 text-purple-700 text-base px-4 py-2">
                  ✨ {adopted.name} 採用中
                </Badge>
              )}
              <Badge className={`${getStatusColor(site.status)} text-base px-4 py-2`} variant="secondary">
                {getStatusLabel(site.status)}
              </Badge>
            </div>
          </div>
        </div>
        <CardContent className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            <InfoItem label="施主" value={site.ownerName} />
            <InfoItem label="建物種別" value={getBuildingTypeLabel(site.buildingType)} />
            <InfoItem label="塗装面積" value={`${site.paintArea}m²`} />
            <InfoItem label="予定工期" value={`${totalDays}日間`} />
            <InfoItem label="天候影響" value={`${weatherImpact}日`} valueColor={weatherImpact > 0 ? "text-red-600" : "text-green-600"} />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <Tabs defaultValue="gantt">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">工程スケジュール</h2>
              <TabsList>
                <TabsTrigger value="gantt" className="text-sm sm:text-base px-3 sm:px-6 py-2">ガントチャート</TabsTrigger>
                <TabsTrigger value="list" className="text-sm sm:text-base px-3 sm:px-6 py-2">工程リスト</TabsTrigger>
                {alternatives.length > 0 && (
                  <TabsTrigger value="alternatives" className="text-sm sm:text-base px-3 sm:px-6 py-2">
                    代替プラン ({alternatives.length})
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <TabsContent value="gantt">
              <GanttChart processes={displayProcesses} weatherDays={days} />
            </TabsContent>
            <TabsContent value="list">
              <ProcessList processes={displayProcesses} />
            </TabsContent>
            {alternatives.length > 0 && (
              <TabsContent value="alternatives">
                <div className="space-y-4">
                  <p className="text-base text-gray-500">AIが提案した代替プランです。ワンクリックで切り替えできます。</p>
                  {alternatives.map((alt) => (
                    <Card key={alt.id} className="border-2 hover:border-purple-200 transition-all">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{alt.name}</h4>
                              <Badge className={
                                alt.riskLevel === "low" ? "bg-green-100 text-green-700" :
                                alt.riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }>{alt.riskLevel === "low" ? "低リスク" : alt.riskLevel === "medium" ? "中リスク" : "高リスク"}</Badge>
                            </div>
                            <p className="text-base text-gray-600 mb-2">{alt.summary}</p>
                            <div className="flex gap-6 text-base">
                              <span className="text-gray-500">工期: <strong className="text-gray-900">{alt.totalDays}日</strong></span>
                              <span className="text-gray-500">遅延: <strong className="text-gray-900">+{alt.impactDays}日</strong></span>
                              <span className="text-gray-500">コスト: <strong className="text-gray-900">{alt.impactCost}万円</strong></span>
                            </div>
                          </div>
                          <Button onClick={() => switchPlan(site.id, alt.id)} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2 shrink-0 mt-4 sm:mt-0 sm:ml-6">
                            <ArrowRightLeft size={18} /> このプランに切替
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-center py-4">
        <Link href="/simulation">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl gap-3 text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 rounded-xl">
            <Sparkles size={24} /> AIスケジュール最適化を実行
          </Button>
        </Link>
      </div>
    </div>
  );
}

function InfoItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueColor || "text-gray-900"}`}>{value}</p>
    </div>
  );
}
