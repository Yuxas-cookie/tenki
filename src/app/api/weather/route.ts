import { NextRequest } from "next/server";
import { weatherScenarios } from "@/lib/data/weather-scenarios";
import { WeatherScenario, WeatherType } from "@/lib/types";

function wmoToWeather(code: number): WeatherType {
  if (code <= 1) return "sunny";
  if (code <= 48) return "cloudy";
  if (code <= 61) return "rainy";
  if (code <= 67) return "heavy_rain";
  if (code <= 77) return "cloudy";
  if (code <= 82) return "heavy_rain";
  if (code >= 95) return "storm";
  return "cloudy";
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const mode = sp.get("mode") || "demo";
  const scenario = (sp.get("scenario") || "mid_rain") as WeatherScenario;

  if (mode === "demo") return Response.json(weatherScenarios[scenario] || weatherScenarios.mid_rain);

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=34.5198&longitude=135.4405&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia%2FTokyo&forecast_days=16`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const d = data.daily;
    const days = d.time.map((date: string, i: number) => {
      const w = wmoToWeather(d.weather_code[i]);
      const tMax = Math.round(d.temperature_2m_max[i]);
      const hum = Math.round(d.relative_humidity_2m_max[i]);
      return { date, weather: w, tempMax: tMax, tempMin: Math.round(d.temperature_2m_min[i]), humidity: hum, windSpeed: Math.round(d.wind_speed_10m_max[i] / 3.6 * 10) / 10, precipitation: Math.round(d.precipitation_sum[i] * 10) / 10, canWork: tMax >= 5 && hum < 85 && !["rainy", "heavy_rain", "storm"].includes(w) };
    });
    return Response.json({ location: "大阪府高石市", days, fetchedAt: new Date().toISOString(), isDemo: false });
  } catch {
    return Response.json({ ...weatherScenarios[scenario], _warning: "Using demo data" });
  }
}
