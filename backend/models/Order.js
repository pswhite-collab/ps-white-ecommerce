import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    phone: { type: String, trim: true },
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
        format: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
    subtotal: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
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

const Order = mongoose.model('Order', orderSchema);

export default Order;
