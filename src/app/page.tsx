"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Scale,
  Shield,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  CalendarDays,
  Ruler,
  Building2,
  Layers,
  Clock,
  Wallet,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Settings2,
  CloudRain,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useWeatherMode } from "@/providers/weather-mode-provider";
import { useSchedule } from "@/providers/schedule-provider";
import { useAISimulation } from "@/hooks/use-ai-simulation";
import { sampleSites } from "@/lib/data/sites";
import { processMasters } from "@/lib/data/processes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GanttChart } from "@/components/sites/gantt-chart";
import {
  Site,
  SiteProcess,
  ScheduleProposal,
  BuildingType,
} from "@/lib/types";
import {
  getBuildingTypeIcon,
  addBusinessDays,
  getWeatherEmoji,
  formatDateFull,
} from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━
// Constants
// ━━━━━━━━━━━━━━━━━━━━
const planMeta = {
  fastest: { icon: Zap, color: "from-orange-500 to-red-500", border: "border-orange-200", bg: "bg-orange-50" },
  balanced: { icon: Scale, color: "from-blue-500 to-indigo-500", border: "border-blue-200", bg: "bg-blue-50" },
  safe: { icon: Shield, color: "from-emerald-500 to-green-500", border: "border-emerald-200", bg: "bg-emerald-50" },
};
const riskMap = { low: { label: "低", cls: "bg-green-100 text-green-700" }, medium: { label: "中", cls: "bg-amber-100 text-amber-700" }, high: { label: "高", cls: "bg-red-100 text-red-700" } };

const pageTransition = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -24 }, transition: { duration: 0.35, ease: "easeInOut" as const } };

// 工事タイプ → 自動選択される工程ID
const WORK_TYPES = [
  { id: "exterior", icon: "🏠", label: "外壁塗装", desc: "外壁の塗り替え工事（フルコース）", processIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: "exterior-simple", icon: "🖌️", label: "外壁塗装（簡易）", desc: "下地処理済みの塗り替えのみ", processIds: [1, 2, 6, 7, 8, 9, 11, 12] },
  { id: "roof", icon: "🏗️", label: "屋根リフォーム", desc: "屋根の補修・葺き替え工事", processIds: [1, 2, 3, 4, 7, 8, 9, 11, 12] },
  { id: "waterproof", icon: "💧", label: "防水工事", desc: "ベランダ・屋上の防水工事", processIds: [1, 2, 3, 4, 5, 6, 11, 12] },
  { id: "sealing", icon: "🔧", label: "シーリング工事", desc: "目地・サッシ周りのシーリング打替", processIds: [1, 2, 4, 5, 11, 12] },
  { id: "interior", icon: "🎨", label: "内装塗装", desc: "室内の壁・天井の塗装", processIds: [1, 6, 7, 8, 9, 11] },
] as const;

function buildProcesses(startDate: string, selectedIds: number[]): SiteProcess[] {
  const selected = processMasters.filter((m) => selectedIds.includes(m.id));
  let cur = new Date(startDate);
  return selected.map((m) => {
    const s = new Date(cur);
    const e = addBusinessDays(s, m.durationDays + m.dryingDays);
    const p: SiteProcess = { ...m, status: "pending", scheduledStart: s.toISOString().split("T")[0], scheduledEnd: e.toISOString().split("T")[0] };
    cur = new Date(e); cur.setDate(cur.getDate() + 1);
    return p;
  });
}

