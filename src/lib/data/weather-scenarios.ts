import { WeatherDay, WeatherForecast, WeatherScenario } from "@/lib/types";

function generateDays(startDate: string, patterns: Array<{ weather: WeatherDay["weather"]; tempMax: number; tempMin: number; humidity: number; windSpeed: number; precipitation: number }>): WeatherDay[] {
  return patterns.map((p, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const canWork =
      p.tempMax >= 5 &&
      p.humidity < 85 &&
      p.weather !== "rainy" &&
      p.weather !== "heavy_rain" &&
      p.weather !== "storm";
    return {
      date: date.toISOString().split("T")[0],
      weather: p.weather,
      tempMax: p.tempMax,
      tempMin: p.tempMin,
      humidity: p.humidity,
      windSpeed: p.windSpeed,
      precipitation: p.precipitation,
      canWork,
    };
  });
}

const today = "2026-04-08";

const sunnyPatterns: Array<{ weather: WeatherDay["weather"]; tempMax: number; tempMin: number; humidity: number; windSpeed: number; precipitation: number }> = [
  { weather: "sunny", tempMax: 18, tempMin: 10, humidity: 45, windSpeed: 3, precipitation: 0 },
  { weather: "sunny", tempMax: 20, tempMin: 11, humidity: 42, windSpeed: 2, precipitation: 0 },
  { weather: "cloudy", tempMax: 17, tempMin: 9, humidity: 55, windSpeed: 4, precipitation: 0 },
  { weather: "sunny", tempMax: 21, tempMin: 12, humidity: 40, windSpeed: 2, precipitation: 0 },
  { weather: "sunny", tempMax: 22, tempMin: 13, humidity: 38, windSpeed: 3, precipitation: 0 },
  { weather: "cloudy", tempMax: 19, tempMin: 11, humidity: 50, windSpeed: 3, precipitation: 0 },
  { weather: "sunny", tempMax: 23, tempMin: 14, humidity: 35, windSpeed: 2, precipitation: 0 },
  { weather: "sunny", tempMax: 21, tempMin: 12, humidity: 42, windSpeed: 3, precipitation: 0 },
  { weather: "sunny", tempMax: 20, tempMin: 11, humidity: 44, windSpeed: 2, precipitation: 0 },
  { weather: "cloudy", tempMax: 18, tempMin: 10, humidity: 52, windSpeed: 4, precipitation: 0 },
  { weather: "sunny", tempMax: 22, tempMin: 13, humidity: 38, windSpeed: 2, precipitation: 0 },
  { weather: "sunny", tempMax: 24, tempMin: 14, humidity: 35, windSpeed: 3, precipitation: 0 },
  { weather: "sunny", tempMax: 23, tempMin: 13, humidity: 40, windSpeed: 2, precipitation: 0 },
  { weather: "sunny", tempMax: 21, tempMin: 12, humidity: 43, windSpeed: 3, precipitation: 0 },
  { weather: "cloudy", tempMax: 19, tempMin: 10, humidity: 55, windSpeed: 4, precipitation: 0 },
  { weather: "sunny", tempMax: 22, tempMin: 13, humidity: 40, windSpeed: 2, precipitation: 0 },
];

const midRainPatterns: Array<{ weather: WeatherDay["weather"]; tempMax: number; tempMin: number; humidity: number; windSpeed: number; precipitation: number }> = [
  { weather: "sunny", tempMax: 18, tempMin: 10, humidity: 45, windSpeed: 3, precipitation: 0 },
  { weather: "sunny", tempMax: 20, tempMin: 11, humidity: 42, windSpeed: 2, precipitation: 0 },
  { weather: "cloudy", tempMax: 17, tempMin: 9, humidity: 65, windSpeed: 4, precipitation: 0 },
  { weather: "sunny", tempMax: 19, tempMin: 10, humidity: 48, windSpeed: 3, precipitation: 0 },
  { weather: "cloudy", tempMax: 16, tempMin: 9, humidity: 72, windSpeed: 5, precipitation: 0 },
  { weather: "rainy", tempMax: 14, tempMin: 10, humidity: 88, windSpeed: 6, precipitation: 15 },
  { weather: "rainy", tempMax: 13, tempMin: 9, humidity: 92, windSpeed: 7, precipitation: 22 },
  { weather: "heavy_rain", tempMax: 12, tempMin: 8, humidity: 95, windSpeed: 8, precipitation: 35 },
  { weather: "cloudy", tempMax: 15, tempMin: 9, humidity: 78, windSpeed: 5, precipitation: 2 },
  { weather: "sunny", tempMax: 18, tempMin: 10, humidity: 55, windSpeed: 3, precipitation: 0 },
  { weather: "sunny", tempMax: 20, tempMin: 11, humidity: 45, windSpeed: 2, precipitation: 0 },
  { weather: "sunny", tempMax: 22, tempMin: 13, humidity: 40, windSpeed: 2, precipitation: 0 },
  { weather: "sunny", tempMax: 21, tempMin: 12, humidity: 42, windSpeed: 3, precipitation: 0 },
  { weather: "cloudy", tempMax: 18, tempMin: 10, humidity: 55, windSpeed: 4, precipitation: 0 },
  { weather: "sunny", tempMax: 20, tempMin: 11, humidity: 44, windSpeed: 2, precipitation: 0 },
  { weather: "sunny", tempMax: 22, tempMin: 13, humidity: 38, windSpeed: 3, precipitation: 0 },
];

