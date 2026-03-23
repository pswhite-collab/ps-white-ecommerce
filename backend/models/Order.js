import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    address: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    phone: { type: String, trim: true },
    sameAsShipping: { type: Boolean, default: true },

    // Backward-compatible aliases (legacy payloads)
    fullName: { type: String, trim: true },
    street: { type: String, trim: true },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    cost: { type: Number, default: 0, min: 0 },
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'free'],
      default: 'standard',
    },
    estimatedDays: { type: Number, default: 7, min: 0 },
    carrier: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    shippedAt: { type: Date },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
  },
  { _id: false }
);

const notificationsSchema = new mongoose.Schema(
  {
    shippingNotificationSent: { type: Boolean, default: false },
    shippingNotificationSentAt: { type: Date },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    items: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
        title: { type: String, required: true, trim: true },
        format: {
          type: String,
          required: true,
          trim: true,
          enum: ['ebook', 'physical', 'audiobook'],
        },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
    subtotal: { type: Number, default: 0, min: 0 },
    shipping: shippingSchema,
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    payment: {
      method: { type: String, trim: true },
      transactionId: { type: String, trim: true },
      status: { type: String, trim: true },
      paidAt: { type: Date },
    },
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    hasPhysicalItems: {
      type: Boolean,
      default: false,
    },
    notifications: {
      type: notificationsSchema,
      default: () => ({}),
    },
    digitalProducts: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
        format: { type: String, trim: true },
        downloadUrl: { type: String, trim: true },
        expiresAt: { type: Date },
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('validate', function setOrderNumber(next) {
  if (!this.orderNumber) {
    this.orderNumber = `PSW-${Date.now().toString().slice(-6)}`;
  }
  next();
});

orderSchema.pre('save', function setHasPhysicalItems(next) {
  this.hasPhysicalItems = this.items.some((item) => item.format === 'physical');
  next();
});

orderSchema.index({ user: 1, status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
