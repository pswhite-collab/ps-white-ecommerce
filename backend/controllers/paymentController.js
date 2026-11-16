import Stripe from 'stripe';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail } from '../utils/email.js';

const isProduction = process.env.NODE_ENV === 'production';
const stripeClient = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Checks whether the current user is authorized to view or act on an order.
 */
export const canAccessOrder = (order, user) => {
  if (!order) return false;
  // Admin always has access
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    return true;
  }
  // If order belongs to a registered user
  if (order.user) {
    if (!user) return false;
    const orderUserId = typeof order.user === 'object' && order.user._id ? order.user._id : order.user;
    return String(orderUserId) === String(user._id || user.id);
  }
  // Guest order - accessible if unauthenticated or matching guestEmail
  if (order.guestEmail && user && user.email) {
    return order.guestEmail.toLowerCase() === user.email.toLowerCase();
  }
  return true;
};

/**
 * Validates a Stripe PaymentIntent against an order.
 */
export const evaluateStripeIntent = (paymentIntent, order) => {
  if (!paymentIntent || typeof paymentIntent !== 'object') {
    return { valid: false, statusCode: 400, reason: 'Invalid PaymentIntent object' };
  }

  if (paymentIntent.status !== 'succeeded') {
    return {
      valid: false,
      statusCode: 402,
      reason: `PaymentIntent has not succeeded. Current status: ${paymentIntent.status}`,
    };
  }

  const expectedAmount = Math.round(Number(order.total || 0) * 100);
  if (paymentIntent.amount !== expectedAmount) {
    return {
      valid: false,
      statusCode: 402,
      reason: `Payment amount (${paymentIntent.amount}) does not match order total in cents (${expectedAmount})`,
    };
  }

  const expectedCurrency = (order.currency || 'usd').toLowerCase();
  if ((paymentIntent.currency || '').toLowerCase() !== expectedCurrency) {
    return {
      valid: false,
      statusCode: 402,
      reason: `Payment currency (${paymentIntent.currency}) does not match order currency (${expectedCurrency})`,
    };
  }

  if (paymentIntent.metadata?.orderId && paymentIntent.metadata.orderId !== String(order._id)) {
    return {
      valid: false,
      statusCode: 402,
      reason: 'PaymentIntent metadata orderId does not match order',
    };
  }

  return { valid: true };
};

/**
 * Marks an order as paid, sets appropriate status, and sends confirmation email once.
 * Idempotent - safe to call multiple times.
 */
export const finalizePaidOrder = async (order, paymentDetails = {}) => {
  if (!order) return null;

  if (order.payment?.status === 'paid') {
    return order;
  }

  order.status = order.hasPhysicalItems ? 'processing' : 'completed';
  order.payment = {
    ...order.payment,
    method: 'stripe',
    transactionId: paymentDetails.transactionId || order.payment?.transactionId,
    status: 'paid',
    paidAt: new Date(),
  };

  try {
    let emailTo = order.guestEmail;
    if (!emailTo && order.user) {
      const userDoc = await User.findById(order.user).select('email firstName').lean();
      emailTo = userDoc?.email;
    }

    if (emailTo && !order.notifications?.orderConfirmationSent) {
      await sendOrderConfirmationEmail({
        to: emailTo,
        orderNumber: order.orderNumber,
      });
      if (!order.notifications) {
        order.notifications = {};
      }
      order.notifications.orderConfirmationSent = true;
    }
  } catch (emailError) {
    console.warn('[Stripe Payment] Order confirmation email failed or skipped:', emailError.message);
  }

  await order.save();
  return order;
};

/**
 * POST /api/payment/stripe/create-intent
 */
export const createStripeIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied to this order' });
    }

    if (order.payment?.status === 'paid' || order.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Order is already paid' });
    }

    if (isProduction && !stripeClient) {
      return res.status(503).json({
        success: false,
        error: 'Stripe payment gateway is currently unavailable',
      });
    }

    const amount = Math.round(Number(order.total || 0) * 100);
    const currency = (order.currency || 'usd').toLowerCase();

    if (!stripeClient) {
      // In local dev without keys, provide simulated secret for offline testing
      return res.json({
        success: true,
        data: {
          clientSecret: `simulated_secret_${order._id}`,
          paymentIntentId: `pi_simulated_${order._id}`,
        },
      });
    }

    let paymentIntent;
    try {
      paymentIntent = await stripeClient.paymentIntents.create({
        amount,
        currency,
        metadata: {
          orderId: String(order._id),
        },
      });
    } catch (gatewayError) {
      if (!isProduction) {
        return res.json({
          success: true,
          data: {
            clientSecret: `simulated_secret_${order._id}`,
            paymentIntentId: `pi_simulated_${order._id}`,
          },
        });
      }
      throw gatewayError;
    }

    order.payment = {
      ...order.payment,
      method: 'stripe',
      transactionId: paymentIntent.id,
    };
    await order.save();

    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/payment/stripe/confirm
 */
export const confirmStripePayment = async (req, res, next) => {
  try {
    const { orderId, paymentIntentId, transactionId } = req.body;
    const intentId = paymentIntentId || transactionId;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    if (!intentId || (!intentId.startsWith('pi_') && !intentId.startsWith('simulated_'))) {
      return res.status(400).json({ success: false, error: 'Valid paymentIntentId (pi_...) is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied to this order' });
    }

    if (order.payment?.status === 'paid') {
      return res.json({ success: true, data: { order } });
    }

    if (isProduction && !stripeClient) {
      return res.status(503).json({ success: false, error: 'Stripe service unavailable' });
    }

    if (stripeClient && !intentId.startsWith('simulated_')) {
      let paymentIntent;
      try {
        paymentIntent = await stripeClient.paymentIntents.retrieve(intentId);
      } catch (retrieveError) {
        return res.status(400).json({
          success: false,
          error: `Stripe error retrieving intent: ${retrieveError.message}`,
        });
      }

      const evaluation = evaluateStripeIntent(paymentIntent, order);
      if (!evaluation.valid) {
        return res.status(evaluation.statusCode || 402).json({
          success: false,
          error: evaluation.reason,
        });
      }
    }

    const paidOrder = await finalizePaidOrder(order, {
      method: 'stripe',
      transactionId: intentId,
    });

    return res.json({ success: true, data: { order: paidOrder } });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/payment/stripe/webhook
 */
export const stripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event = req.body;

    if (stripeClient && webhookSecret) {
      if (!signature) {
        return res.status(400).json({ success: false, error: 'Missing stripe-signature header' });
      }
      try {
        event = stripeClient.webhooks.constructEvent(req.body, signature, webhookSecret);
      } catch (sigError) {
        return res.status(400).json({ success: false, error: `Webhook signature verification failed: ${sigError.message}` });
      }
    } else if (isProduction) {
      return res.status(400).json({ success: false, error: 'Webhook signature validation required in production' });
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          await finalizePaidOrder(order, {
            method: 'stripe',
            transactionId: intent.id,
          });
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return next(error);
  }
};

export default {
  canAccessOrder,
  evaluateStripeIntent,
  finalizePaidOrder,
  createStripeIntent,
  confirmStripePayment,
  stripeWebhook,
};
