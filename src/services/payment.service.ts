import { stripe } from '../config/stripe.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// ─── DTOs / Return shapes ─────────────────────────────────────────────────────

export interface CreatePaymentIntentDto {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId: string;
  createdAt: Date;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function createPaymentIntent(
  userId: string,
  dto: CreatePaymentIntentDto,
): Promise<PaymentIntentResult> {
  // Ensure or create a Stripe customer so receipts and subscriptions work
  let user = await User.findById(userId).lean().exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (stripeCustomerId === undefined) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
    });

    stripeCustomerId = customer.id;

    await User.findByIdAndUpdate(userId, { stripeCustomerId }).exec();

    // Refresh local variable
    user = { ...user, stripeCustomerId };
  }

  const intent = await stripe.paymentIntents.create({
    amount: dto.amount,
    currency: dto.currency,
    customer: stripeCustomerId,
    metadata: { userId, ...dto.metadata },
  });

  if (intent.client_secret === null) {
    throw new AppError('Failed to create payment intent', 500);
  }

  // Create a pending payment record immediately
  await Payment.create({
    userId,
    stripePaymentIntentId: intent.id,
    amount: dto.amount,
    currency: dto.currency,
    status: 'pending',
    metadata: dto.metadata,
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

export async function getPaymentsByUser(userId: string): Promise<PaymentDto[]> {
  const payments = await Payment.find({ userId }).lean().exec();

  return payments.map((p) => ({
    id: p._id.toString(),
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    stripePaymentIntentId: p.stripePaymentIntentId,
    createdAt: p.createdAt,
  }));
}

// Called from the Stripe webhook — not from a controller directly
export async function handlePaymentSucceeded(paymentIntentId: string): Promise<void> {
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { status: 'succeeded' },
  ).exec();
}

export async function handlePaymentFailed(paymentIntentId: string): Promise<void> {
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { status: 'failed' },
  ).exec();
}
