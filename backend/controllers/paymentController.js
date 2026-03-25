import crypto from 'crypto';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { markOrderPaid } from './orderController.js';
import { sendOrderConfirmationEmail } from '../utils/email.js';

const razorpayClient =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    : null;

const stripeClient = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const isProduction = process.env.NODE_ENV === 'production';

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const amount = Math.round(order.total * 100);

    if (!razorpayClient) {
      return res.json({
        success: true,
        data: {
          orderId: `simulated_${order._id}`,
          amount,
          currency: order.currency || 'INR',
        },
      });
    }

    let razorpayOrder;
    try {
      razorpayOrder = await razorpayClient.orders.create({
        amount,
        currency: order.currency || 'INR',
        receipt: order.orderNumber,
        notes: { orderId: String(order._id) },
      });
    } catch (gatewayError) {
      if (!isProduction) {
        return res.json({
          success: true,
          data: {
            orderId: `simulated_${order._id}`,
            amount,
            currency: order.currency || 'INR',
          },
        });
      }
      throw gatewayError;
    }

    return res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const isSimulatedSignature = razorpaySignature === 'simulated';
    if (process.env.RAZORPAY_KEY_SECRET && !(isSimulatedSignature && !isProduction)) {
      const signaturePayload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(signaturePayload)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, error: 'Invalid payment signature' });
      }
    }

    const paidOrder = await markOrderPaid({
      orderId: order._id,
      method: 'razorpay',
      transactionId: razorpayPaymentId || razorpayOrderId,
      paymentStatus: 'paid',
    });

    if (req.user?.email || order.guestEmail) {
      await sendOrderConfirmationEmail({
        to: req.user?.email || order.guestEmail,
        orderNumber: order.orderNumber,
      });
    }

    return res.json({ success: true, data: { order: paidOrder } });
  } catch (error) {
    return next(error);
  }
};

export const createStripeIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const amount = Math.round(order.total * 100);

    if (!stripeClient) {
      return res.json({
        success: true,
        data: {
          clientSecret: `simulated_secret_${order._id}`,
        },
      });
    }

    let paymentIntent;
    try {
      paymentIntent = await stripeClient.paymentIntents.create({
        amount,
        currency: (order.currency || 'usd').toLowerCase(),
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
          },
        });
      }
      throw gatewayError;
    }

    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const confirmStripePayment = async (req, res, next) => {
  try {
    const { orderId, transactionId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const paidOrder = await markOrderPaid({
      orderId,
      method: 'stripe',
      transactionId: transactionId || `simulated_stripe_${Date.now()}`,
      paymentStatus: 'paid',
    });

    if (!paidOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.json({ success: true, data: { order: paidOrder } });
  } catch (error) {
    return next(error);
  }
};

export const stripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event = req.body;

    if (stripeClient && webhookSecret && signature) {
      event = stripeClient.webhooks.constructEvent(req.body, signature, webhookSecret);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await markOrderPaid({
          orderId,
          method: 'stripe',
          transactionId: intent.id,
          paymentStatus: 'paid',
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return next(error);
  }
};


