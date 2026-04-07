"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { WeatherMode, WeatherScenario, WeatherModeState, WeatherOverride, WeatherDay } from "@/lib/types";
import { weatherScenarios } from "@/lib/data/weather-scenarios";

interface WeatherModeContextType {
  weatherMode: WeatherModeState;
  setMode: (mode: WeatherMode) => void;
  setScenario: (scenario: WeatherScenario) => void;
  overrides: WeatherOverride[];
  toggleRainOverride: (date: string) => void;
  clearOverrides: () => void;
  getEffectiveDays: () => WeatherDay[];
}

const WeatherModeContext = createContext<WeatherModeContextType | null>(null);

export function WeatherModeProvider({ children }: { children: ReactNode }) {
  const [weatherMode, setWeatherMode] = useState<WeatherModeState>({
    mode: "demo",
    scenario: "mid_rain",
  });
  const [overrides, setOverrides] = useState<WeatherOverride[]>([]);

  const setMode = (mode: WeatherMode) =>
    setWeatherMode((prev) => ({ ...prev, mode }));

  const setScenario = (scenario: WeatherScenario) => {
    setWeatherMode((prev) => ({ ...prev, scenario }));
    setOverrides([]);
  };

  const toggleRainOverride = useCallback((date: string) => {
    setOverrides((prev) => {
      const existing = prev.find((o) => o.date === date);
      if (existing) return prev.filter((o) => o.date !== date);
      return [...prev, { date, weather: "rainy" as const }];
    });
  }, []);

  const clearOverrides = useCallback(() => setOverrides([]), []);

  const getEffectiveDays = useCallback((): WeatherDay[] => {
    const base = weatherScenarios[weatherMode.scenario];
    if (!base) return [];
    return base.days.map((day) => {
      const override = overrides.find((o) => o.date === day.date);
      if (!override) return day;
      return {
        ...day,
        weather: override.weather,
        canWork: false,
        precipitation: 15,
      };
    });
  }, [weatherMode.scenario, overrides]);

  return (
    <WeatherModeContext.Provider
      value={{
        weatherMode,
        setMode,
        setScenario,
        overrides,
        toggleRainOverride,
        clearOverrides,
        getEffectiveDays,
      }}
    >
      {children}
    </WeatherModeContext.Provider>
  );
}

export function useWeatherMode() {
  const context = useContext(WeatherModeContext);
  if (!context) throw new Error("useWeatherMode must be used within WeatherModeProvider");
  return context;
}
