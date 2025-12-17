import mongoose from "mongoose";

const VisitorSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    path: { type: String, required: true },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

const Visitor =
  mongoose.models.Visitor || mongoose.model("Visitor", VisitorSchema);

export default Visitor;
