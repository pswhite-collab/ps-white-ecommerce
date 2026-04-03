import Joi from 'joi';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { serializeOrderForClient } from '../utils/serializeBookForClient.js';
import { orderCreateSchema } from '../utils/validation.js';
import { sendShippingNotificationEmail } from '../utils/email.js';

const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')
    .required(),
  trackingNumber: Joi.string().allow('', null),
  carrier: Joi.string().allow('', null),
});

const trackingUpdateSchema = Joi.object({
  carrier: Joi.string().trim().required(),
  trackingNumber: Joi.string().trim().required(),
  autoNotify: Joi.boolean().default(true),
});

const resolveItemPrice = (book, format) => {
  if (format === 'ebook') {
    return book.formats?.ebook?.price || 0;
  }
  if (format === 'physical') {
    return book.formats?.physical?.price || 0;
  }
  if (format === 'audiobook') {
    return book.formats?.audiobook?.price || 0;
  }
  return 0;
};

const requiredShippingFields = [
  'firstName',
  'lastName',
  'address',
  'city',
  'state',
  'country',
  'postalCode',
  'phone',
];

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isBlank = (value) => !value || (typeof value === 'string' && !value.trim());

const parseFullName = (fullName = '') => {
  const cleaned = String(fullName || '').trim();
  if (!cleaned) {
    return { firstName: '', lastName: '' };
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const normalizeAddress = (input = {}) => {
  const parsedFromFullName = parseFullName(input.fullName);
  const firstName = (input.firstName || parsedFromFullName.firstName || '').trim();
  const lastName = (input.lastName || parsedFromFullName.lastName || '').trim();
  const address = (input.address || input.street || '').trim();
  const city = (input.city || '').trim();
  const state = (input.state || '').trim();
  const country = (input.country || '').trim();
  const postalCode = (input.postalCode || '').trim();
  const phone = (input.phone || '').trim();

  return {
    firstName,
    lastName,
    address,
    addressLine2: (input.addressLine2 || '').trim(),
    city,
    state,
    country,
    postalCode,
    phone,
    sameAsShipping: Boolean(input.sameAsShipping),

    // Keep legacy fields for backward compatibility with existing data usage.
    fullName: [firstName, lastName].filter(Boolean).join(' ').trim(),
    street: address,
  };
};

const validateRequiredShippingAddress = (address) => {
  const missing = requiredShippingFields.filter((field) => isBlank(address[field]));
  if (missing.length > 0) {
    throw createHttpError(
      400,
      `Shipping address is required for physical books. Missing: ${missing.join(', ')}`
    );
  }
};

const getPhysicalQuantity = (items) =>
  items.reduce((sum, item) => (item.format === 'physical' ? sum + item.quantity : sum), 0);

const calculateShippingCost = (physicalQuantity) => {
  if (physicalQuantity <= 0) {
    return 0;
  }
  if (physicalQuantity === 1) {
    return 5;
  }
  if (physicalQuantity <= 3) {
    return 8;
  }
  return 12;
};

const generateTrackingUrl = (carrier = '', trackingNumber = '') => {
  const normalizedCarrier = String(carrier || '').toLowerCase().replace(/\s+/g, '');
  const encodedTrackingNumber = encodeURIComponent(String(trackingNumber || '').trim());

  const carriers = {
    fedex: `https://www.fedex.com/fedextrack/?tracknumbers=${encodedTrackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${encodedTrackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodedTrackingNumber}`,
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${encodedTrackingNumber}`,
    bluedart: `https://www.bluedart.com/tracking/${encodedTrackingNumber}`,
    delhivery: `https://www.delhivery.com/track/package/${encodedTrackingNumber}`,
    indiapost: `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentno=${encodedTrackingNumber}`,
  };

  return carriers[normalizedCarrier] || '';
};

const resolveRecipient = (order) => {
  if (order.user?.email) {
    return {
      to: order.user.email,
      customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Reader',
    };
  }

  if (order.guestEmail) {
    return {
      to: order.guestEmail,
      customerName: 'Reader',
    };
  }

  return { to: '', customerName: 'Reader' };
};

const reservePhysicalStock = async (items) => {
  const reservations = [];

  for (const item of items) {
    if (item.format !== 'physical') {
      continue;
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: item.book, 'formats.physical.stock': { $gte: item.quantity } },
      { $inc: { 'formats.physical.stock': -item.quantity } },
      { new: true }
    );

    if (!updatedBook) {
      await rollbackStockReservation(reservations);
      throw createHttpError(
        400,
        `Insufficient stock for "${item.title}". Please reduce quantity and try again.`
      );
    }

    reservations.push({ bookId: item.book, quantity: item.quantity });
  }

  return reservations;
};

const rollbackStockReservation = async (reservations) => {
  if (!reservations.length) {
    return;
  }

  await Promise.all(
    reservations.map((reservation) =>
      Book.updateOne(
        { _id: reservation.bookId },
        { $inc: { 'formats.physical.stock': reservation.quantity } }
      )
    )
  );
};

const isFormatAvailable = (book, format) => {
  return Boolean(book.formats?.[format]?.available);
};

const buildDigitalProducts = (items) => {
  return items
    .filter((item) => item.format === 'ebook' || item.format === 'audiobook')
    .map((item) => ({
      book: item.book,
      format: item.format,
      downloadUrl: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }));
};

export const createOrder = async (req, res, next) => {
  let stockReservations = [];

  try {
    const { error, value } = orderCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const bookIds = value.items.map((item) => item.book);
    const books = await Book.find({ _id: { $in: bookIds }, active: true });
    const bookMap = new Map(books.map((book) => [String(book._id), book]));

    const normalizedItems = [];

    for (const item of value.items) {
      const book = bookMap.get(String(item.book));
      if (!book) {
        return res.status(404).json({ success: false, error: 'One or more books no longer exist' });
      }

      if (!isFormatAvailable(book, item.format)) {
        return res.status(400).json({ success: false, error: `Format ${item.format} unavailable for ${book.title}` });
      }

      const price = resolveItemPrice(book, item.format);

      normalizedItems.push({
        book: book._id,
        title: book.title,
        format: item.format,
        price,
        quantity: item.quantity,
      });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const hasPhysical = normalizedItems.some((item) => item.format === 'physical');
    const shippingAddress = normalizeAddress(value.shippingAddress);
    const billingAddress = normalizeAddress(value.billingAddress);
    const hasBillingAddress =
      requiredShippingFields.some((field) => !isBlank(billingAddress[field])) ||
      !isBlank(billingAddress.addressLine2);
    const resolvedBillingAddress = hasBillingAddress
      ? { ...billingAddress, sameAsShipping: false }
      : { ...shippingAddress, sameAsShipping: true };
    const physicalQuantity = getPhysicalQuantity(normalizedItems);
    const shippingCost = calculateShippingCost(physicalQuantity);

    if (hasPhysical) {
      validateRequiredShippingAddress(shippingAddress);
      stockReservations = await reservePhysicalStock(normalizedItems);
    }

    const shipping = hasPhysical
      ? {
          cost: shippingCost,
          method: 'standard',
          estimatedDays: 7,
        }
      : {
          cost: 0,
          method: 'free',
          estimatedDays: 0,
        };

    const tax = 0;
    const discount = 0;
    const total = subtotal + shippingCost + tax - discount;

    const order = await Order.create({
      user: req.user?._id,
      guestEmail: req.user ? undefined : value.guestEmail,
      items: normalizedItems,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      currency: value.currency,
      status: 'pending',
      payment: {
        method: value.paymentMethod,
        status: 'pending',
      },
      shippingAddress: hasPhysical ? shippingAddress : undefined,
      billingAddress: hasPhysical ? resolvedBillingAddress : undefined,
      digitalProducts: buildDigitalProducts(normalizedItems),
    });

    return res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    if (stockReservations.length) {
      await rollbackStockReservation(stockReservations);
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }

    return next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.book', 'title coverImage');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const isOwner = req.user && String(order.user) === String(req.user._id);
    const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const serializedOrder = await serializeOrderForClient(order);

    return res.json({ success: true, data: { order: serializedOrder } });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { error, value } = statusUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = value.status;

    if (value.trackingNumber !== undefined) {
      order.shipping = order.shipping || {};
      order.shipping.trackingNumber = (value.trackingNumber || '').trim();
    }

    if (value.carrier !== undefined) {
      order.shipping = order.shipping || {};
      order.shipping.carrier = (value.carrier || '').trim();
    }

    if (value.status === 'shipped' && !order.shipping?.shippedAt) {
      order.shipping = order.shipping || {};
      order.shipping.shippedAt = new Date();
    }

    if (value.status === 'delivered' && !order.shipping?.deliveredAt) {
      order.shipping = order.shipping || {};
      order.shipping.deliveredAt = new Date();
    }

    await order.save();

    return res.json({ success: true, data: { order } });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderTracking = async (req, res, next) => {
  try {
    const { error, value } = trackingUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!order.hasPhysicalItems) {
      return res.status(400).json({
        success: false,
        error: 'Tracking can only be added to orders with physical items',
      });
    }

    order.shipping = order.shipping || {};
    order.shipping.carrier = value.carrier.trim();
    order.shipping.trackingNumber = value.trackingNumber.trim();
    order.shipping.trackingUrl = generateTrackingUrl(value.carrier, value.trackingNumber);
    order.shipping.shippedAt = new Date();

    if (order.status === 'pending' || order.status === 'processing') {
      order.status = 'shipped';
    }

    await order.save();

    let notificationSent = false;
    let notificationError = '';
    if (value.autoNotify) {
      const { to, customerName } = resolveRecipient(order);
      if (to) {
        try {
          await sendShippingNotificationEmail({ to, customerName, order });
          order.notifications = order.notifications || {};
          order.notifications.shippingNotificationSent = true;
          order.notifications.shippingNotificationSentAt = new Date();
          await order.save();
          notificationSent = true;
        } catch (emailError) {
          notificationError = 'Tracking updated, but email notification failed';
        }
      }
    }

    return res.json({
      success: true,
      message: notificationError || (notificationSent ? 'Tracking updated and notification sent' : 'Tracking updated'),
      data: { order },
    });
  } catch (error) {
    return next(error);
  }
};

export const sendShippingNotification = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!order.shipping?.trackingNumber) {
      return res.status(400).json({
        success: false,
        error: 'No tracking number found. Please add tracking info first.',
      });
    }

    const { to, customerName } = resolveRecipient(order);
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'No customer email found for this order',
      });
    }

    await sendShippingNotificationEmail({ to, customerName, order });

    order.notifications = order.notifications || {};
    order.notifications.shippingNotificationSent = true;
    order.notifications.shippingNotificationSentAt = new Date();
    await order.save();

    return res.json({
      success: true,
      message: 'Shipping notification sent successfully',
      data: { order },
    });
  } catch (error) {
    return next(error);
  }
};

export const processRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = 'cancelled';
    order.payment = {
      ...order.payment,
      status: 'refunded',
    };
    await order.save();

    return res.json({
      success: true,
      data: {
        message: 'Refund processed (simulated)',
        order,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const markOrderPaid = async ({
  orderId,
  method,
  transactionId,
  paymentStatus = 'paid',
}) => {
  const order = await Order.findById(orderId);
  if (!order) {
    return null;
  }

  order.status = 'completed';
  if (order.hasPhysicalItems) {
    order.status = 'processing';
  }
  order.payment = {
    ...order.payment,
    method,
    transactionId,
    status: paymentStatus,
    paidAt: new Date(),
  };

  await order.save();
  return order;
};
