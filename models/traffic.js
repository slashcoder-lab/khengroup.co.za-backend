import mongoose from "mongoose";

const TrafficSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    visits: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ DEFAULT EXPORT (VERY IMPORTANT)
const Traffic =
  mongoose.models.Traffic || mongoose.model("Traffic", TrafficSchema);

export default Traffic;
