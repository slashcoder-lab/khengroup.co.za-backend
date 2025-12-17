import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { EventEmitter } from "events";

// Increase max listeners globally
EventEmitter.defaultMaxListeners = 20;

// Routes
import membersRouter from "./routes/members.js";
import callbacksRouter from "./routes/callbacks.js";

// Models
import Visitor from "./models/visitor.js";
import Traffic from "./models/traffic.js";
import Member from "./models/member.js";
import Callback from "./models/callback.js";

dotenv.config();

// -------------------- INIT APP --------------------
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- SECURITY --------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// -------------------- RATE LIMITER --------------------
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

// -------------------- BODY PARSER --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- CORS --------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://127.0.0.1:5500",
  "https://khengroup.co.za",
  "https://www.khengroup.co.za",
];

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS blocked: " + origin), false),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// -------------------- DATABASE --------------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// -------------------- VISITOR TRACKING --------------------
app.use(async (req, res, next) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const isPageView =
      req.method === "GET" &&
      !req.path.startsWith("/api") &&
      !req.path.startsWith("/members") &&
      !req.path.includes(".");

    if (isPageView) {
      await Visitor.create({
        ip,
        path: req.path,
        userAgent: req.headers["user-agent"] || "",
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Traffic.findOneAndUpdate(
        { date: today },
        { $inc: { visits: 1 } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("Visitor tracking error:", err.message);
  }
  next();
});

// -------------------- ROUTES --------------------
app.use("/api/callbacks", callbacksRouter);
app.use("/members", membersRouter);

// -------------------- DASHBOARD APIs --------------------
// Members stats
app.get("/api/members/stats", async (req, res) => {
  try {
    const count = await Member.countDocuments();
    const latest = await Member.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName createdAt");

    const monthly = await Member.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      count,
      latest: latest.map(
        (m) => `${m.fullName} — ${new Date(m.createdAt).toLocaleDateString()}`
      ),
      monthly: {
        labels: monthly.map((m) => `Month ${m._id.month}/${m._id.year}`),
        data: monthly.map((m) => m.count),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Traffic last 7 days
app.get("/api/traffic/week", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    const records = await Traffic.find({
      date: { $gte: last7Days[0] },
    }).lean();

    const map = {};
    records.forEach((r) => {
      map[new Date(r.date).toDateString()] = r.visits;
    });

    const weekly = {
      labels: last7Days.map((d) => d.toLocaleDateString()),
      data: last7Days.map((d) => map[d.toDateString()] || 0),
    };

    res.json({
      success: true,
      count: weekly.data.reduce((a, b) => a + b, 0),
      weekly,
    });
  } catch (err) {
    console.error("Traffic error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Callbacks stats
app.get("/api/callbacks/stats", async (req, res) => {
  try {
    const count = await Callback.countDocuments();
    const latest = await Callback.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name phone");

    res.json({
      success: true,
      count,
      latest: latest.map((c) => `${c.name} — ${c.phone}`),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------- STATIC FILES --------------------
app.use(express.static(path.join(__dirname, "public"))); // images, CSS, JS

// -------------------- INTRO PAGE --------------------
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "intro.html"));
});

// -------------------- CATCH-ALL FALLBACK --------------------
// Any other route goes to index.html (home page)
app.use("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------- GLOBAL ERROR HANDLER --------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, message: err.message });
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
