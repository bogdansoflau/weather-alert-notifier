import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  comparePassword(candidate: string): Promise<boolean>;

  savedLocations: SavedLocation[];
}

const SavedLocationSchema = new Schema<SavedLocation>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    savedLocations: {
      type: [SavedLocationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain text password with hash
userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
