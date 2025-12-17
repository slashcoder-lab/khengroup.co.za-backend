import express from "express";
import { Traffic } from "../models/traffic.js";

const router = express.Router();

// -------------------- GET WEEKLY TRAFFIC --------------------
// GET /api/traffic/week
router.get("/week", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate last 7 days (oldest → newest)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    // Fetch traffic records
    const records = await Traffic.find({
      date: { $gte: last7Days[0] },
    }).lean();

    // Create a fast lookup map
    const trafficMap = {};
    records.forEach(r => {
      trafficMap[new Date(r.date).toDateString()] = r.visits;
    });

    const weeklyData = {
      labels: last7Days.map(d => d.toLocaleDateString()),
      data: last7Days.map(d => trafficMap[d.toDateString()] || 0),
    };

    const totalVisits = weeklyData.data.reduce((sum, v) => sum + v, 0);

    res.json({
      success: true,
      count: totalVisits,
      weekly: weeklyData,
    });
  } catch (err) {
    console.error("❌ Error fetching weekly traffic:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
