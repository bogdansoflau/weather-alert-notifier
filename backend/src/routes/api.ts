import { Router } from "express";
import { geocodeHandler } from "../controllers/geocodeController";
import { forecastHandler } from "../controllers/forecastController";

const router = Router();

router.get("/geocode", geocodeHandler);
router.get("/forecast", forecastHandler);

export default router;
