import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import {
  handlePaymentSucceeded,
  handlePaymentFailed,
} from '../services/payment.service.js';

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (typeof sig !== 'string') {
    throw new AppError('Missing Stripe signature header', 400);
  }

  // req.body must be the raw Buffer — this route must use express.raw() not express.json()
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new AppError('Webhook signature verification failed', 400);
  }

  logger.info(`Stripe event received: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(intent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(intent.id);
      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      logger.info(`Subscription event: ${event.type}`, { subscriptionId: sub.id });
      // Add subscription handling logic here
      break;
    }

    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}
