import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const brevo = new BrevoClient({ apiKey: env.BREVO_API_KEY });

// ─── DTOs ─────────────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// ─── Core send ────────────────────────────────────────────────────────────────

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: opts.subject,
      htmlContent: opts.html,
      sender: {
        name: env.SENDER_NAME,
        email: env.SENDER_EMAIL,
      },
      to: [{ email: opts.to }],
    });

    logger.info(`Email sent to ${opts.to}: ${opts.subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${opts.to}:`, error);
    throw new Error('Failed to send email');
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Welcome!',
    html: `<p>Hi ${name}, welcome aboard!</p>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: 'Reset your password',
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, please ignore it.</p>
    `,
  });
}

export async function sendEmailVerification(
  to: string,
  verifyUrl: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: 'Verify your email',
    html: `
      <p>Please verify your email address.</p>
      <p><a href="${verifyUrl}">Click here to verify</a></p>
    `,
  });
}
