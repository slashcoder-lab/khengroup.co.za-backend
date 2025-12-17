import mongoose from "mongoose";

// -------------------- BENEFICIARY (EMBEDDED) --------------------
const BeneficiarySchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    surname: { type: String, trim: true, default: "" },
    idNumber: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    contact: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// -------------------- HOUSEHOLD MEMBER (EMBEDDED) --------------------
const HouseholdSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    surname: { type: String, trim: true, default: "" },
    idNumber: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// -------------------- MAIN MEMBER SCHEMA --------------------
const MemberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, trim: true, minlength: 13, maxlength: 13 },
    maritalStatus: { type: String, default: "" },

    street: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },

    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },

    beneficiary: { type: BeneficiarySchema, default: () => ({}) },

    householdMembers: { type: [HouseholdSchema], default: () => [] },

    packageSelected: { type: String, required: true, enum: ["KGS1", "KGS2", "KGS3"] },

    documentPath: { type: String, default: "" },

    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

// -------------------- EXPORT MODEL --------------------
const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema);
export default Member;
