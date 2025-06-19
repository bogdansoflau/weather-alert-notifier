import { Request, Response, NextFunction } from "express";
import { geocode } from "../services/geocodeService";

export function geocodeHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const q = ((req.query.q as string) ?? "").trim();
  if (!q) {
    res.status(400).json({ error: "Missing `q` query parameter" });
    return;
  }

  geocode(q)
    .then((suggestions) => res.json(suggestions))
    .catch(_next);
}
