import express from "express";
import Callback from "../models/callback.js"; // default import

const router = express.Router();

// Create new callback
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: "Required fields missing" });

    const newCallback = await Callback.create({ name, email, phone, message });
    res.status(201).json({ success: true, data: newCallback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all callbacks
router.get("/", async (req, res) => {
  try {
    const callbacks = await Callback.find().sort({ createdAt: -1 });
    res.json({ success: true, data: callbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
