import jwt from "jsonwebtoken";
import BlacklistedToken from "../models/blacklistedToken.js";

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return next({ message: "Not authenticated", statusCode: 401 });
  }

  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (await BlacklistedToken.exists({ token })) {
      return next({ message: "Token is no longer valid", statusCode: 401 });
    }

    req.token = token;
    req.user = { id: decoded.id, role: decoded.role, exp: decoded.exp };
    next();
  } catch {
    next({ message: "Invalid or expired token", statusCode: 401 });
  }
};

export const authorize = (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next({ message: "Forbidden", statusCode: 403 });