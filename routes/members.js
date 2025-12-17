import express from "express";
import multer from "multer";
import fs from "fs-extra";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import Member from "../models/member.js";
import path from "path";

const router = express.Router();

/* =========================================================
   MULTER CONFIG
========================================================= */
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* =========================================================
   HELPERS
========================================================= */
const parseHouseholdMembers = (body) => {
  const members = [];

  for (let i = 1; i <= 9; i++) {
    const value = body[`household${i}`];
    if (!value) continue;

    const parts = value.split(",").map(v => v.trim());
    if (parts.length !== 5) continue;

    const [fullName, surname, idNumber, province, relationship] = parts;

    members.push({
      fullName,
      surname,
      idNumber,
      province,
      relationship,
    });
  }

  return members;
};

/* =========================================================
   CREATE MEMBER (PUBLIC)
========================================================= */
router.post("/", upload.single("document"), async (req, res) => {
  let pdfPath = "";
  let uploadPath = req.file?.path || "";

  try {
    const body = req.body;

    if (
      !body.fullName ||
      !body.surname ||
      !body.idNumber ||
      !body.phone ||
      !body.package
    ) {
      if (uploadPath) await fs.remove(uploadPath);
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const householdMembers = parseHouseholdMembers(body);

    const member = await Member.create({
      fullName: body.fullName,
      surname: body.surname,
      idNumber: body.idNumber,
      maritalStatus: body.maritalStatus || "",
      street: body.street || "",
      city: body.city || "",
      province: body.province || "",
      phone: body.phone,
      email: body.email || "",
      beneficiary: {
        fullName: body.beneficiaryFullName || "",
        surname: body.beneficiarySurname || "",
        idNumber: body.beneficiaryIdNumber || "",
        relationship: body.beneficiaryRelationship || "",
        contact: body.beneficiaryContact || "",
      },
      householdMembers,
      packageSelected: body.package,
      documentPath: uploadPath,
      status: "Pending",
      adminNote: "",
    });

    /* ================= PDF ================= */
    pdfPath = path.join("uploads", `member-${member._id}.pdf`);
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(20).text("KHEN Grocery Scheme", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text("Membership Application", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(14).text("Member Details", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12)
      .text(`Name: ${member.fullName} ${member.surname}`)
      .text(`ID Number: ${member.idNumber}`)
      .text(`Phone: ${member.phone}`)
      .text(`Email: ${member.email || "N/A"}`)
      .text(`Package: ${member.packageSelected}`)
      .moveDown();

    if (householdMembers.length) {
      doc.fontSize(14).text("Household Members", { underline: true });
      doc.moveDown(0.5);

      householdMembers.forEach((m, i) => {
        doc.fontSize(12).text(
          `${i + 1}. ${m.fullName} ${m.surname} (${m.relationship})`
        );
      });
    }

    doc.end();
    await new Promise(resolve => stream.on("finish", resolve));

    /* ================= EMAIL ================= */
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASS) {
      const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASS,
        },
      });

      try {
        await transporter.sendMail({
          from: `"KHEN Website" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL || "info@khengroup.co.za",
          subject: "New Membership Application",
          text: "A new membership application has been submitted.",
          attachments: [{ filename: "application.pdf", path: pdfPath }],
        });
      } catch (e) {
        console.error("Email failed:", e.message);
      }
    }

    if (pdfPath) await fs.remove(pdfPath);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      memberId: member._id,
    });

  } catch (err) {
    console.error("Create member error:", err);

    if (pdfPath) await fs.remove(pdfPath);
    if (uploadPath) await fs.remove(uploadPath);

    res.status(500).json({
      success: false,
      message: "Application failed",
    });
  }
});

/* =========================================================
   UPDATE MEMBER (ADMIN)
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const allowed = ["Pending", "Approved", "Rejected"];

    if (status && !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote }),
      },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.json({ success: true, data: member });

  } catch (err) {
    console.error("Update member error:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

/* =========================================================
   GET MEMBERS (ADMIN)
========================================================= */
router.get("/", async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};

    const members = await Member.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (err) {
    console.error("Fetch members error:", err);
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
});

/* =========================================================
   GET SINGLE MEMBER (ADMIN)
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.json({ success: true, data: member });

  } catch (err) {
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
});

export default router;
