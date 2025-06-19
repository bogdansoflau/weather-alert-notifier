import axios from "axios";
import type { Suggestion, WeatherData, HistoryItem } from "../types/index.ts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  const res = await axios.get<Suggestion[]>(`${API_BASE}/api/geocode`, {
    params: { q: query },
  });
  return res.data;
}

export async function fetchForecast(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const res = await axios.get<WeatherData>(`${API_BASE}/api/forecast`, {
    params: { lat, lon },
  });
  return res.data;
}

export async function fetchUserHistory(userId: string): Promise<HistoryItem[]> {
  const res = await axios.get<HistoryItem[]>(`${API_BASE}/api/history`, {
    params: { userId },
  });
  return res.data;
}

export async function saveSearch(
  userId: string,
  location: Suggestion
): Promise<void> {
  await axios.post(`${API_BASE}/api/history`, { userId, location });
}
