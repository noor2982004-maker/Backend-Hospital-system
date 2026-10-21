import crypto from "node:crypto";
import Otp from "../models/otp.js";
import sendEmail from "./SendEmail.js";
import { otpEmail } from "./emailTemplates.js";

const OTP_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SEC = 30;

const hash = (otp) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(otp).digest("hex");

export const sendOtp = async (email, purpose) => {
  email = email.toLowerCase();

  const existing = await Otp.findOne({ email, purpose });
  if (existing && Date.now() - existing.lastSentAt.getTime() < COOLDOWN_SEC * 1000) {
    const err = new Error("Please wait before requesting another code");
    err.statusCode = 429;
    throw err;
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  await Otp.findOneAndUpdate(
    { email, purpose },
    {
      otp_hash: hash(otp),
      attempts: 0,
      verified: false,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000),
    },
    { upsert: true }
  );

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
  }

  await sendEmail({
    to: email,
    subject: "Reset your password",
    text: `Your code is ${otp}. It expires in ${OTP_TTL_MIN} minutes. If you didn't request it, ignore this email.`,
    html: otpEmail({ otp, purpose, expiresInMin: OTP_TTL_MIN }),
  });

  return otp;
};

export const peekOtp = async (email, purpose, otp) => {
  const record = await Otp.findOne({ email: email.toLowerCase(), purpose });

  if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
    return false;
  }

  if (record.otp_hash !== hash(otp)) {
    record.attempts += 1;
    await record.save();
    return false;
  }

  record.verified = true;
  record.expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  await record.save();
  return true;
};

export const consumeVerifiedOtp = async (email, purpose) => {
  const record = await Otp.findOne({ email: email.toLowerCase(), purpose, verified: true });
  if (!record || record.expiresAt < new Date()) return false;

  await record.deleteOne();
  return true;
};