// ━━━━━━━━━━━━━━━━━━━━
// Main
// ━━━━━━━━━━━━━━━━━━━━
export default function Dashboard() {
  const { getEffectiveDays } = useWeatherMode();
  const { adoptPlan } = useSchedule();
  const sim = useAISimulation();
  const days = getEffectiveDays();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form
  const [siteName, setSiteName] = useState("");
  const [address, setAddress] = useState("");
  const [buildingType, setBuildingType] = useState<BuildingType>("house");
  const [paintArea, setPaintArea] = useState("150");
  const [startDate, setStartDate] = useState("2026-04-14");
  const [ownerName, setOwnerName] = useState("");
  const [useExisting, setUseExisting] = useState("");
  const [workType, setWorkType] = useState<string>("exterior");
  const [selectedProcessIds, setSelectedProcessIds] = useState<number[]>(processMasters.map((m) => m.id));
  const [showProcessDetail, setShowProcessDetail] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [priority, setPriority] = useState<"speed" | "cost" | "quality">("quality");
  const [avoidWeekends, setAvoidWeekends] = useState(false);
  const [includeBuffer, setIncludeBuffer] = useState(true);

  // Result
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlanIds, setComparePlanIds] = useState<[string, string] | null>(null);
  const [adoptedId, setAdoptedId] = useState<string | null>(null);

  // Auto-transition
  useEffect(() => {
    if (sim.state === "thinking" || sim.state === "streaming") setStep(2);
    if (sim.state === "complete") setStep(3);
    if (sim.state === "error") setStep(3);
  }, [sim.state]);

  const handlePreset = (siteId: string) => {
    const site = sampleSites.find((s) => s.id === siteId);
    if (site) { setSiteName(site.name); setAddress(site.address); setBuildingType(site.buildingType); setPaintArea(String(site.paintArea)); setStartDate(site.startDate); setOwnerName(site.ownerName); }
    setUseExisting(siteId);
  };

  const handleWorkType = (id: string) => {
    setWorkType(id);
    const wt = WORK_TYPES.find((w) => w.id === id);
    if (wt) setSelectedProcessIds([...wt.processIds]);
  };

  const toggleProcess = (id: number) => {
    setSelectedProcessIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].sort((a, b) => a - b));
  };

  const handleSimulate = () => {
    const site: Site = {
      id: useExisting || "custom-site", name: siteName || "新規現場", address: address || "大阪府", ownerName: ownerName || "施主",
      buildingType, paintArea: Number(paintArea) || 150, startDate, status: "scheduled",
      processes: buildProcesses(startDate, selectedProcessIds),
    };
    sim.reset(); setAdoptedId(null); setSelectedPlanId(null); setCompareMode(false); setComparePlanIds(null);
    sim.run(site, days, "optimize");
  };

  const handleAdopt = (proposal: ScheduleProposal) => {
    if (!sim.proposals) return;
    adoptPlan(useExisting || "custom-site", proposal, sim.proposals);
    setAdoptedId(proposal.id);
  };

  const handleRestart = () => {
    sim.reset(); setAdoptedId(null); setSelectedPlanId(null); setCompareMode(false); setComparePlanIds(null); setStep(1);
  };

  const alertDays = days.filter((d) => !d.canWork);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" {...pageTransition}>
            <Step1Input
              siteName={siteName} setSiteName={setSiteName}
              address={address} setAddress={setAddress}
              ownerName={ownerName} setOwnerName={setOwnerName}
              buildingType={buildingType} setBuildingType={setBuildingType}
              paintArea={paintArea} setPaintArea={setPaintArea}
              startDate={startDate} setStartDate={setStartDate}
              workType={workType} handleWorkType={handleWorkType}
              selectedProcessIds={selectedProcessIds} toggleProcess={toggleProcess}
              setSelectedProcessIds={setSelectedProcessIds}
              showProcessDetail={showProcessDetail} setShowProcessDetail={setShowProcessDetail}
              showOptions={showOptions} setShowOptions={setShowOptions}
              priority={priority} setPriority={setPriority}
              avoidWeekends={avoidWeekends} setAvoidWeekends={setAvoidWeekends}
              includeBuffer={includeBuffer} setIncludeBuffer={setIncludeBuffer}
              alertDays={alertDays}
              onSubmit={handleSimulate}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" {...pageTransition}>
            <Step2Loading statusMessage={sim.statusMessage} progress={sim.progress} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" {...pageTransition}>
            <Step3Result
              proposals={sim.proposals} error={sim.error} simState={sim.state}
              days={days}
              selectedPlanId={selectedPlanId} setSelectedPlanId={setSelectedPlanId}
              compareMode={compareMode} setCompareMode={setCompareMode}
              comparePlanIds={comparePlanIds} setComparePlanIds={setComparePlanIds}
              adoptedId={adoptedId} onAdopt={handleAdopt} onRestart={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━
// Step Indicator
// ━━━━━━━━━━━━━━━━━━━━
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "施工情報入力", icon: FileText },
    { num: 2, label: "AI生成中", icon: Sparkles },
    { num: 3, label: "プラン提案", icon: CheckCircle2 },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-0 mb-12 px-4">
      {steps.map((s, i) => {
        const isActive = current === s.num;
        const isDone = current > s.num;
        const Icon = s.icon;

        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                isDone ? "bg-green-500 text-white shadow-md shadow-green-200" :
                isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" :
                "bg-gray-200 text-gray-400"
              }`}>
                {isDone ? <Check size={22} /> : isActive && s.num === 2 ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
              </div>
              <p className={`mt-2 text-sm font-semibold whitespace-nowrap ${
                isDone ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400"
              }`}>{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-20 lg:w-36 h-1 rounded-full mx-3 mb-6 transition-all duration-500 ${
                current > s.num ? "bg-green-400" : current === s.num ? "bg-blue-200" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━
// Step 1: Input
// ━━━━━━━━━━━━━━━━━━━━
function Step1Input(props: {
  siteName: string; setSiteName: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  ownerName: string; setOwnerName: (v: string) => void;
  buildingType: BuildingType; setBuildingType: (v: BuildingType) => void;
  paintArea: string; setPaintArea: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  workType: string; handleWorkType: (id: string) => void;
  selectedProcessIds: number[]; toggleProcess: (id: number) => void;
  setSelectedProcessIds: (ids: number[]) => void;
  showProcessDetail: boolean; setShowProcessDetail: (v: boolean) => void;
  showOptions: boolean; setShowOptions: (v: boolean) => void;
  priority: "speed" | "cost" | "quality"; setPriority: (v: "speed" | "cost" | "quality") => void;
  avoidWeekends: boolean; setAvoidWeekends: (v: boolean) => void;
  includeBuffer: boolean; setIncludeBuffer: (v: boolean) => void;
  alertDays: { date: string; weather: import("@/lib/types").WeatherType }[];
  onSubmit: () => void;
}) {
  const allSelected = props.selectedProcessIds.length === processMasters.length;

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-xl shadow-purple-200/50 mb-6">
          <Sparkles size={40} className="text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
          スケジュールシミュレーター
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          現場データを確認し、施工する工程を選んで<br className="hidden sm:block" />
          AIが天気予報に基づく最適プランを3つ提案します
        </p>
      </div>

      {/* Blueprint link */}
      <Link href="/estimate"
        className="flex items-center justify-between rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 mb-10 hover:border-emerald-500 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">設計図から自動入力</p>
            <p className="text-base text-gray-500">図面をアップロードすると、AIが面積を推定して見積も作成します</p>
          </div>
        </div>
        <ArrowRight size={24} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* ━━━ Section 1: 現場データ ━━━ */}
      <Card className="mb-8 border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Building2 size={20} className="text-blue-600" /> 現場データ
          </h2>
        </div>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <InputField icon={<MapPin size={18} />} label="現場名" value={props.siteName}
              onChange={(v) => props.setSiteName(v)} placeholder="例: 高石市 田中邸" />
            <InputField icon={<MapPin size={18} />} label="住所" value={props.address}
              onChange={(v) => props.setAddress(v)} placeholder="例: 大阪府高石市取石3丁目" />
            <InputField icon={<Building2 size={18} />} label="施主名" value={props.ownerName}
              onChange={(v) => props.setOwnerName(v)} placeholder="例: 田中 太郎" />
          </div>

          {/* Building type */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-3">建物種別</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { value: "house" as const, icon: "🏠", label: "戸建て住宅", desc: "一般住宅の外壁塗装" },
                { value: "apartment" as const, icon: "🏢", label: "マンション", desc: "集合住宅の大規模修繕" },
                { value: "public" as const, icon: "🏛️", label: "公共施設", desc: "公共建築物の塗装工事" },
              ]).map((item) => (
                <button key={item.value} onClick={() => props.setBuildingType(item.value)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    props.buildingType === item.value ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100" : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  {props.buildingType === item.value && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"><Check size={14} /></div>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{item.icon}</span>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InputField icon={<Ruler size={18} />} label="塗装面積（m²）" value={props.paintArea}
              onChange={(v) => props.setPaintArea(v)} placeholder="150" type="number" />
            <InputField icon={<CalendarDays size={18} />} label="開始予定日" value={props.startDate}
              onChange={(v) => props.setStartDate(v)} type="date" />
          </div>
        </CardContent>
      </Card>

      {/* ━━━ Section 2: 工事タイプ選択 ━━━ */}
      <Card className="mb-8 border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Layers size={20} className="text-purple-600" /> どの工事をしますか？
          </h2>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {WORK_TYPES.map((wt) => {
              const isSelected = props.workType === wt.id;
              return (
                <button key={wt.id} onClick={() => props.handleWorkType(wt.id)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    isSelected ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-100/50" : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white shadow-md"><Check size={16} /></div>
                  )}
                  <span className="text-4xl block mb-3">{wt.icon}</span>
                  <p className="text-lg font-bold text-gray-900">{wt.label}</p>
                  <p className="text-sm text-gray-500 mt-1">{wt.desc}</p>
                  <p className="text-sm text-purple-600 font-semibold mt-2">{wt.processIds.length}工程</p>
                </button>
              );
            })}
          </div>

          {/* Selected process summary */}
          <div className="rounded-xl bg-purple-50/50 border border-purple-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-600 text-white text-base px-3 py-1">{props.selectedProcessIds.length}工程</Badge>
              <span className="text-base text-gray-700 font-medium">
                {props.selectedProcessIds.map((id) => processMasters.find((m) => m.id === id)?.name).filter(Boolean).join(" → ")}
              </span>
            </div>
            <button onClick={() => props.setShowProcessDetail(!props.showProcessDetail)}
              className="text-base font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              工程をカスタマイズ {props.showProcessDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* Detailed process customization (optional) */}
          {props.showProcessDetail && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-base font-semibold text-gray-700">工程の追加・削除</p>
                <button onClick={() => props.setSelectedProcessIds(allSelected ? [] : processMasters.map((m) => m.id))}
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  {allSelected ? "すべて解除" : "すべて選択"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {processMasters.map((proc) => {
                  const isSelected = props.selectedProcessIds.includes(proc.id);
                  const rainIcon = proc.rainTolerance === "ok" ? "✅" : proc.rainTolerance === "partial" ? "⚠️" : "🚫";
                  return (
                    <button key={proc.id} onClick={() => props.toggleProcess(proc.id)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                        isSelected ? "border-purple-400 bg-purple-50/50" : "border-gray-200 bg-white opacity-50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        isSelected ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-400"
                      }`}>
                        {isSelected ? <Check size={16} /> : proc.id}
                      </div>
                      <span className="text-base font-semibold text-gray-800 flex-1">{proc.name}</span>
                      <span className="text-sm">{rainIcon}</span>
                      <span className="text-sm text-gray-400">{proc.durationDays}日</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ━━━ Section 3: オプション ━━━ */}
      <Card className="mb-8 border-2 border-gray-200 shadow-sm overflow-hidden">
        <button onClick={() => props.setShowOptions(!props.showOptions)}
          className="w-full bg-gray-50 border-b border-gray-200 px-8 py-4 flex items-center justify-between text-left"
        >
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Settings2 size={20} className="text-gray-500" /> オプション設定
          </h2>
          {props.showOptions ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {props.showOptions && (
          <CardContent className="p-8 space-y-6">
            <div>
              <label className="text-base font-semibold text-gray-700 mb-3 block">優先事項</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([["speed", "🚀 スピード重視", "工期を最短に"], ["cost", "💰 コスト重視", "追加費用を最小に"], ["quality", "✨ 品質重視", "天候リスクを最小に"]] as const).map(
                  ([val, label, desc]) => (
                    <button key={val} onClick={() => props.setPriority(val)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        props.priority === val ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                    >
                      <p className="text-base font-bold text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-base font-semibold text-gray-700">土日を避ける</p><p className="text-sm text-gray-500">近隣への配慮で土日の作業を避けます</p></div>
              <Switch checked={props.avoidWeekends} onCheckedChange={props.setAvoidWeekends} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-base font-semibold text-gray-700">バッファ日を含める</p><p className="text-sm text-gray-500">予備日を追加してスケジュールに余裕を持たせます</p></div>
              <Switch checked={props.includeBuffer} onCheckedChange={props.setIncludeBuffer} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Weather alert */}
      {props.alertDays.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-4 mb-8">
          <CloudRain size={24} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-base font-bold text-amber-800">天気予報: {props.alertDays.length}日間の施工不可日を検出</p>
            <div className="flex gap-2 flex-wrap mt-2">
              {props.alertDays.slice(0, 5).map((d) => (
                <span key={d.date} className="inline-flex items-center gap-1 bg-amber-100 rounded-lg px-3 py-1.5 text-sm font-medium text-amber-700">
                  {getWeatherEmoji(d.weather)} {formatDateFull(d.date)}
                </span>
              ))}
              {props.alertDays.length > 5 && <span className="text-sm text-amber-600 self-center">他{props.alertDays.length - 5}日</span>}
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <Button onClick={props.onSubmit} size="lg" disabled={props.selectedProcessIds.length === 0}
        className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white gap-3 text-xl py-8 rounded-2xl shadow-xl shadow-purple-200/40 disabled:opacity-50"
      >
        <Sparkles size={26} /> {props.selectedProcessIds.length}工程でスケジュールを生成
      </Button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━
// Step 2: Loading (progress %)
// ━━━━━━━━━━━━━━━━━━━━
function Step2Loading({ statusMessage, progress }: {
  statusMessage: string; progress: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Pulsing icon */}
      <motion.div className="relative mb-10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
      >
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-6xl text-white shadow-2xl shadow-purple-300/50">
          ✨
        </div>
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="absolute top-1/2 left-1/2 h-4 w-4 rounded-full bg-purple-400/80"
            animate={{
              x: [Math.cos((i * 2 * Math.PI) / 3) * 70, Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 70, Math.cos((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 70],
              y: [Math.sin((i * 2 * Math.PI) / 3) * 70, Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 70, Math.sin((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 70],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" as const, delay: i * 0.4 }}
          />
        ))}
      </motion.div>

      {/* Progress % */}
      <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
        {progress}%
      </p>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.p key={statusMessage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="text-xl font-semibold text-gray-500 mb-8 text-center"
        >
          {statusMessage || "AIが分析中..."}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-[28rem] h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━
// Step 3: Result — Gantt always visible, plan selector, compare mode
// ━━━━━━━━━━━━━━━━━━━━
function Step3Result(props: {
  proposals: ScheduleProposal[] | null;
  error: string | null;
  simState: string;
  days: import("@/lib/types").WeatherDay[];
  selectedPlanId: string | null;
  setSelectedPlanId: (v: string | null) => void;
  compareMode: boolean;
  setCompareMode: (v: boolean) => void;
  comparePlanIds: [string, string] | null;
  setComparePlanIds: (v: [string, string] | null) => void;
  adoptedId: string | null;
  onAdopt: (p: ScheduleProposal) => void;
  onRestart: () => void;
}) {
  if (props.simState === "error" || props.error) {
    return (
      <div className="text-center py-20">
        <Card className="max-w-lg mx-auto border-2 border-red-200 bg-red-50">
          <CardContent className="p-10">
            <p className="text-xl text-red-600 font-semibold mb-4">エラーが発生しました</p>
            <p className="text-base text-red-500 mb-6">{props.error}</p>
            <Button size="lg" onClick={props.onRestart} className="gap-2"><RotateCcw size={20} /> 最初からやり直す</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!props.proposals) return null;

  const selected = props.proposals.find((p) => p.id === props.selectedPlanId) || props.proposals[1];
  const compareA = props.comparePlanIds ? props.proposals.find((p) => p.id === props.comparePlanIds![0]) : null;
  const compareB = props.comparePlanIds ? props.proposals.find((p) => p.id === props.comparePlanIds![1]) : null;

  return (
    <div>
      {/* Adopted toast */}
      {props.adoptedId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-6 flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-md"><Check size={28} /></div>
            <div>
              <p className="text-2xl font-bold text-green-800">カレンダーに登録完了！</p>
              <p className="text-base text-green-600">不採用プランは代替ストックに保存しました</p>
            </div>
          </div>
          <Link href="/calendar">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2 text-lg px-8 py-6 rounded-xl">
              カレンダーを見る <ArrowRight size={20} />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Plan selector tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          {props.proposals.map((proposal, idx) => {
            const meta = planMeta[proposal.type];
            const Icon = meta.icon;
            const isActive = !props.compareMode && selected.id === proposal.id;
            const isAdopted = props.adoptedId === proposal.id;
            const isRecommended = idx === 1;

            return (
              <button key={proposal.id}
                onClick={() => { props.setSelectedPlanId(proposal.id); props.setCompareMode(false); props.setComparePlanIds(null); }}
                className={`relative flex items-center gap-3 rounded-2xl border-2 px-5 py-4 transition-all duration-200 ${
                  isActive ? `${meta.border} ${meta.bg} shadow-md` : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.color} text-white`}>
                  <Icon size={20} />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-gray-900">{proposal.name}</p>
                  <p className="text-sm text-gray-500">{proposal.totalDays}日 ・ +{proposal.impactDays}日 ・ {proposal.impactCost}万円</p>
                </div>
                {isRecommended && !props.adoptedId && (
                  <Badge className="bg-blue-600 text-white text-[11px] absolute -top-2 right-2">おすすめ</Badge>
                )}
                {isAdopted && (
                  <Badge className="bg-green-500 text-white text-[11px] absolute -top-2 right-2"><Check size={12} className="mr-0.5" />採用</Badge>
                )}
              </button>
            );
          })}
        </div>
        <Button variant={props.compareMode ? "default" : "outline"} className="gap-2 rounded-xl"
          onClick={() => {
            if (!props.compareMode) {
              props.setCompareMode(true);
              props.setComparePlanIds([props.proposals![0].id, props.proposals![1].id]);
            } else {
              props.setCompareMode(false);
              props.setComparePlanIds(null);
            }
          }}
        >
          <Scale size={18} /> 比較モード
        </Button>
      </div>

      {/* Compare mode selector */}
      {props.compareMode && props.comparePlanIds && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <span className="text-base font-semibold text-blue-700">比較:</span>
          {[0, 1].map((slot) => (
            <div key={slot} className="flex gap-2">
              {props.proposals!.map((p) => {
                const meta = planMeta[p.type];
                const Icon = meta.icon;
                const isSelected = props.comparePlanIds![slot] === p.id;
                return (
                  <button key={p.id}
                    onClick={() => {
                      const next = [...props.comparePlanIds!] as [string, string];
                      next[slot] = p.id;
                      props.setComparePlanIds(next);
                    }}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                      isSelected ? `${meta.border} ${meta.bg}` : "border-gray-200 bg-white"
                    }`}
                  >
                    <Icon size={16} /> {p.name}
                  </button>
                );
              })}
              {slot === 0 && <span className="text-gray-400 font-bold self-center mx-2">vs</span>}
            </div>
          ))}
        </div>
      )}

      {/* Main Gantt chart area */}
      {!props.compareMode ? (
        <Card className="mb-8 border-2 shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${planMeta[selected.type].color} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {(() => { const Icon = planMeta[selected.type].icon; return <Icon size={24} className="text-white" />; })()}
              <h2 className="text-xl font-bold text-white">{selected.name}</h2>
              <Badge className={`${riskMap[selected.riskLevel].cls} text-sm`}>リスク: {riskMap[selected.riskLevel].label}</Badge>
            </div>
            <div className="flex items-center gap-6 text-white text-base font-semibold">
              <span><Clock size={16} className="inline mr-1" />工期 {selected.totalDays}日</span>
              <span><CalendarDays size={16} className="inline mr-1" />遅延 +{selected.impactDays}日</span>
              <span><Wallet size={16} className="inline mr-1" />{selected.impactCost}万円</span>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="text-base text-gray-600 mb-4">{selected.summary}</p>
            <GanttChart processes={selected.schedule} weatherDays={props.days} />
          </CardContent>
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
            {!props.adoptedId || props.adoptedId !== selected.id ? (
              <Button onClick={() => props.onAdopt(selected)}
                className={`bg-gradient-to-r ${planMeta[selected.type].color} hover:opacity-90 text-white gap-2 text-lg px-8 py-5 rounded-xl shadow-md`}
              >
                <Check size={22} /> このプランを採用してカレンダーに登録
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 font-bold text-lg"><Check size={22} /> 採用済み</div>
            )}
            <Button variant="outline" className="gap-2 text-base rounded-xl" onClick={props.onRestart}>
              <ArrowLeft size={18} /> 条件を変えてもう一度
            </Button>
          </div>
        </Card>
      ) : (
        /* Compare mode: side by side */
        compareA && compareB && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {[compareA, compareB].map((plan) => (
              <Card key={plan.id} className={`border-2 ${planMeta[plan.type].border} shadow-md overflow-hidden`}>
                <div className={`bg-gradient-to-r ${planMeta[plan.type].color} px-5 py-3 flex items-center gap-3`}>
                  {(() => { const Icon = planMeta[plan.type].icon; return <Icon size={20} className="text-white" />; })()}
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="ml-auto flex gap-4 text-white text-sm font-semibold">
                    <span>{plan.totalDays}日</span>
                    <span>+{plan.impactDays}日</span>
                    <span>{plan.impactCost}万円</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-3">{plan.summary}</p>
                  <GanttChart processes={plan.schedule} weatherDays={props.days} compact />
                </CardContent>
                <div className="border-t px-4 py-3">
                  {props.adoptedId !== plan.id ? (
                    <Button onClick={() => props.onAdopt(plan)} size="lg"
                      className={`w-full bg-gradient-to-r ${planMeta[plan.type].color} text-white gap-2 rounded-xl`}
                    >
                      <Check size={18} /> 採用
                    </Button>
                  ) : (
                    <div className="text-center text-green-600 font-bold py-2"><Check size={18} className="inline mr-1" />採用済み</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Restart (only in compare mode - single mode has it inside the card) */}
      {props.compareMode && (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" className="text-lg px-10 py-6 rounded-xl gap-2" onClick={props.onRestart}>
            <ArrowLeft size={20} /> 条件を変えてもう一度
          </Button>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━
// Shared Components
// ━━━━━━━━━━━━━━━━━━━━
function InputField({ icon, label, value, onChange, placeholder, type = "text" }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-2">
        <span className="text-gray-400">{icon}</span> {label}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
      />
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}
