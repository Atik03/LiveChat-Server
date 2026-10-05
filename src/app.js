const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const profileRoutes = require("./routes/profile.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "LiveChat API is running",
  });
});

/* =========================================
   API ROUTES
========================================= */

app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);

/* =========================================
   404 HANDLER
========================================= */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

/* =========================================
   GLOBAL ERROR HANDLER
========================================= */

app.use((error, req, res, next) => {
  console.error("Global API error:", error);

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

module.exports = app;
