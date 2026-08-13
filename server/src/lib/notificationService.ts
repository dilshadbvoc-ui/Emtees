import { sendUserCredentialsEmail } from "./email";
import { getDb } from "../queries/connection";
import { notifications } from "@db/schema";
import { sendNotification } from "./notificationEngine";

// Providers Configuration
// In the future, import Twilio / Wati / etc. here

export type NotificationChannel = "email" | "sms" | "whatsapp" | "in_app";

export interface SendMessageOptions {
  userId: number;
  phone?: string;
  email?: string;
  subject?: string;
  message: string;
  type: string;
  channels: NotificationChannel[];
}

export const NotificationService = {
  /**
   * Dispatch a notification across multiple channels
   */
  async dispatch(options: SendMessageOptions) {
    const { userId, phone, email, subject, message, type, channels } = options;

    const results: Record<string, boolean> = {};

    for (const channel of channels) {
      try {
        switch (channel) {
          case "in_app":
            await sendNotification(userId, subject || "Notification", message, type);
            results["in_app"] = true;
            break;

          case "email":
            if (email) {
              results["email"] = await this.sendEmail(email, subject || "Notification", message);
            }
            break;

          case "sms":
            if (phone) {
              results["sms"] = await this.sendSMS(phone, message);
            }
            break;

          case "whatsapp":
            if (phone) {
              results["whatsapp"] = await this.sendWhatsApp(phone, message);
            }
            break;
        }
      } catch (err) {
        console.error(`[NotificationService] Failed to send via ${channel} to user ${userId}:`, err);
        results[channel] = false;
      }
    }

    return results;
  },

  async sendEmail(to: string, subject: string, htmlContent: string) {
    // For now, we reuse the existing transporter in email.ts or just log if no SMTP configured
    // Since we only have sendUserCredentialsEmail right now, we can mock generic emails here
    const hasSmtp = !!process.env.SMTP_HOST;
    if (!hasSmtp) {
      console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject} | Body: ${htmlContent}`);
      return true;
    }

    // Dynamic import to avoid circular dependencies if any, or just import transporter
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"EMTEES Academy" <noreply@emtees.com>',
        to,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (e) {
      console.error("[Email Delivery Error]", e);
      return false;
    }
  },

  async sendSMS(phone: string, message: string) {
    // TODO: Integrate MSG91 / Twilio
    console.log(`[SIMULATED SMS] To: ${phone} | Message: ${message}`);
    return true;
  },

  async sendWhatsApp(phone: string, message: string) {
    // TODO: Integrate Wati / Twilio / Meta Cloud API
    console.log(`[SIMULATED WHATSAPP] To: ${phone} | Message: ${message}`);
    return true;
  }
};
