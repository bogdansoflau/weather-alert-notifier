import { Request, Response, NextFunction } from "express";
import { getForecast } from "../services/forecastService";

export async function forecastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: "Invalid or missing `lat`/`lon`" });
    return;
  }

  try {
    const data = await getForecast(lat, lon);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
