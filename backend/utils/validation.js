import Joi from 'joi';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const isbnRegex =
  /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().min(16).required(),
  password: Joi.string().min(8).required(),
});

export const updateMeSchema = Joi.object({
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50),
  avatar: Joi.string().uri(),
  shippingAddress: Joi.object({
    firstName: Joi.string().allow('', null),
    lastName: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    addressLine2: Joi.string().allow('', null),
    street: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    postalCode: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
  }),
});

export const bookMutationSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  subtitle: Joi.string().allow('', null),
  author: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  excerpt: Joi.string().allow('', null),
  genres: Joi.array().items(Joi.string()).default([]),
  languages: Joi.array().items(Joi.string()).default([]),
  featured: Joi.boolean().default(false),
  active: Joi.boolean().default(true),
  formats: Joi.object({
    ebook: Joi.object({
      available: Joi.boolean().default(false),
      price: Joi.number().min(0).default(0),
      pageCount: Joi.number().min(0).default(0),
    }).default(),
    physical: Joi.object({
      available: Joi.boolean().default(false),
      price: Joi.number().min(0).default(0),
      stock: Joi.number().min(0).default(0),
      weight: Joi.number().min(0).default(0),
      dimensions: Joi.object({
        length: Joi.number().min(0).default(0),
        width: Joi.number().min(0).default(0),
        height: Joi.number().min(0).default(0),
      }).default(),
      isbn: Joi.string().trim().pattern(isbnRegex).allow('', null),
      publisher: Joi.string().allow('', null),
      publicationDate: Joi.date().allow(null),
      binding: Joi.string().valid('Hardcover', 'Paperback', 'Mass Market Paperback').default('Paperback'),
      pages: Joi.number().min(0).default(0),
      language: Joi.string().allow('', null).default('English'),
    }).default(),
    audiobook: Joi.object({
      available: Joi.boolean().default(false),
      price: Joi.number().min(0).default(0),
    }).default(),
  }).default(),
});

export const reviewSchema = Joi.object({
  bookId: Joi.string().pattern(objectIdRegex).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().allow('', null).max(120),
  comment: Joi.string().trim().min(1).max(1500).required(),
});

export const bookmarkSchema = Joi.object({
  page: Joi.number().integer().min(0).required(),
  note: Joi.string().allow('', null).max(500).default(''),
});

export const readingSettingsSchema = Joi.object({
  fontSize: Joi.number().min(80).max(180),
  fontFamily: Joi.string().max(50),
  theme: Joi.string().valid('light', 'dark', 'sepia'),
  lineSpacing: Joi.number().min(1).max(2.5),
});

export const progressUpdateSchema = Joi.object({
  currentPage: Joi.number().integer().min(0).required(),
  totalPages: Joi.number().integer().min(0),
  readingMinutes: Joi.number().min(0).default(0),
});

export const orderCreateSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        book: Joi.string().pattern(objectIdRegex).required(),
        format: Joi.string().valid('ebook', 'physical', 'audiobook').required(),
        quantity: Joi.number().integer().min(1).default(1),
      })
    )
    .min(1)
    .required(),
  shippingAddress: Joi.object({
    firstName: Joi.string().allow('', null),
    lastName: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    addressLine2: Joi.string().allow('', null),
    fullName: Joi.string().allow('', null),
    street: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    postalCode: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
  }).default({}),
  billingAddress: Joi.object({
    firstName: Joi.string().allow('', null),
    lastName: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    addressLine2: Joi.string().allow('', null),
    fullName: Joi.string().allow('', null),
    street: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    postalCode: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    sameAsShipping: Joi.boolean(),
  }).default({}),
  paymentMethod: Joi.string().valid('razorpay', 'stripe', 'cod').default('razorpay'),
  currency: Joi.string().length(3).default('INR'),
  guestEmail: Joi.string().email().allow('', null),
});

export const newsletterSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const blogMutationSchema = Joi.object({
  title: Joi.string().required(),
  slug: Joi.string().allow('', null),
  excerpt: Joi.string().allow('', null),
  content: Joi.string().required(),
  category: Joi.string().allow('', null),
  featuredImage: Joi.string().uri().allow('', null),
  published: Joi.boolean().default(false),
  publishDate: Joi.date().allow(null),
  commentsEnabled: Joi.boolean().default(true),
});

export default {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  bookMutationSchema,
  reviewSchema,
  bookmarkSchema,
  readingSettingsSchema,
  progressUpdateSchema,
  orderCreateSchema,
  newsletterSchema,
  blogMutationSchema,
};
