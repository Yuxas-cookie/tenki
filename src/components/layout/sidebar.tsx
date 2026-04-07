"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Cloud,
  Sparkles,
  CalendarDays,
  FileText,
  Receipt,
  Menu,
  X,
} from "lucide-react";
import { useWeatherMode } from "@/providers/weather-mode-provider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeatherScenario } from "@/lib/types";
import { scenarioLabels } from "@/lib/data/weather-scenarios";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/sites", label: "現場一覧", icon: Building2 },
  { href: "/weather", label: "天気予報", icon: Cloud },
  { href: "/simulation", label: "AIシミュレーション", icon: Sparkles },
  { href: "/estimate", label: "見積作成", icon: FileText },
  { href: "/expenses", label: "経費管理", icon: Receipt },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { weatherMode, setMode, setScenario } = useWeatherMode();
  const isDemo = weatherMode.mode === "demo";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Overlay backdrop (mobile) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo + close button */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg shadow-md">
              K
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">PaintAI</h1>
              <p className="text-xs text-gray-400 leading-tight">Scheduler</p>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={onClose}>
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all",
                  active ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={20} className={cn(active ? "text-blue-600" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Weather mode */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">天気データ</p>
          <div className="flex items-center gap-3">
            <span className={cn("text-sm font-medium", !isDemo ? "text-blue-600" : "text-gray-400")}>リアル</span>
            <Switch checked={isDemo} onCheckedChange={(checked) => setMode(checked ? "demo" : "real")} />
            <span className={cn("text-sm font-medium", isDemo ? "text-purple-600" : "text-gray-400")}>デモ</span>
          </div>
          {isDemo && (
            <Select value={weatherMode.scenario} onValueChange={(v) => setScenario((v || "mid_rain") as WeatherScenario)}>
              <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(scenarioLabels) as WeatherScenario[]).map((key) => (
                  <SelectItem key={key} value={key}>{scenarioLabels[key].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* AI status */}
        <div className="border-t border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            <span className="text-sm font-semibold text-purple-700">AI Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileHeader({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
      <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onOpen}>
        <Menu size={24} className="text-gray-700" />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm shadow-sm">K</div>
        <span className="text-base font-bold text-gray-900">PaintAI</span>
      </Link>
      <div className="w-10" /> {/* spacer */}
    </header>
  );
}
