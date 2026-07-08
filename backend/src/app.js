const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const filingRoutes = require("./routes/filing.routes");
const directorRoutes = require("./routes/director.routes");
const registerCheckRoutes = require("./routes/registerCheck.routes");
const payrollRoutes = require("./routes/payroll.routes");
const medicalRoutes = require("./routes/medical.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Core middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Allow: no-origin (curl/mobile), any configured CLIENT_ORIGIN, and any
// localhost/127.0.0.1 origin (for local dev against this server). JWT lives in a
// header (not cookies), so this is safe.
const corsOrigin = (origin, cb) => {
  if (!origin) return cb(null, true);
  if (allowedOrigins.includes(origin)) return cb(null, true);
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
  if (allowedOrigins.length === 0) return cb(null, true); // nothing configured → open
  return cb(new Error(`CORS: origin ${origin} not allowed`));
};

app.use(cors({ origin: corsOrigin }));
// Documents are uploaded inline as data URIs, so allow a generous JSON body size.
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/filings", filingRoutes);
app.use("/api/directors", directorRoutes);
app.use("/api/register-checks", registerCheckRoutes);
app.use("/api/payroll-sync", payrollRoutes);
app.use("/api/medical", medicalRoutes);

app.get("/", (req, res) => {
  res.json({ message: "TrustComply API is running" });
});

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
