import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const shippingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const currentlyReadingSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    startedAt: { type: Date, default: Date.now },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
      validate: {
        validator(value) {
          if (!this.googleId && !value) {
            return false;
          }
          return true;
        },
        message: 'Password is required for non-OAuth users',
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    firstName: { type: String, trim: true, maxlength: 50 },
    lastName: { type: String, trim: true, maxlength: 50 },
    role: {
      type: String,
      enum: ['customer', 'admin', 'super_admin'],
      default: 'customer',
      index: true,
    },
    avatar: { type: String, trim: true },
    shippingAddress: shippingAddressSchema,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    stats: {
      totalBooksRead: { type: Number, default: 0 },
      totalPagesRead: { type: Number, default: 0 },
      totalReadingTime: { type: Number, default: 0 },
      currentlyReading: [currentlyReadingSchema],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
