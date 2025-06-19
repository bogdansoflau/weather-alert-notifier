import { Router } from "express";
import {
  getSavedLocations,
  addSavedLocation,
  removeSavedLocation,
} from "../controllers/savedLocationsController";

const router = Router({ mergeParams: true });

router.get("/", getSavedLocations);
router.post("/", addSavedLocation);
router.delete("/:locId", removeSavedLocation);

export default router;
