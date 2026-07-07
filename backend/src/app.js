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
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Core middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : "*",
  })
);
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

app.get("/", (req, res) => {
  res.json({ message: "TrustComply API is running" });
});

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
