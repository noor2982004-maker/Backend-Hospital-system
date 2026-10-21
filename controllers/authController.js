import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import Doctor from "../models/doctor.js";
import BlacklistedToken from "../models/blacklistedToken.js";
import { sendOtp, peekOtp, consumeVerifiedOtp } from "../utils/otp.js";
import {
  registerSchema,
  loginSchema,
  emailSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  googleLoginSchema
} from "../validators/authValidator.js";

const googleClient = new OAuth2Client();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return next({
        message: error.details.map((d) => d.message).join(", "),
        statusCode: 400,
      });
    }

    const exists = await User.findOne({ email: value.email.toLowerCase() });
    if (exists) return next({ message: "Email already registered", statusCode: 409 });

    const hashed = await bcrypt.hash(value.password, 12);
    const user = await User.create({ ...value, password: hashed, role: "patient" });

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: { id: user._id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === 11000) {
      return next({ message: "Email already registered", statusCode: 409 });
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { stripUnknown: true });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });

    const user = await User.findOne({ email: value.email.toLowerCase() }).select("+password");

    const valid = user && user.password && (await bcrypt.compare(value.password, user.password));
    if (!valid) return next({ message: "Invalid email or password", statusCode: 401 });

    if (value.role && value.role !== user.role) {
      return next({ message: `This account is not a ${value.role} account`, statusCode: 403 });
    }

    const userData = {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    };

    switch (user.role) {
      case "patient":
        break;

      case "doctor": {
        const doctor = await Doctor.findOne({ user_id: user._id }).select("_id is_active").lean();
        if (!doctor) {
          return next({
            message: "Doctor profile not found, please contact the admin",
            statusCode: 403,
          });
        }
        if (!doctor.is_active) {
          return next({ message: "This doctor account is disabled", statusCode: 403 });
        }
        userData.doctor_id = doctor._id;
        break;
      }

      case "admin":
        break;

      default:
        return next({ message: "This account role is not allowed to sign in", statusCode: 403 });
    }

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: { token: signToken(user), user: userData },
    });
  } catch (err) {
    next(err);
  }
};
export const googleLogin = async (req, res, next) => {
  try {
    const { error, value } = googleLoginSchema.validate(req.body ?? {}, {
      stripUnknown: true,
    });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });

    const { id_token } = value;

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: (process.env.GOOGLE_CLIENT_ID || "").split(",").map((id) => id.trim()),
      });
      payload = ticket.getPayload();
    } catch {
      return next({ message: "Invalid Google token", statusCode: 401 });
    }

    if (!payload.email_verified) {
      return next({ message: "Google email is not verified", statusCode: 401 });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });

    if (user && user.role !== "patient") {
      return next({
        message: "Google sign-in is available for patient accounts only",
        statusCode: 403,
      });
    }

    if (!user) {
      user = await User.create({
        full_name: payload.name,
        email,
        google_id: payload.sub,
        role: "patient",
      });
    } else if (!user.google_id) {
      await User.updateOne({ _id: user._id }, { google_id: payload.sub });
    }

    res.status(200).json({
      success: true,
      message: "Logged in with Google",
      data: {
        token: signToken(user),
        user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
};
export const logout = async (req, res, next) => {
  try {
    await BlacklistedToken.create({
      token: req.token,
      expiresAt: new Date(req.user.exp * 1000),
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = emailSchema.validate(req.body, { stripUnknown: true });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });

    const user = await User.findOne({ email: value.email.toLowerCase() });
    const otp = user ? await sendOtp(user.email, "reset_password") : null;

    res.status(200).json({
      success: true,
      message: "If the email is registered, a reset code has been sent",
      ...(process.env.NODE_ENV === "development" && otp ? { dev_otp: otp } : {}),
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { error, value } = verifyEmailSchema.validate(req.body, { stripUnknown: true });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });

    const ok = await peekOtp(value.email, "reset_password", value.otp);
    if (!ok) return next({ message: "Invalid or expired code", statusCode: 400 });

    res.status(200).json({ success: true, message: "Code verified" });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return next({ message: error.details.map((d) => d.message).join(", "), statusCode: 400 });
    }

    const ok = await consumeVerifiedOtp(value.email, "reset_password");
    if (!ok) return next({ message: "Please verify your code first", statusCode: 400 });

    const hashed = await bcrypt.hash(value.new_password, 12);
    await User.updateOne({ email: value.email.toLowerCase() }, { password: hashed });

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};