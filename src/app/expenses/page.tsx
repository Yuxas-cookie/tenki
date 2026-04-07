"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, Upload, Plus, X, Check, Loader2, Filter,
  Paintbrush, Car, Wrench, UtensilsCrossed, Package,
} from "lucide-react";
import { useExpenses } from "@/providers/expense-provider";
import { sampleSites } from "@/lib/data/sites";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { Expense, ExpenseCategory } from "@/lib/types";

const CAT_META: Record<ExpenseCategory, { label: string; icon: typeof Paintbrush; color: string; bg: string }> = {
  material: { label: "材料費", icon: Paintbrush, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  transport: { label: "交通費", icon: Car, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  tool: { label: "工具・消耗品", icon: Wrench, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  food: { label: "食費・飲料", icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  other: { label: "その他", icon: Package, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
};

export default function ExpensesPage() {
  const { expenses, addExpense, getMonthlyTotal, getCategoryTotals } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterSite, setFilterSite] = useState<string>("all");

  // Scan state
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanFileName, setScanFileName] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ date: string; storeName: string; amount: number; items: { name: string; price: number }[]; suggestedCategory: ExpenseCategory } | null>(null);
  const [regCategory, setRegCategory] = useState<ExpenseCategory>("material");
  const [regSiteId, setRegSiteId] = useState<string>("none");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const now = new Date();
  const monthTotal = getMonthlyTotal(now.getFullYear(), now.getMonth());
  const catTotals = getCategoryTotals(now.getFullYear(), now.getMonth());

  const handleFile = useCallback((file: File) => {
    setScanFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setScanImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleScan = async () => {
    if (!scanImage) return;
    setScanning(true);
    try {
      const res = await fetch("/api/expenses/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: scanImage }),
      });
      const data = await res.json();
      setScanResult(data);
      setRegCategory(data.suggestedCategory || "material");
    } catch { /* ignore */ }
    setScanning(false);
  };

  const handleRegister = () => {
    if (!scanResult) return;
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      date: scanResult.date,
      storeName: scanResult.storeName,
      amount: scanResult.amount,
      category: regCategory,
      items: scanResult.items,
      siteId: regSiteId === "none" ? null : regSiteId,
      receiptImage: scanImage || "",
      createdAt: new Date().toISOString(),
    };
    addExpense(expense);
    setShowForm(false); setScanImage(null); setScanResult(null); setScanFileName("");
  };

  const filtered = expenses.filter((e) => {
    if (filterCat !== "all" && e.category !== filterCat) return false;
    if (filterSite !== "all" && (filterSite === "none" ? e.siteId !== null : e.siteId !== filterSite)) return false;
    return true;
  });

  return (
    <div className="max-w-5xl">
      <PageHeader title="経費管理" description="レシートをAIで読み取り、経費を自動記録">
        <Button onClick={() => setShowForm(!showForm)} size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white gap-2 text-base px-6 py-5 rounded-xl shadow-lg">
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "閉じる" : "レシートを登録"}
        </Button>
      </PageHeader>

      {/* Monthly summary */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{now.getMonth() + 1}月の経費</h2>
          <span className="text-3xl font-extrabold text-gray-900">¥{monthTotal.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.entries(CAT_META) as [ExpenseCategory, typeof CAT_META.material][]).map(([cat, meta]) => {
            const Icon = meta.icon;
            const total = catTotals[cat];
            return (
              <Card key={cat} className={`${meta.bg} border`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon size={22} className={meta.color} />
                  <div>
                    <p className="text-sm text-gray-500">{meta.label}</p>
                    <p className="text-lg font-bold text-gray-900">¥{total.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Registration form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="mb-8 border-2 border-emerald-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Receipt size={22} /> レシートを登録</h3>
              </div>
              <CardContent className="p-6">
                {!scanResult ? (
                  <div>
                    {/* Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-emerald-400 transition-colors mb-4"
                      onClick={() => fileRef.current?.click()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {scanImage ? (
                        <div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={scanImage} alt="レシート" className="max-h-48 mx-auto rounded-xl shadow-md mb-3" />
                          <p className="text-base font-bold text-gray-700">{scanFileName}</p>
                        </div>
                      ) : (
                        <>
                          <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                          <p className="text-xl font-bold text-gray-700">レシート写真をアップロード</p>
                          <p className="text-base text-gray-500 mt-1">ドラッグ&ドロップ or クリック</p>
                        </>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    {scanImage && (
                      <Button onClick={handleScan} disabled={scanning} size="lg"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white gap-2 text-lg py-7 rounded-xl"
                      >
                        {scanning ? <Loader2 size={22} className="animate-spin" /> : <Sparkles size={22} />}
                        {scanning ? "読み取り中..." : "AIでレシートを読み取る"}
                      </Button>
                    )}
                  </div>
                ) : (
                  /* Scan result confirmation */
                  <div className="space-y-6">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xl font-bold text-gray-900">{scanResult.storeName}</p>
                          <p className="text-base text-gray-500">{scanResult.date}</p>
                        </div>
                        <p className="text-3xl font-extrabold text-emerald-700">¥{scanResult.amount.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        {scanResult.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-base">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="font-semibold text-gray-900">¥{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-base font-semibold text-gray-700 mb-2 block">カテゴリ</label>
                        <Select value={regCategory} onValueChange={(v) => setRegCategory(v as ExpenseCategory)}>
                          <SelectTrigger className="h-14 text-base rounded-xl border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(CAT_META) as [ExpenseCategory, typeof CAT_META.material][]).map(([cat, meta]) => (
                              <SelectItem key={cat} value={cat} className="text-base py-3">
                                {meta.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-base font-semibold text-gray-700 mb-2 block">現場（任意）</label>
                        <Select value={regSiteId} onValueChange={(v) => setRegSiteId(v || "none")}>
                          <SelectTrigger className="h-14 text-base rounded-xl border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-base py-3">紐付けなし</SelectItem>
                            {sampleSites.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="text-base py-3">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleRegister} size="lg"
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white gap-2 text-lg py-6 rounded-xl"
                      >
                        <Check size={22} /> この内容で登録
                      </Button>
                      <Button variant="outline" size="lg" className="rounded-xl px-6"
                        onClick={() => { setScanResult(null); setScanImage(null); setScanFileName(""); }}
                      >
                        やり直す
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
        <Filter size={20} className="text-gray-400" />
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px] text-base rounded-xl"><SelectValue placeholder="カテゴリ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全カテゴリ</SelectItem>
            {(Object.entries(CAT_META) as [ExpenseCategory, typeof CAT_META.material][]).map(([cat, meta]) => (
              <SelectItem key={cat} value={cat}>{meta.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSite} onValueChange={(v) => setFilterSite(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px] text-base rounded-xl"><SelectValue placeholder="現場" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全現場</SelectItem>
            <SelectItem value="none">紐付けなし</SelectItem>
            {sampleSites.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-base text-gray-500 ml-auto">{filtered.length}件</span>
      </div>

      {/* Expense list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="bg-gray-50"><CardContent className="p-8 text-center text-lg text-gray-400">経費データがありません</CardContent></Card>
        )}
        {filtered.map((exp) => {
          const meta = CAT_META[exp.category];
          const Icon = meta.icon;
          const site = exp.siteId ? sampleSites.find((s) => s.id === exp.siteId) : null;
          return (
            <Card key={exp.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl ${meta.bg} border`}>
                  <Icon size={26} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-bold text-gray-900">{exp.storeName}</span>
                    <Badge className={`${meta.bg} border ${meta.color} text-sm`}>{meta.label}</Badge>
                  </div>
                  <p className="text-base text-gray-500 truncate">
                    {exp.items.map((i) => i.name).join("、")}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                    <span>{exp.date}</span>
                    {site && <span>📎 {site.name}</span>}
                    {!site && exp.siteId === null && <span>📎 紐付けなし</span>}
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-900 shrink-0">¥{exp.amount.toLocaleString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Re-export Sparkles for scan button
import { Sparkles } from "lucide-react";
