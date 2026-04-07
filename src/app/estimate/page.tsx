"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Sparkles,
  Check,
  Building2,
  Layers,
  Ruler,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ImageIcon,
  Loader2,
  CheckCircle2,
  Calculator,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlueprintAnalysis, PaintGrade, EstimateResult, BuildingType } from "@/lib/types";
import { calculateEstimate, GRADE_INFO } from "@/lib/estimate/pricing";
import { getBuildingTypeIcon, getBuildingTypeLabel } from "@/lib/utils";

const pageAnim = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -24 }, transition: { duration: 0.35, ease: "easeInOut" as const } };

export default function EstimatePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<BlueprintAnalysis | null>(null);
  const [paintArea, setPaintArea] = useState(150);
  const [grade, setGrade] = useState<PaintGrade>("silicon");
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!preview) return;
    setStep(2); setProgress(10);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 90));
    }, 300);

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      const data: BlueprintAnalysis = await res.json();
      setAnalysis(data);
      setPaintArea(data.estimatedPaintArea);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setStep(3), 500);
    } catch {
      clearInterval(interval);
      setStep(1);
    }
  };

  const handleCalcEstimate = () => {
    if (!analysis) return;
    const result = calculateEstimate(paintArea, grade, analysis.buildingType);
    setEstimate(result);
    setStep(4);
  };

  const handleRestart = () => {
    setStep(1); setPreview(null); setFileName(""); setAnalysis(null); setEstimate(null); setProgress(0);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Step indicator */}
      <StepBar current={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" {...pageAnim}>
            {/* Hero */}
            <div className="text-center mb-12">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-200/50 mb-6">
                <FileText size={40} className="text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">見積作成</h1>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                建物の設計図をアップロードするだけで<br className="hidden sm:block" />
                AIが塗装面積を自動推定し、詳細見積を作成します
              </p>
            </div>

            {/* Upload area */}
            <Card className="mb-8 border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors">
              <CardContent className="p-0">
                <div
                  className="flex flex-col items-center justify-center py-10 sm:py-20 px-8 cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? (
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="設計図プレビュー" className="max-h-64 rounded-xl shadow-lg border" />
                        <Badge className="absolute -top-2 -right-2 bg-green-500 text-white"><Check size={14} /></Badge>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{fileName}</p>
                      <p className="text-base text-gray-500 mt-1">クリックして変更</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gray-100 mb-6">
                        <Upload size={40} className="text-gray-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-700 mb-2">設計図をアップロード</p>
                      <p className="text-lg text-gray-500 mb-4">ドラッグ&ドロップ または クリックして選択</p>
                      <p className="text-base text-gray-400">対応形式: PNG, JPG, PDF</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </CardContent>
            </Card>

            {preview && (
              <Button onClick={handleAnalyze} size="lg"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-3 text-xl py-8 rounded-2xl shadow-xl"
              >
                <Sparkles size={26} /> AIで設計図を分析
              </Button>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" {...pageAnim}>
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
                className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-6xl text-white shadow-2xl shadow-emerald-300/50 mb-10"
              >
                <ImageIcon size={56} />
              </motion.div>
              <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-4">{progress}%</p>
              <p className="text-xl font-semibold text-gray-500 mb-8">設計図をAIが分析中...</p>
              <div className="w-[28rem] h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" as const }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && analysis && (
          <motion.div key="s3" {...pageAnim}>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">分析結果 & 塗料グレード選択</h1>

            {/* Analysis result */}
            <Card className="mb-8 border-2 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-5 flex items-center gap-4">
                <span className="text-5xl">{getBuildingTypeIcon(analysis.buildingType)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{getBuildingTypeLabel(analysis.buildingType)}</h2>
                  <p className="text-emerald-100">{analysis.structure} ・ {analysis.floors}階建て</p>
                </div>
              </div>
              <CardContent className="p-8">
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">{analysis.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                  <Stat icon={<Layers size={20} />} label="階数" value={`${analysis.floors}階`} />
                  <Stat icon={<Building2 size={20} />} label="延べ床面積" value={`${analysis.totalFloorArea}m²`} />
                  <Stat icon={<Ruler size={20} />} label="塗装面積（推定）" value={`${analysis.estimatedPaintArea}m²`} accent />
                  <Stat icon={<FileText size={20} />} label="構造" value={analysis.structure} />
                </div>

                {/* Adjustable area */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="text-base font-bold text-gray-700 mb-3 block">塗装面積を調整（m²）</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={50} max={2000} step={10} value={paintArea}
                      onChange={(e) => setPaintArea(Number(e.target.value))}
                      className="flex-1 h-3 rounded-full accent-emerald-600"
                    />
                    <span className="text-3xl font-extrabold text-emerald-700 w-28 text-right">{paintArea}m²</span>
                  </div>
                </div>

                {analysis.notes.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {analysis.notes.map((note, i) => (
                      <p key={i} className="text-base text-gray-500 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span> {note}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grade selection */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">塗料グレードを選択</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {(["silicon", "fluorine", "inorganic"] as PaintGrade[]).map((g) => {
                const info = GRADE_INFO[g];
                const isSelected = grade === g;
                return (
                  <button key={g} onClick={() => setGrade(g)}
                    className={`relative rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
                      isSelected ? `${info.border} ${info.bg} shadow-lg` : "border-gray-200 bg-white hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md"><Check size={16} /></div>
                    )}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${info.color} text-white mb-4 shadow-md`}>
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-1">{info.label}</h3>
                    <Badge className="mb-3">耐用年数 {info.durability}</Badge>
                    <p className="text-base text-gray-600">{info.feature}</p>
                  </button>
                );
              })}
            </div>

            <Button onClick={handleCalcEstimate} size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-3 text-xl py-8 rounded-2xl shadow-xl"
            >
              <Calculator size={26} /> 見積を算出
            </Button>
          </motion.div>
        )}

        {step === 4 && estimate && (
          <motion.div key="s4" {...pageAnim}>
            <div className="text-center mb-10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-200/50 mb-6"
              >
                <CheckCircle2 size={40} className="text-white" />
              </motion.div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">見積結果</h1>
              <p className="text-xl text-gray-500">{estimate.gradeLabel} ・ 塗装面積 {estimate.paintArea}m²</p>
            </div>

            {/* Total */}
            <Card className="mb-8 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-8 text-center">
                <p className="text-lg text-emerald-700 font-semibold mb-2">見積総額（税込）</p>
                <p className="text-6xl font-extrabold text-emerald-800">
                  ¥{estimate.total.toLocaleString()}
                </p>
                <p className="text-base text-gray-500 mt-2">
                  小計 ¥{estimate.subtotal.toLocaleString()} + 消費税 ¥{estimate.tax.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Breakdown table */}
            <Card className="mb-8 border-2">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-base font-bold text-gray-700">工程</th>
                      <th className="text-right px-6 py-4 text-base font-bold text-gray-700">単価（/m²）</th>
                      <th className="text-right px-6 py-4 text-base font-bold text-gray-700">面積</th>
                      <th className="text-right px-6 py-4 text-base font-bold text-gray-700">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.lineItems.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-base font-semibold text-gray-800">{item.name}</td>
                        <td className="px-6 py-4 text-base text-gray-600 text-right">¥{item.unitPrice.toLocaleString()}</td>
                        <td className="px-6 py-4 text-base text-gray-600 text-right">{item.area}m²</td>
                        <td className="px-6 py-4 text-lg font-bold text-gray-900 text-right">¥{item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={3} className="px-6 py-4 text-base font-bold text-gray-700 text-right">小計</td>
                      <td className="px-6 py-4 text-lg font-bold text-gray-900 text-right">¥{estimate.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-3 text-base text-gray-600 text-right">消費税（10%）</td>
                      <td className="px-6 py-3 text-base text-gray-600 text-right">¥{estimate.tax.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                      <td colSpan={3} className="px-6 py-5 text-xl font-extrabold text-emerald-800 text-right">総額（税込）</td>
                      <td className="px-6 py-5 text-2xl font-extrabold text-emerald-800 text-right">¥{estimate.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Link href="/" className="flex-1">
                <Button size="lg" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2 text-lg py-7 rounded-xl shadow-xl">
                  <ArrowRight size={22} /> スケジュールシミュレーターに連携
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 text-lg py-7 rounded-xl px-8" onClick={handleRestart}>
                <RotateCcw size={20} /> やり直す
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = [
    { num: 1, label: "設計図アップロード", icon: Upload },
    { num: 2, label: "AI分析中", icon: Sparkles },
    { num: 3, label: "グレード選択", icon: Layers },
    { num: 4, label: "見積結果", icon: CheckCircle2 },
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
                isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" :
                "bg-gray-200 text-gray-400"
              }`}>
                {isDone ? <Check size={22} /> : isActive && s.num === 2 ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
              </div>
              <p className={`mt-2 text-xs sm:text-sm font-semibold whitespace-nowrap ${
                isDone ? "text-green-600" : isActive ? "text-emerald-600" : "text-gray-400"
              }`}>{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-16 lg:w-24 h-1 rounded-full mx-2 mb-6 transition-all duration-500 ${
                current > s.num ? "bg-green-400" : current === s.num ? "bg-emerald-200" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <div className="flex justify-center mb-2 text-gray-400">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-extrabold ${accent ? "text-emerald-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
