import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import express from "express";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRouter.js";
import adminRouter from "./routes/adminRouter.js";
import patientRouter from "./routes/patientRouter.js";
import appointmentRouter from "./routes/appointmentRoute.js";
import userRouter from "./routes/userRouter.js";
import AIRouter from "./routes/aiRoutes.js";
import insuranceRouter from "./routes/insuranceRoutes.js";
import { ErrorHandler } from "./utils/ErrorHandler.js";
import { startAppointmentJobs } from "./jobs/appointmentJobs.js";
import scheduleRouter from "./routes/scheduleRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import doctorRouter from "./routes/doctorRouter.js";
import upRouter from "./routes/uploadRouter.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middlewares ----------
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.originalUrl);
  next();
});

// Invalid JSON body
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON format" });
  }
  next(err);
});

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// ---------- Health check ----------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Block requests while the database is not connected
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is not connected, please try again shortly",
    });
  }
  next();
});

// ---------- Routes ----------
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", AIRouter);
app.use("/api/patient", patientRouter);
app.use("/api/insurance", insuranceRouter);
app.use("/api/doctors", reviewRouter);
app.use("/api/doctors", scheduleRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/up", upRouter);

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Index works",
  });
});

// ---------- 404 + Error handler ----------
app.use((req, res, next) => {
  next({ message: `Route not found: ${req.originalUrl}`, statusCode: 404 });
});
app.use(ErrorHandler);

// ---------- Start ----------
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
    startAppointmentJobs();
  });
});

// ---------- Process-level error handlers ----------
process.on("unhandledRejection", (err) => {
  console.error("Critical Error:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});