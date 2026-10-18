import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

// Load environment variables
dotenv.config();

// Validate JWT Configuration (fails fast if secrets are missing)
import { validateJwtConfig } from "./config/jwt";
validateJwtConfig();

// Initialize Email Configuration
import "./config/email";
import { emailTransporter } from "./config/email";

import { helmetMiddleware } from "./config/helmet";
import { connectDB } from "./config/db";
import { initSocketServer } from "./socket/socketServer";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import teamRoutes from "./routes/team";
import hackathonRoutes from "./routes/hackathon";
import bookmarkRoutes from "./routes/bookmark";
import joinRequestRoutes from "./routes/joinRequest";
import notificationRoutes from "./routes/notification";
import assignmentRoutes from "./routes/assignment";
import aiMatchRoutes from "./routes/aiMatch";
import teamExitRoutes from "./routes/teamExit";

import { errorHandler } from "./middleware/errorHandler";

import passport from "passport";
import { configurePassport } from "./config/passport";

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Passport
configurePassport();

// =====================================
// Security Middlewares
// =====================================
app.use(helmetMiddleware);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// =====================================
// Static Uploads
// =====================================
app.use("/uploads", express.static(path.resolve("uploads")));

// =====================================
// Health Check
// =====================================
app.get("/api", (_, res) => {
  res.status(200).send("🚀 TeamSync API is running");
});

// =====================================
// Gmail SMTP Test Route
// =====================================
app.get("/test-email", async (_, res) => {
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: "TeamSync Test Email",
      text: "🎉 Congratulations! Gmail SMTP is working successfully.",
    });

    res.status(200).send("✅ Test email sent successfully.");
  } catch (error) {
    console.error("❌ Email Send Error:", error);
    res.status(500).send("❌ Failed to send test email.");
  }
});

// =====================================
// API Routes
// =====================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/hackathons", hackathonRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/team-exit-requests", teamExitRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/ai-match", aiMatchRoutes);
import aiRecommendationRoutes from "./routes/aiRecommendation";
app.use("/api/ai", aiRecommendationRoutes);

// =====================================
// Global Error Handler
// =====================================
app.use(errorHandler);

import { startScheduler } from "./utils/scheduler";

// =====================================
// Start Server
// =====================================
const server = http.createServer(app);
initSocketServer(server);

connectDB()
  .then(() => {
    startScheduler();
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  });