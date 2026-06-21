import nodemailer from 'nodemailer';
import { env } from '../config/env';

export async function sendOtpEmail(email: string, otp: string) {
  // Always log to console for development convenience

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('ℹ️ SMTP is not fully configured. Email was not sent (development/fallback mode).');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: SMTP_FROM || '"Nutricount Auth" <noreply@nutricount.com>',
      to: email,
      subject: 'Your Nutricount Login Verification Code',
      text: `Your login verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 8px;">
          <h2 style="color: #0077b6; text-align: center;">Nutricount Verification Code</h2>
          <p>Hello,</p>
          <p>You requested a one-time password (OTP) to sign in or register on Nutricount.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00b4d8; background-color: #f0f9ff; padding: 10px 20px; border-radius: 4px; border: 1px dashed #90e0ef;">${otp}</span>
          </div>
          <p>This verification code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 12px; color: #999; text-align: center;">This is an automated email. Please do not reply to it.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send email via SMTP:', error);
  }
}
