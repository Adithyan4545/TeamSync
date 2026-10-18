import nodemailer from "nodemailer";
import { config } from "dotenv";
import dns from "dns";

config();

// Prefer IPv4 (helps on some networks)
dns.setDefaultResultOrder("ipv4first");

// Gmail SMTP Transporter
export const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verify SMTP connection on startup
(async () => {
  try {
    await emailTransporter.verify();
    console.log("✅ Email transporter is ready to send messages");
  } catch (error: any) {
    if (error.code === 'ENETUNREACH') {
      console.warn("⚠️ Email transporter network unreachable (likely IPv6 issue). Skipping verification.");
    } else {
      console.error("❌ Email transporter verification failed:");
      console.error(error);
    }
  }
})();