const rainySeasonPatterns: Array<{ weather: WeatherDay["weather"]; tempMax: number; tempMin: number; humidity: number; windSpeed: number; precipitation: number }> = [
  { weather: "cloudy", tempMax: 16, tempMin: 10, humidity: 72, windSpeed: 4, precipitation: 0 },
  { weather: "rainy", tempMax: 14, tempMin: 10, humidity: 88, windSpeed: 5, precipitation: 12 },
  { weather: "rainy", tempMax: 13, tempMin: 9, humidity: 92, windSpeed: 6, precipitation: 18 },
  { weather: "cloudy", tempMax: 15, tempMin: 10, humidity: 80, windSpeed: 4, precipitation: 3 },
  { weather: "sunny", tempMax: 18, tempMin: 11, humidity: 60, windSpeed: 3, precipitation: 0 },
  { weather: "rainy", tempMax: 14, tempMin: 10, humidity: 90, windSpeed: 6, precipitation: 20 },
  { weather: "heavy_rain", tempMax: 12, tempMin: 8, humidity: 95, windSpeed: 8, precipitation: 40 },
  { weather: "rainy", tempMax: 13, tempMin: 9, humidity: 93, windSpeed: 7, precipitation: 25 },
  { weather: "cloudy", tempMax: 16, tempMin: 10, humidity: 78, windSpeed: 5, precipitation: 2 },
  { weather: "rainy", tempMax: 14, tempMin: 9, humidity: 88, windSpeed: 6, precipitation: 15 },
  { weather: "cloudy", tempMax: 17, tempMin: 11, humidity: 70, windSpeed: 4, precipitation: 0 },
  { weather: "sunny", tempMax: 20, tempMin: 12, humidity: 55, windSpeed: 3, precipitation: 0 },
  { weather: "rainy", tempMax: 15, tempMin: 10, humidity: 85, windSpeed: 5, precipitation: 10 },
  { weather: "rainy", tempMax: 13, tempMin: 9, humidity: 90, windSpeed: 6, precipitation: 18 },
  { weather: "cloudy", tempMax: 16, tempMin: 10, humidity: 75, windSpeed: 4, precipitation: 0 },
  { weather: "sunny", tempMax: 19, tempMin: 11, humidity: 58, windSpeed: 3, precipitation: 0 },
];

export const weatherScenarios: Record<WeatherScenario, WeatherForecast> = {
  sunny: {
    location: "大阪府高石市",
    days: generateDays(today, sunnyPatterns),
    fetchedAt: new Date().toISOString(),
    isDemo: true,
  },
  mid_rain: {
    location: "大阪府高石市",
    days: generateDays(today, midRainPatterns),
    fetchedAt: new Date().toISOString(),
    isDemo: true,
  },
  rainy_season: {
    location: "大阪府高石市",
    days: generateDays(today, rainySeasonPatterns),
    fetchedAt: new Date().toISOString(),
    isDemo: true,
  },
};

export const scenarioLabels: Record<WeatherScenario, { name: string; description: string }> = {
  sunny: { name: "順調", description: "2週間ほぼ晴れ続き。最短工期で完了" },
  mid_rain: { name: "途中で雨", description: "5日目から3日間の雨。AIが工程を組み替え" },
  rainy_season: { name: "梅雨パターン", description: "断続的に雨。大幅なリスケが必要" },
};
