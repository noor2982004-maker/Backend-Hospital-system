import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,     
  requireTLS: true,
  family: 4,          
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

export default async function sendEmail({ to, subject, text, html }) {
  await transporter.sendMail({
    from: `"نبضة" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments: [{ filename: "logo.png", path: LOGO_PATH, cid: "logo" }],
  });
}