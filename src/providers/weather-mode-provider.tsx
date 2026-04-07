"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
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
  isLoadingReal: boolean;
}

const WeatherModeContext = createContext<WeatherModeContextType | null>(null);

export function WeatherModeProvider({ children }: { children: ReactNode }) {
  const [weatherMode, setWeatherMode] = useState<WeatherModeState>({
    mode: "real",
    scenario: "mid_rain",
  });
  const [overrides, setOverrides] = useState<WeatherOverride[]>([]);
  const [realDays, setRealDays] = useState<WeatherDay[] | null>(null);
  const [isLoadingReal, setIsLoadingReal] = useState(false);

  // Fetch real weather data when switching to real mode
  useEffect(() => {
    if (weatherMode.mode === "real" && !realDays) {
      setIsLoadingReal(true);
      fetch("/api/weather?mode=real")
        .then((res) => res.json())
        .then((data) => {
          if (data.days && Array.isArray(data.days)) {
            setRealDays(data.days);
          }
        })
        .catch(() => {
          // Fallback to demo on error
          setRealDays(null);
        })
        .finally(() => setIsLoadingReal(false));
    }
  }, [weatherMode.mode, realDays]);

  const setMode = (mode: WeatherMode) => {
    setWeatherMode((prev) => ({ ...prev, mode }));
    setOverrides([]);
  };

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
    // Use real data when in real mode and data is available
    let baseDays: WeatherDay[];
    if (weatherMode.mode === "real" && realDays) {
      baseDays = realDays;
    } else {
      const base = weatherScenarios[weatherMode.scenario];
      if (!base) return [];
      baseDays = base.days;
    }

    return baseDays.map((day) => {
      const override = overrides.find((o) => o.date === day.date);
      if (!override) return day;
      return {
        ...day,
        weather: override.weather,
        canWork: false,
        precipitation: 15,
      };
    });
  }, [weatherMode.mode, weatherMode.scenario, realDays, overrides]);

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
        isLoadingReal,
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
