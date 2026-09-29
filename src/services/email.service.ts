import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(env.SMTP_PORT) || 587,
        secure: Number(env.SMTP_PORT) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      console.warn('⚠️ SMTP credentials not fully configured. Emails will be logged to console in dev mode.');
    }
  }

  async sendOtpEmail(email: string, otp: string, purpose: 'signup' | 'login' | 'auth' = 'auth') {
    const isSignup = purpose === 'signup';
    const actionText = isSignup ? 'complete your registration' : 'sign in to your NutriCount account';
    const subject = isSignup
      ? `${otp} is your NutriCount Sign Up verification code`
      : `${otp} is your NutriCount Sign In verification code`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NutriCount Verification</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #010113;
          color: #e9f9fc;
          margin: 0;
          padding: 24px 0;
        }
        .container {
          max-width: 520px;
          margin: 0 auto;
          background-color: #010226;
          border: 1px solid #02306d;
          border-radius: 16px;
          padding: 36px 32px;
          box-shadow: 0 8px 30px rgba(0, 180, 216, 0.1);
        }
        .logo-wrap {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
        }
        .logo span {
          color: #00b4d8;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
          text-align: center;
        }
        .message {
          font-size: 14px;
          line-height: 1.6;
          color: #ade8f4;
          text-align: center;
          margin-bottom: 28px;
        }
        .otp-container {
          text-align: center;
          margin: 28px 0;
        }
        .otp-code {
          display: inline-block;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          padding: 16px 28px;
          color: #00b4d8;
          background: #02044b;
          border: 1px solid #023e8a;
          border-radius: 12px;
        }
        .footer-note {
          font-size: 12px;
          color: #ade8f4;
          opacity: 0.7;
          text-align: center;
          line-height: 1.5;
          margin-top: 24px;
          border-top: 1px solid #02306d;
          padding-top: 18px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-wrap">
          <div class="logo">Nutri<span>count</span></div>
        </div>
        <div class="title">${isSignup ? 'Welcome to NutriCount!' : 'Sign In Verification'}</div>
        <div class="message">
          Use the 6-digit one-time passcode below to ${actionText}.
        </div>
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
        </div>
        <div class="message" style="margin-bottom: 0;">
          This code will expire in <strong>10 minutes</strong>.
        </div>
        <div class="footer-note">
          If you did not request this verification code, please ignore this email. No action is required.
          <br><br>
          &copy; ${new Date().getFullYear()} NutriCount. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    if (!this.transporter) {
      console.log(`[EmailService DEV] Sending OTP ${otp} to ${email} (${purpose})`);
      return;
    }

    const fromAddress = env.SMTP_FROM || `"NutriCount" <${env.SMTP_USER}>`;

    await this.transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      text: `Your NutriCount verification code is: ${otp}. It expires in 10 minutes.`,
      html: htmlContent,
    });
  }
}

export const emailService = new EmailService();
