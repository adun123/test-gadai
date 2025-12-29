// backend/src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { generalLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const scanRoutes = require("./routes/scan");
const calculateRoutes = require("./routes/calculate");
const pawnDecisionRoutes = require("./routes/pawnDecision");

const app = express();

app.use(helmet());
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
  
app.use((req, res, next) => {
  console.log("CORS ORIGIN:", req.headers.origin);
  next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server, curl, postman
    if (!origin) return cb(null, true);

    // exact allow
    if (allowedOrigins.includes(origin)) return cb(null, true);

    // allow FE vercel domain (preview + prod)
    if (origin.endsWith(".vercel.app")) return cb(null, true);

    return cb(new Error("CORS BLOCKED: " + origin), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(generalLimiter);
app.get("/", (req, res) => {
  res.json({
    message: "Pegadaian Pricing Analytics API",
    version: "2.0.0",
    phase: "PoC",
    flow: "SCAN → FORM (editable) → TAKSIR HARGA (editable)",
    endpoints: {
      scan: {
        slik: "POST /api/scan/slik",
        salary_slip: "POST /api/scan/salary-slip",
        vehicle: "POST /api/scan/vehicle",
      },
      calculate: {
        pricing: "POST /api/calculate/pricing",
        pawn: "POST /api/calculate/pawn",
        full_assessment: "POST /api/calculate/full-assessment",
      },
      pawn_simulation: "/api/pawn-decision",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/scan", scanRoutes);
app.use("/api/calculate", calculateRoutes);
app.use("/api/pawn-decision", pawnDecisionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
