import request from "supertest";
import app from "../app";

import { getForecast } from "../services/forecastService";
import { geocode } from "../services/geocodeService";
import type { WeatherData } from "../types";

jest.mock("../services/forecastService");
jest.mock("../services/geocodeService");

const mockedGetForecast = getForecast as jest.MockedFunction<
  typeof getForecast
>;
const mockedGeocode = geocode as jest.MockedFunction<typeof geocode>;

describe("GET /api/forecast", () => {
  beforeEach(() => {
    mockedGetForecast.mockReset();
  });

  it("returns 400 if lat or lon is invalid", async () => {
    const res = await request(app)
      .get("/api/forecast?lat=foo&lon=bar")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body).toEqual({ error: "Invalid or missing `lat`/`lon`" });
  });

  it("calls getForecast and returns its data", async () => {
    const fakeData: WeatherData = {
      locationName: "Test City",
      current: { temp: 12, humidity: 55, wind_speed: 3 },
      daily: [],
      alerts: [],
    };

    mockedGetForecast.mockResolvedValueOnce(fakeData);

    const lat = 41.9,
      lon = 12.5;
    const res = await request(app)
      .get(`/api/forecast?lat=${lat}&lon=${lon}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(mockedGetForecast).toHaveBeenCalledWith(lat, lon);
    expect(res.body).toEqual(fakeData);
  });
});

describe("GET /api/geocode", () => {
  beforeEach(() => {
    mockedGeocode.mockReset();
  });

  it("returns 400 when q is missing or empty", async () => {
    await request(app)
      .get("/api/geocode")
      .expect(400)
      .expect({ error: "Missing `q` query parameter" });

    await request(app)
      .get("/api/geocode?q=   ")
      .expect(400)
      .expect({ error: "Missing `q` query parameter" });
  });

  it("calls geocode and returns suggestions", async () => {
    const fakeSuggestions = [
      { id: "rome-italy", name: "Rome, Italy", lat: 41.9, lon: 12.5 },
    ];
    mockedGeocode.mockResolvedValueOnce(fakeSuggestions);

    const q = "Rome";
    const res = await request(app)
      .get(`/api/geocode?q=${encodeURIComponent(q)}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(mockedGeocode).toHaveBeenCalledWith(q);
    expect(res.body).toEqual(fakeSuggestions);
  });
});
