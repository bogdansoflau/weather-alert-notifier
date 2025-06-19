import axios from "axios";
import type { Suggestion, WeatherData } from "../types/index.ts";

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

export async function fetchSavedLocations(
  userId: string
): Promise<Suggestion[]> {
  try {
    const r = await axios.get<Suggestion[]>(
      `${API_BASE}/api/users/${userId}/saved-locations`
    );
    return Array.isArray(r.data) ? r.data : [];
  } catch (e) {
    console.error("fetchSavedLocations failed", e);
    return []; // fallback to empty array
  }
}

export async function addSavedLocation(
  userId: string,
  loc: Suggestion
): Promise<Suggestion[]> {
  try {
    const r = await axios.post<Suggestion[]>(
      `${API_BASE}/api/users/${userId}/saved-locations`,
      loc
    );
    return Array.isArray(r.data) ? r.data : [];
  } catch (e) {
    console.error("addSavedLocation failed", e);
    return [];
  }
}

export async function removeSavedLocation(
  userId: string,
  locId: string
): Promise<Suggestion[]> {
  try {
    const r = await axios.delete<Suggestion[]>(
      `${API_BASE}/api/users/${userId}/saved-locations/${locId}`
    );
    return Array.isArray(r.data) ? r.data : [];
  } catch (e) {
    console.error("removeSavedLocation failed", e);
    return [];
  }
}
