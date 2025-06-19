export interface Suggestion {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
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

export interface WeatherData {
  locationName: string;
  current: CurrentWeather;
  daily: DailyWeather[];
  alerts: AlertItem[];
}
