import mongoose from "mongoose";

const CallbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" },
    adminNote: { type: String, default: "" }
  },
  { timestamps: true }
);

const Callback = mongoose.models.Callback || mongoose.model("Callback", CallbackSchema);
export default Callback;
