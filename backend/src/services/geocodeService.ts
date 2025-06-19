import axios from "axios";
import { cache } from "../utils/cache";

export interface Suggestion {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN!;
const BASE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export async function geocode(query: string): Promise<Suggestion[]> {
  const key = `geo:${query.toLowerCase()}`;
  const fromCache = cache.get<Suggestion[]>(key);
  if (fromCache) return fromCache;

  const url = `${BASE_URL}/${encodeURIComponent(query)}.json`;
  const resp = await axios.get(url, {
    params: {
      access_token: MAPBOX_TOKEN,
      limit: 5,
      types: "place",
    },
  });

  const suggestions: Suggestion[] = resp.data.features.map((f: any) => ({
    id: f.id,
    name: f.place_name,
    lat: f.center[1],
    lon: f.center[0],
  }));

  cache.set(key, suggestions);
  return suggestions;
}
