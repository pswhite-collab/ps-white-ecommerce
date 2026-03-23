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
const hasPayPalCredentials =
  Boolean(process.env.PAYPAL_CLIENT_ID) && Boolean(process.env.PAYPAL_CLIENT_SECRET);
const isProduction = process.env.NODE_ENV === 'production';

const getPayPalBaseUrl = () =>
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
  const authHeader = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch PayPal token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
};

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

export const createPayPalOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!hasPayPalCredentials) {
      return res.json({
        success: true,
        data: {
          paypalOrderId: `simulated_paypal_${order._id}`,
          status: 'CREATED',
          approveUrl: null,
        },
      });
    }

    let data;
    let approveUrl = null;
    try {
      const token = await getPayPalAccessToken();
      const currencyCode = (order.currency || 'USD').toUpperCase();
      const amountValue = Number(order.total || 0).toFixed(2);

      const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: String(order._id),
              custom_id: String(order._id),
              amount: {
                currency_code: currencyCode,
                value: amountValue,
              },
            },
          ],
          application_context: {
            brand_name: 'PS White Books',
            user_action: 'PAY_NOW',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayPal create order failed: ${errorText}`);
      }

      data = await response.json();
      approveUrl = data.links?.find((link) => link.rel === 'approve')?.href || null;
    } catch (gatewayError) {
      if (!isProduction) {
        return res.json({
          success: true,
          data: {
            paypalOrderId: `simulated_paypal_${order._id}`,
            status: 'CREATED',
            approveUrl: null,
          },
        });
      }
      throw gatewayError;
    }

    return res.json({
      success: true,
      data: {
        paypalOrderId: data.id,
        status: data.status,
        approveUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const capturePayPalOrder = async (req, res, next) => {
  try {
    const { orderId, paypalOrderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    let transactionId = paypalOrderId || `simulated_paypal_capture_${Date.now()}`;

    if (hasPayPalCredentials && paypalOrderId) {
      try {
        const token = await getPayPalAccessToken();
        const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`PayPal capture failed: ${errorText}`);
        }

        const data = await response.json();
        const isCompleted = data.status === 'COMPLETED';
        if (!isCompleted) {
          return res.status(400).json({
            success: false,
            error: `PayPal order is not completed. Current status: ${data.status}`,
          });
        }

        transactionId =
          data.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.id || transactionId;
      } catch (gatewayError) {
        if (isProduction) {
          throw gatewayError;
        }
        transactionId = paypalOrderId || `simulated_paypal_capture_${Date.now()}`;
      }
    }

    const paidOrder = await markOrderPaid({
      orderId: order._id,
      method: 'paypal',
      transactionId,
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
