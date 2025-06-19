import { RequestHandler } from "express";
import { User, SavedLocation } from "../models/User";

export const getSavedLocations: RequestHandler<{ userId: string }> = async (
  req,
  res,
  next
) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user.savedLocations);
  } catch (err) {
    next(err);
  }
};

export const addSavedLocation: RequestHandler<
  { userId: string },
  unknown,
  SavedLocation
> = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const loc = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.savedLocations.length >= 5) {
      res.status(400).json({ error: "Max 5 saved locations" });
      return;
    }

    if (user.savedLocations.some((l) => l.id === loc.id)) {
      res.status(400).json({ error: "Location already saved" });
      return;
    }

    user.savedLocations.push(loc);
    await user.save();

    res.status(201).json(user.savedLocations);
  } catch (err) {
    next(err);
  }
};

export const removeSavedLocation: RequestHandler<{
  userId: string;
  locId: string;
}> = async (req, res, next) => {
  try {
    const { userId, locId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.savedLocations = user.savedLocations.filter((l) => l.id !== locId);
    await user.save();

    res.json(user.savedLocations);
  } catch (err) {
    next(err);
  }
};
