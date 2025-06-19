import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { debounce } from "lodash";
import { Search, User as UserIcon } from "lucide-react";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
} from "lucide-react";

import type { User, Suggestion, HistoryItem, WeatherData } from "../types";
import {
  fetchSuggestions,
  fetchForecast,
  fetchUserHistory,
  saveSearch,
} from "../services/weatherService";
import axios from "axios";

export default function MainPage() {
  // —── get routing state
  const location = useLocation();
  const state = location.state as
    | { user: User; lat?: number; lon?: number; name?: string }
    | undefined;
  const user = state?.user;

  // —── hooks (always unconditional)
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Suggestion | null>(
    null
  );
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const alerts = weatherData?.alerts ?? [];

  const debouncedFetch = useRef(
    debounce(async (q: string) => {
      if (q.length < 2) return setSuggestions([]);
      try {
        setSuggestions(await fetchSuggestions(q));
      } catch (e) {
        console.error(e);
      }
    }, 250)
  ).current;

  // —── fetch history when we have a user
  useEffect(() => {
    if (!user) return;
    fetchUserHistory(user.id).then(setHistory).catch(console.error);
  }, [user]);

  // —── deep-linking from history state
  useEffect(() => {
    if (!user) return;
    if (state?.lat && state.lon) {
      const loc: Suggestion = {
        id: state.name || "",
        name: state.name || "",
        lat: state.lat,
        lon: state.lon,
      };
      setSelectedLocation(loc);
      setCityQuery(loc.name);
      handleSearch(loc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, state]);

  // —── handlers
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setCityQuery(q);
    setShowSuggestions(true);
    debouncedFetch(q);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    setCityQuery(s.name);
    setSelectedLocation(s);
    setShowSuggestions(false);
  };

  const handleSearch = async (locArg?: Suggestion) => {
    const loc = locArg || selectedLocation;
    if (!loc || !user) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchForecast(loc.lat, loc.lon);
      setWeatherData(data);
      await saveSearch(user.id, loc);
      setHistory((prev) =>
        [loc, ...prev.filter((h) => h.id !== loc.id)].slice(0, 10)
      );
    } catch (err: unknown) {
      // 1) Axios errors often carry a response.data.message
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string })?.message ||
          err.message ||
          "Search failed. Please try again.";
        setError(msg);

        // 2) Plain JS Errors
      } else if (err instanceof Error) {
        setError(err.message);

        // 3) Fallback for anything else
      } else {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // —── icon mapping
  const iconMap: Record<string, React.ElementType> = {
    clear_day: Sun,
    mostly_clear: CloudSun,
    partly_cloudy: CloudSun,
    cloudy: Cloud,
    fog: CloudFog,
    drizzle: CloudDrizzle,
    rain: CloudRain,
    showers: CloudRain,
    snow: CloudSnow,
    thunder: CloudLightning,
    hail: CloudLightning,
  };

  const IconFor = (token: string) => {
    const Comp = iconMap[token] ?? Cloud;
    return <Comp className="w-8 h-8 mx-auto my-2 text-sky-600" />;
  };

  // —── now bail early if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-800">
        No user data found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-white text-gray-800">
      <header className="max-w-4xl mx-auto flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold flex items-center">
          <span role="img" aria-label="logo" className="mr-1">
            🌥
          </span>
          Weather Notify
        </h1>

        <div className="relative w-full max-w-md mx-4">
          <div className="flex items-center bg-white shadow rounded-full pl-4 pr-2 h-10">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              className="flex-grow py-2 px-2 rounded-r-full outline-none h-full"
              placeholder="Search city…"
              value={cityQuery}
              onChange={handleCityChange}
              onFocus={() => setShowSuggestions(true)}
            />
            <button
              onClick={() => handleSearch()}
              className="px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-full h-8 w-12 flex items-center justify-center"
            >
              Go
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 w-full bg-white shadow-lg rounded-lg mt-1 overflow-auto max-h-60">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  className="px-4 py-2 hover:bg-sky-100 cursor-pointer"
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="p-2 hover:bg-sky-300 rounded-full"
          onClick={() => setShowProfileMenu((s) => !s)}
        >
          <UserIcon className="w-6 h-6" />
        </button>

        {showProfileMenu && (
          <div className="absolute right-6 top-20 w-60 bg-white shadow rounded-lg p-4 z-30">
            <div className="border-b pb-2 mb-2">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <p className="text-xs uppercase text-sky-600 mb-1">Recent</p>
            <ul className="space-y-1">
              {history.map((item) => (
                <Link
                  key={item.id}
                  to="/"
                  state={{
                    user,
                    lat: item.lat,
                    lon: item.lon,
                    name: item.name,
                  }}
                  className="block text-sm hover:text-sky-600"
                  onClick={() => setShowProfileMenu(false)}
                >
                  {item.name}
                </Link>
              ))}
            </ul>
          </div>
        )}
      </header>

      {loading && <p className="text-center text-gray-600 mt-6">⏳ Loading…</p>}
      {error && <p className="text-center text-red-600 mt-6">⚠️ {error}</p>}

      {weatherData && (
        <div className="max-w-4xl mx-auto px-6">
          <section className="bg-white shadow rounded-xl flex justify-around py-4 mt-8">
            <div className="text-center">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-3xl font-semibold">
                {weatherData.current.temp}°C
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Humidity</p>
              <p className="text-xl">💧 {weatherData.current.humidity}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Wind</p>
              <p className="text-xl">💨 {weatherData.current.wind_speed} m/s</p>
            </div>
          </section>

          <section className="mt-8 overflow-x-auto">
            <div className="flex space-x-4 pb-2">
              {weatherData.daily.map((day) => (
                <div
                  key={day.dt}
                  className="min-w-[120px] bg-white shadow rounded-lg p-4 text-center"
                >
                  <p className="font-medium text-sm">
                    {new Date(day.dt * 1000).toLocaleDateString(undefined, {
                      weekday: "short",
                    })}
                  </p>
                  {IconFor(day.weather[0].icon)}
                  <p className="font-semibold">
                    {day.temp.max}° / {day.temp.min}°
                  </p>
                </div>
              ))}
            </div>
          </section>

          {alerts.length > 0 && (
            <section className="mt-10">
              <h2 className="flex items-center text-red-600 font-bold mb-2">
                ⚠️ Upcoming Alerts
              </h2>
              <ul className="space-y-2">
                {(showAllAlerts ? alerts : alerts.slice(0, 3)).map((a) => (
                  <li
                    key={a.id}
                    className="bg-red-100 border-l-4 border-red-500 p-3 rounded"
                  >
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm">{a.message}</p>
                  </li>
                ))}
              </ul>
              {alerts.length > 3 && (
                <button
                  onClick={() => setShowAllAlerts((s) => !s)}
                  className="mt-2 text-sm text-sky-600 underline"
                >
                  {showAllAlerts
                    ? "Hide extra alerts"
                    : `Show all ${alerts.length - 3} more`}
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
