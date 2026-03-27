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

const resolveFrontendBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

const getOrderForPayment = async (req, orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    return null;
  }

  const isAdmin = ['admin', 'super_admin'].includes(req.user?.role);
  const isOwner = req.user?._id && String(order.user) === String(req.user._id);

  if (!isAdmin && !isOwner) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

const sendOrderConfirmation = async (req, order) => {
  const recipientEmail = req.user?.email || order.guestEmail;
  if (!recipientEmail) {
    return;
  }

  try {
    await sendOrderConfirmationEmail({
      to: recipientEmail,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    console.error('Order confirmation email failed:', {
      orderId: String(order._id),
      recipientEmail,
      message: err?.message || 'Unknown error',
    });
    throw err;
  }
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await getOrderForPayment(req, orderId);
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

export const createStripeCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await getOrderForPayment(req, orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const frontendBaseUrl = resolveFrontendBaseUrl();
    const successUrl = `${frontendBaseUrl}/order-success/${order._id}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendBaseUrl}/checkout?cancelled=1`;

    if (!stripeClient) {
      if (isProduction) {
        return res.status(503).json({ success: false, error: 'Stripe is not configured' });
      }

      return res.json({
        success: true,
        data: {
          url: `${frontendBaseUrl}/order-success/${order._id}?session_id=simulated_${order._id}`,
          sessionId: `simulated_${order._id}`,
        },
      });
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: req.user?.email || order.guestEmail || undefined,
      metadata: {
        orderId: String(order._id),
      },
      payment_intent_data: {
        metadata: {
          orderId: String(order._id),
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (order.currency || 'gbp').toLowerCase(),
            unit_amount: Math.round(order.total * 100),
            product_data: {
              name: `Order ${order.orderNumber}`,
              description: `${order.items.length} item(s) from PS White Books`,
            },
          },
        },
      ],
    });

    return res.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
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

    const order = await getOrderForPayment(req, orderId);
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

    await sendOrderConfirmation(req, order);

    return res.json({ success: true, data: { order: paidOrder } });
  } catch (error) {
    return next(error);
  }
};

export const createStripeIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await getOrderForPayment(req, orderId);
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
        currency: (order.currency || 'gbp').toLowerCase(),
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
    const { orderId, transactionId, sessionId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const order = await getOrderForPayment(req, orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    let verifiedTransactionId = transactionId;

    if (stripeClient) {
      if (sessionId) {
        const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent'],
        });

        const sessionOrderId =
          session.metadata?.orderId || session.payment_intent?.metadata?.orderId || '';
        const isPaid =
          session.payment_status === 'paid' || session.payment_intent?.status === 'succeeded';

        if (String(sessionOrderId) !== String(order._id)) {
          return res.status(400).json({ success: false, error: 'Stripe session does not match order' });
        }

        if (!isPaid) {
          return res.status(400).json({ success: false, error: 'Stripe payment is not completed yet' });
        }

        verifiedTransactionId = session.payment_intent?.id || session.id;
      } else if (transactionId) {
        const paymentIntent = await stripeClient.paymentIntents.retrieve(transactionId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ success: false, error: 'Stripe payment is not completed yet' });
        }

        if (String(paymentIntent.metadata?.orderId || '') !== String(order._id)) {
          return res.status(400).json({ success: false, error: 'Stripe payment does not match order' });
        }

        verifiedTransactionId = paymentIntent.id;
      } else {
        return res.status(400).json({
          success: false,
          error: 'A Stripe sessionId or payment intent transactionId is required',
        });
      }
    } else if (isProduction) {
      return res.status(503).json({ success: false, error: 'Stripe is not configured' });
    } else {
      verifiedTransactionId = transactionId || sessionId || `simulated_stripe_${Date.now()}`;
    }

    const paidOrder = await markOrderPaid({
      orderId: order._id,
      method: 'stripe',
      transactionId: verifiedTransactionId,
      paymentStatus: 'paid',
    });

    await sendOrderConfirmation(req, order);

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
