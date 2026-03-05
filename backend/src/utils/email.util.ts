import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Creates a Nodemailer test account and sends an email.
 * This is meant for development using Ethereal Email.
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
) => {
  try {
    let transporter: nodemailer.Transporter;

    if (env.SMTP_USER && env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST || "smtp.gmail.com",
        port: env.SMTP_PORT || 465,
        secure: env.SMTP_PORT === 465 || !env.SMTP_PORT, // true for 465, false for 587
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      console.log(
        "No SMTP credentials found in .env. Falling back to test ethereal email...",
      );
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    }

    const frontendUrl = env.CORS_ORIGIN || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/forgot-password?token=${resetToken}`;

    const info = await transporter.sendMail({
      from:
        env.SMTP_FROM || '"Food Delivery Support" <support@fooddelivery.com>', // sender address
      to, // list of receivers
      subject: "Password Reset Request", // Subject line
      text: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}`, // plain text body
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #f97316;">Password Reset Request</h2>
          <p>You recently requested to reset your password for your Food Delivery account.</p>
          <p>Please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you did not make this request, you can safely ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Food Delivery Team</p>
        </div>
      `, // html body
    });

    console.log("Message sent: %s", info.messageId);

    if (!env.SMTP_USER) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      console.log("Please click the Preview URL above to view the email!");
    } else {
      console.log("Email successfully sent via configured SMTP.");
    }

    return true;
  } catch (error) {
    console.error("Error sending reset email:", error);
    return false;
  }
};
