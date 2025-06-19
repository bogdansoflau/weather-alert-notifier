export interface Suggestion {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temp: number;
  humidity: number;
  wind_speed: number;
}

export interface DailyWeather {
  dt: number;
  temp: { max: number; min: number };
  weather: { description: string; icon: string }[];
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
}

export interface WeatherData {
  locationName: string;
  current: CurrentWeather;
  daily: DailyWeather[];
  alerts?: AlertItem[];
}

export interface HistoryItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
