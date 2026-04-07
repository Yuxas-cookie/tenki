"use client";

import { useState } from "react";
import { Sparkles, Zap, Scale, Shield, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useWeatherMode } from "@/providers/weather-mode-provider";
import { useSchedule } from "@/providers/schedule-provider";
import { useAISimulation } from "@/hooks/use-ai-simulation";
import { sampleSites } from "@/lib/data/sites";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { GanttChart } from "@/components/sites/gantt-chart";
import { Site, ScheduleProposal, SimulationMode, WeatherDay } from "@/lib/types";
import { getBuildingTypeIcon, getProgressPercentage } from "@/lib/utils";

const planIcons = { fastest: Zap, balanced: Scale, safe: Shield };
const planColors = {
  fastest: { bg: "bg-red-50", border: "border-red-200", accent: "text-red-600", badge: "bg-red-100 text-red-700" },
  balanced: { bg: "bg-blue-50", border: "border-blue-200", accent: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
  safe: { bg: "bg-green-50", border: "border-green-200", accent: "text-green-600", badge: "bg-green-100 text-green-700" },
};
const riskLabels = { low: "低リスク", medium: "中リスク", high: "高リスク" };

export default function SimulationPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [adoptedId, setAdoptedId] = useState<string | null>(null);
  const { getEffectiveDays } = useWeatherMode();
  const { adoptPlan } = useSchedule();
  const sim = useAISimulation();
  const days = getEffectiveDays();

  const handleRun = (mode: SimulationMode) => {
    if (!selectedSite) return;
    sim.reset(); setAdoptedId(null); setExpandedPlan(null);
    sim.run(selectedSite, days, mode);
  };

  const handleAdopt = (proposal: ScheduleProposal) => {
    if (!selectedSite || !sim.proposals) return;
    adoptPlan(selectedSite.id, proposal, sim.proposals);
    setAdoptedId(proposal.id);
  };

  return (
    <div>
      <PageHeader title="AIシミュレーション" description="AIが3つのスケジュールプランを提案します" />

      {/* Site selection */}
      {!selectedSite && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">現場を選択してください</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleSites.map((site) => (
              <Card key={site.id} className="cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all" onClick={() => setSelectedSite(site)}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{getBuildingTypeIcon(site.buildingType)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{site.name}</h3>
                      <p className="text-base text-gray-500">{site.address}</p>
                    </div>
                  </div>
                  <p className="text-base text-gray-500">{site.paintArea}m² ・ 進捗 {getProgressPercentage(site.processes)}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Simulation */}
      {selectedSite && (
        <div>
          <Card className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="p-4 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{getBuildingTypeIcon(selectedSite.buildingType)}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedSite.name}</h2>
                  <p className="text-purple-100">{selectedSite.address} | {selectedSite.paintArea}m²</p>
                </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto text-white border-white/40 hover:bg-white/20" onClick={() => { setSelectedSite(null); sim.reset(); setAdoptedId(null); }}>
                別の現場を選ぶ
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="optimize">
            <TabsList className="mb-6">
              <TabsTrigger value="optimize" className="text-base px-6 py-2.5">事前シミュレーション</TabsTrigger>
              <TabsTrigger value="reschedule" className="text-base px-6 py-2.5">緊急リスケ</TabsTrigger>
            </TabsList>
            <TabsContent value="optimize">
              <SimContent sim={sim} days={days} onRun={() => handleRun("optimize")} expandedPlan={expandedPlan} setExpandedPlan={setExpandedPlan} adoptedId={adoptedId} onAdopt={handleAdopt} />
            </TabsContent>
            <TabsContent value="reschedule">
              <SimContent sim={sim} days={days} onRun={() => handleRun("reschedule")} expandedPlan={expandedPlan} setExpandedPlan={setExpandedPlan} adoptedId={adoptedId} onAdopt={handleAdopt} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function SimContent({ sim, days, onRun, expandedPlan, setExpandedPlan, adoptedId, onAdopt }: {
  sim: ReturnType<typeof useAISimulation>;
  days: WeatherDay[];
  onRun: () => void;
  expandedPlan: string | null;
  setExpandedPlan: (id: string | null) => void;
  adoptedId: string | null;
  onAdopt: (p: ScheduleProposal) => void;
}) {
  return (
    <div className="space-y-8">
      {sim.state === "idle" && (
        <Card className="border-2 border-dashed border-purple-200 bg-purple-50/30">
          <CardContent className="p-10 text-center">
            <Sparkles size={48} className="text-purple-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-6">AIが天気予報を分析し、3つの工程プランを提案します</p>
            <Button onClick={onRun} size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-3 text-lg px-10 py-7 rounded-xl shadow-xl">
              <Sparkles size={24} /> AI最適化を実行
            </Button>
          </CardContent>
        </Card>
      )}

      {sim.state === "thinking" && (
        <Card className="border-2 border-purple-200">
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-4xl text-white mb-6 animate-pulse shadow-xl shadow-purple-200/50">✨</div>
            <p className="text-2xl font-bold text-gray-700">{sim.statusMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* reasoning removed in v4 - progress bar in hook instead */}

      {/* 3 Proposals */}
      {sim.state === "complete" && sim.proposals && (
        <div className="space-y-6">
          {adoptedId && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-5 flex items-center gap-3">
                <Check size={24} className="text-green-600" />
                <p className="text-lg font-bold text-green-800">プランをカレンダーに登録しました！</p>
                <span className="text-base text-green-600">（不採用プランは代替ストックに保存済み）</span>
              </CardContent>
            </Card>
          )}

          <h3 className="text-2xl font-bold text-gray-900">3つのプラン提案</h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sim.proposals.map((proposal) => {
              const colors = planColors[proposal.type];
              const Icon = planIcons[proposal.type];
              const isAdopted = adoptedId === proposal.id;
              const isExpanded = expandedPlan === proposal.id;

              return (
                <div key={proposal.id} className="space-y-3">
                  <Card className={`${isAdopted ? "ring-2 ring-green-500" : ""} ${colors.border} border-2 transition-all`}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`${colors.bg} rounded-xl p-2.5`}>
                          <Icon size={28} className={colors.accent} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{proposal.name}</h4>
                          <Badge className={`${colors.badge} text-sm mt-1`}>
                            {riskLabels[proposal.riskLevel]}
                          </Badge>
                        </div>
                        {isAdopted && (
                          <Badge className="bg-green-500 text-white ml-auto text-sm px-3 py-1">
                            <Check size={14} className="mr-1" /> 採用済み
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="text-sm text-gray-400">工期</p>
                          <p className="text-2xl font-extrabold text-gray-900">{proposal.totalDays}<span className="text-base">日</span></p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="text-sm text-gray-400">遅延</p>
                          <p className="text-2xl font-extrabold text-gray-900">+{proposal.impactDays}<span className="text-base">日</span></p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="text-sm text-gray-400">コスト</p>
                          <p className="text-2xl font-extrabold text-gray-900">{proposal.impactCost}<span className="text-base">万円</span></p>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-base text-gray-600 mb-4 leading-relaxed">{proposal.summary}</p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!isAdopted && (
                          <Button onClick={() => onAdopt(proposal)} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2">
                            <Check size={18} /> このプランを採用
                          </Button>
                        )}
                        <Button variant="outline" className="gap-1" onClick={() => setExpandedPlan(isExpanded ? null : proposal.id)}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          詳細
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <Card>
                      <CardContent className="p-4">
                        <GanttChart processes={proposal.schedule} weatherDays={days} compact />
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl" onClick={() => { sim.reset(); setExpandedPlan(null); }}>
              もう一度実行する
            </Button>
          </div>
        </div>
      )}

      {sim.state === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-base text-red-600 font-medium">エラー: {sim.error}</p>
            <Button variant="outline" className="mt-4" onClick={sim.reset}>リトライ</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
