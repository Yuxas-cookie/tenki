import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { WeatherType, ProcessStatus, SiteStatus, BuildingType } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  result.setDate(result.getDate() + Math.ceil(days) - 1);
  return result;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日(${days[date.getDay()]})`;
}

export function getWeatherEmoji(weather: WeatherType): string {
  const map: Record<WeatherType, string> = {
    sunny: "☀️",
    cloudy: "☁️",
    rainy: "🌧️",
    heavy_rain: "⛈️",
    storm: "🌪️",
  };
  return map[weather];
}

export function getWeatherLabel(weather: WeatherType): string {
  const map: Record<WeatherType, string> = {
    sunny: "晴れ",
    cloudy: "曇り",
    rainy: "雨",
    heavy_rain: "大雨",
    storm: "暴風雨",
  };
  return map[weather];
}

export function getStatusLabel(status: ProcessStatus | SiteStatus): string {
  const map: Record<string, string> = {
    pending: "未着手",
    in_progress: "進行中",
    completed: "完了",
    weather_hold: "天候待ち",
    scheduled: "予定",
    suspended: "中断",
  };
  return map[status] || status;
}

export function getStatusColor(status: ProcessStatus | SiteStatus): string {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    weather_hold: "bg-amber-100 text-amber-700",
    scheduled: "bg-gray-100 text-gray-700",
    suspended: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}

export function getBuildingTypeLabel(type: BuildingType): string {
  const map: Record<BuildingType, string> = {
    house: "戸建て住宅",
    apartment: "マンション",
    public: "公共施設",
  };
  return map[type];
}

export function getBuildingTypeIcon(type: BuildingType): string {
  const map: Record<BuildingType, string> = {
    house: "🏠",
    apartment: "🏢",
    public: "🏛️",
  };
  return map[type];
}

export function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function getProgressPercentage(processes: { status: ProcessStatus }[]): number {
  if (processes.length === 0) return 0;
  const completed = processes.filter((p) => p.status === "completed").length;
  return Math.round((completed / processes.length) * 100);
}
