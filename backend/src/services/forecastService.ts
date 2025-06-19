import axios from "axios";
import { cache } from "../utils/cache";
import type { WeatherData, AlertItem } from "../types";

const BASE = "https://api.open-meteo.com/v1/forecast";

const weatherCodeMap: Record<number, { desc: string; icon: string }> = {
  0: { desc: "clear sky", icon: "clear_day" },
  1: { desc: "mainly clear", icon: "mostly_clear" },
  2: { desc: "partly cloudy", icon: "partly_cloudy" },
  3: { desc: "overcast", icon: "cloudy" },
  45: { desc: "fog", icon: "fog" },
  48: { desc: "depositing rime fog", icon: "fog" },
  51: { desc: "light drizzle", icon: "drizzle" },
  53: { desc: "moderate drizzle", icon: "drizzle" },
  55: { desc: "dense drizzle", icon: "drizzle" },
  61: { desc: "slight rain", icon: "rain" },
  63: { desc: "moderate rain", icon: "rain" },
  65: { desc: "heavy rain", icon: "rain" },
  71: { desc: "slight snow", icon: "snow" },
  73: { desc: "moderate snow", icon: "snow" },
  75: { desc: "heavy snow", icon: "snow" },
  80: { desc: "rain showers", icon: "showers" },
  95: { desc: "thunderstorm", icon: "thunder" },
  99: { desc: "hail thunderstorm", icon: "hail" },
};

interface DailyRow {
  dt: number;
  temp: { max: number; min: number };
  weather: { description: string; icon: string }[];
  pop: number; // precipitation-probability %
  wind_speed: number;
}

export async function getForecast(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const key = `om:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  const cached = cache.get<WeatherData>(key);
  if (cached) return cached;

  const { data } = await axios.get(BASE, {
    params: {
      latitude: lat,
      longitude: lon,
      current_weather: true,
      daily:
        "temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max",
      timezone: "auto",
    },
  });

  const daily: DailyRow[] = data.daily.time.map(
    (_: string, i: number): DailyRow => ({
      dt: new Date(data.daily.time[i]).getTime() / 1000,
      temp: {
        max: data.daily.temperature_2m_max[i],
        min: data.daily.temperature_2m_min[i],
      },
      weather: [
        {
          description:
            weatherCodeMap[data.daily.weathercode[i]]?.desc ?? "unknown",
          icon: weatherCodeMap[data.daily.weathercode[i]]?.icon ?? "unknown",
        },
      ],
      pop: data.daily.precipitation_probability_max[i],
      wind_speed: data.daily.windspeed_10m_max[i],
    })
  );

  const alerts: AlertItem[] = [];
  daily.forEach((d) => {
    const dateStr = new Date(d.dt * 1000).toLocaleDateString(undefined, {
      weekday: "long",
    });

    if (d.pop >= 70) {
      alerts.push({
        id: `${d.dt}-rain`,
        title: "Heavy rain likely",
        message: `${dateStr}: Chance of rain ~${d.pop}%`,
      });
    }
    if (d.wind_speed >= 15) {
      alerts.push({
        id: `${d.dt}-wind`,
        title: "Strong wind",
        message: `${dateStr}: Gusts up to ${d.wind_speed} m/s`,
      });
    }
    if (d.temp.max >= 32) {
      alerts.push({
        id: `${d.dt}-heat`,
        title: "High temperature",
        message: `${dateStr}: High of ${d.temp.max} °C`,
      });
    }
  });

  const result: WeatherData = {
    locationName: data.timezone,
    current: {
      temp: data.current_weather.temperature,
      humidity: data.current_weather.relativehumidity ?? 0,
      wind_speed: data.current_weather.windspeed,
    },
    daily: daily.map((d) => ({
      dt: d.dt,
      temp: d.temp,
      weather: d.weather,
    })),
    alerts,
  };

  cache.set(key, result);
  return result;
}
