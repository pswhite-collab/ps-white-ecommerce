import '../config/env.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import AdminWhitelist from '../models/AdminWhitelist.js';
import BlogPost from '../models/BlogPost.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import Quote from '../models/Quote.js';
import ReadingProgress from '../models/ReadingProgress.js';
import Review from '../models/Review.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';

const DEFAULT_PASSWORD = 'Password@123';
const DEFAULT_AUTHOR = 'PS White';
const ADMIN_EMAIL = (process.env.ADMIN_WHITELIST_EMAIL || 'pswhite786@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

const svgCoverDataUrl = (title, color1 = '#A39382', color2 = '#232323') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="45%" text-anchor="middle" fill="#FBF7F4" font-family="serif" font-size="28" font-weight="bold">${title}</text>
    <text x="50%" y="55%" text-anchor="middle" fill="#E5DED2" font-family="sans-serif" font-size="16" letter-spacing="4">PS WHITE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const bookSeeds = [
  // 1. All 3 formats, featured
  {
    title: 'The Weight of Silence',
    subtitle: 'A Novel of Grief and Grace',
    genres: ['Literary Fiction', 'Drama'],
    description: 'Set in post-war Kerala, this novel follows a family learning to live with a loss they cannot name out loud. Rich in atmosphere and emotional depth.',
    excerpt: 'The night was heavy with rain and unfinished memories.',
    coverImage: {
      url: svgCoverDataUrl('The Weight of Silence', '#685D54', '#232323'),
      publicId: 'seed/weight-of-silence',
      thumbnail: svgCoverDataUrl('The Weight of Silence', '#685D54', '#232323'),
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 14.99, pageCount: 320 },
      physical: { available: true, price: 24.99, stock: 150, weight: 0.52 },
      audiobook: { available: true, price: 19.99, file: { duration: 630 } },
    },
    featured: true,
    active: true,
  },
  // 2. All 3 formats, featured
  {
    title: 'Between Two Dawns',
    subtitle: 'Truth Never Sleeps',
    genres: ['Mystery', 'Thriller'],
    description: 'A journalist receives an unsigned confession linked to a cold case that once divided her city.',
    excerpt: 'Between two dawns, the secrets of the quiet street had unraveled.',
    coverImage: {
      url: svgCoverDataUrl('Between Two Dawns', '#4A7856', '#232323'),
      publicId: 'seed/between-two-dawns',
      thumbnail: svgCoverDataUrl('Between Two Dawns', '#4A7856', '#232323'),
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 13.99, pageCount: 286 },
      physical: { available: true, price: 22.99, stock: 120, weight: 0.48 },
      audiobook: { available: true, price: 18.99, file: { duration: 540 } },
    },
    featured: true,
    active: true,
  },
  // 3. eBook only, featured (coverImage undefined -> tests gradient fallback)
  {
    title: 'The Architecture of Rain',
    subtitle: 'Reflections on Solitude',
    genres: ['Literary Fiction', 'Philosophy'],
    description: 'An intimate portrait of an architect who retreats to the coast to rebuild his life after personal tragedy.',
    excerpt: 'Rain falls like geometry on cold slate.',
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 12.99, pageCount: 240 },
    },
    featured: true,
    active: true,
  },
  // 4. eBook only, featured (coverImage undefined -> tests gradient fallback)
  {
    title: 'Voices Across the Water',
    subtitle: 'Letters from an Island',
    genres: ['Historical Fiction'],
    description: 'A collection of intertwined epistolary accounts spanning three generations of island lighthouse keepers.',
    excerpt: 'The tide carries letters that paper could never hold.',
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 11.99, pageCount: 210 },
    },
    featured: true,
    active: true,
  },
  // 5. Audiobook only
  {
    title: 'Echoes from the Western Ghats',
    subtitle: 'Immersive Audio Tale',
    genres: ['Nature', 'Literary Fiction'],
    description: 'An evocative audio journey through the cloud forests and river valleys of southern India.',
    coverImage: {
      url: svgCoverDataUrl('Western Ghats', '#B8864A', '#232323'),
      publicId: 'seed/western-ghats',
    },
    languages: ['English'],
    formats: {
      audiobook: { available: true, price: 19.99, file: { duration: 480 } },
    },
    featured: false,
    active: true,
  },
  // 6. Physical only, in stock
  {
    title: 'Paper Lanterns in the Mist',
    subtitle: 'Hardcover Collector Edition',
    genres: ['Poetry', 'Drama'],
    description: 'A poetic celebration of quiet resilience during turbulent eras.',
    coverImage: {
      url: svgCoverDataUrl('Paper Lanterns', '#6B7A8F', '#232323'),
      publicId: 'seed/paper-lanterns',
    },
    languages: ['English'],
    formats: {
      physical: { available: true, price: 21.99, stock: 85, weight: 0.6 },
    },
    featured: false,
    active: true,
  },
  // 7. Physical only, in stock (coverImage undefined -> tests gradient fallback)
  {
    title: 'Shadows on the Verandah',
    subtitle: 'Tales of Old Malabar',
    genres: ['Short Stories'],
    description: 'Twelve evocative short stories exploring family, tradition, and generational transitions.',
    languages: ['English'],
    formats: {
      physical: { available: true, price: 18.50, stock: 40, weight: 0.4 },
    },
    featured: false,
    active: true,
  },
  // 8. Physical only, OUT OF STOCK (stock: 0)
  {
    title: 'The Last Boat to Cochin',
    subtitle: 'Sold Out First Edition',
    genres: ['Historical Fiction'],
    description: 'The gripping journey of seven strangers boarding the final passenger steamship from Bombay to Cochin.',
    coverImage: {
      url: svgCoverDataUrl('Last Boat', '#B85450', '#232323'),
      publicId: 'seed/last-boat',
    },
    languages: ['English'],
    formats: {
      physical: { available: true, price: 23.00, stock: 0, weight: 0.5 },
    },
    featured: false,
    active: true,
  },
  // 9. Physical with LOW STOCK (stock: 2) -> for oversell test (coverImage undefined)
  {
    title: 'Letters to an Absent River',
    subtitle: 'Limited Run',
    genres: ['Literary Fiction'],
    description: 'Meditation on a dried tributary and the village memories that once flowed alongside it.',
    languages: ['English'],
    formats: {
      physical: { available: true, price: 24.50, stock: 2, weight: 0.45 },
    },
    featured: false,
    active: true,
  },
  // 10. All 3 formats
  {
    title: 'Dust and Monsoon',
    subtitle: 'A Season of reckoning',
    genres: ['Drama', 'Romance'],
    description: 'Two estranged childhood friends meet during the first monsoon downpour after twenty years abroad.',
    coverImage: {
      url: svgCoverDataUrl('Dust and Monsoon', '#A39382', '#685D54'),
      publicId: 'seed/dust-monsoon',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 10.99, pageCount: 260 },
      physical: { available: true, price: 20.00, stock: 75, weight: 0.5 },
      audiobook: { available: true, price: 16.00, file: { duration: 420 } },
    },
    featured: false,
    active: true,
  },
  // 11. eBook only (coverImage undefined)
  {
    title: 'Chronicles of an Ancient Courtyard',
    subtitle: 'Ancestral Memories',
    genres: ['Literary Fiction'],
    description: 'Reflections written inside an ancient ancestral home overlooking paddy fields.',
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 9.99, pageCount: 180 },
    },
    featured: false,
    active: true,
  },
  // 12. Very long title & very long description, Historical Fiction
  {
    title: 'A Map of Forgotten Monsoon Winds and Other Long Memories from the Edge of the World',
    subtitle: 'An Epic Chronicle of Seafarers and Scholars Across Five Oceans and Three Centuries',
    genres: ['Historical Fiction'],
    description:
      'Spanning across three centuries and multiple continents, this sprawling literary epic traces the lost journals of spice navigators who charted the dangerous ocean routes between Lisbon, Goa, and Alexandria. Filled with intricate cartographic lore, historical intrigue, forbidden correspondence, and the relentless pull of the open sea, it stands as an unforgettable monument to those who ventured beyond known horizons.',
    coverImage: {
      url: svgCoverDataUrl('Monsoon Winds', '#4A7856', '#685D54'),
      publicId: 'seed/monsoon-winds',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 15.99, pageCount: 650 },
      physical: { available: true, price: 29.99, stock: 50, weight: 0.95 },
    },
    featured: false,
    active: true,
  },
  // 13. Thriller / Noir, eBook + Physical (coverImage undefined)
  {
    title: 'The Silent Cartographer of Calicut',
    subtitle: 'A Malabar Mystery',
    genres: ['Mystery', 'Thriller'],
    description: 'When an antique map maker goes missing from his harbor studio, a retired detective unravels a maritime conspiracy.',
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 12.50, pageCount: 310 },
      physical: { available: true, price: 21.00, stock: 35, weight: 0.55 },
    },
    featured: false,
    active: true,
  },
  // 14. Physical only, in stock
  {
    title: 'Under the Tamarind Canopy',
    subtitle: 'Essays on Memory',
    genres: ['Memoir', 'Essays'],
    description: 'Intimate autobiographical essays examining the roots of storytelling in rural southern India.',
    coverImage: {
      url: svgCoverDataUrl('Tamarind Canopy', '#8F826F', '#232323'),
      publicId: 'seed/tamarind-canopy',
    },
    languages: ['English'],
    formats: {
      physical: { available: true, price: 19.00, stock: 60, weight: 0.4 },
    },
    featured: false,
    active: true,
  },
  // 15. Audiobook only (coverImage undefined)
  {
    title: 'Midnight on Broadway',
    subtitle: 'The Jazz Monologues',
    genres: ['Drama'],
    description: 'An atmospheric audio production set in 1950s jazz clubs.',
    languages: ['English'],
    formats: {
      audiobook: { available: true, price: 17.50, file: { duration: 380 } },
    },
    featured: false,
    active: true,
  },
  // 16. ARCHIVED BOOK (active: false) -> Must be hidden publicly!
  {
    title: 'The Redacted Manuscripts of Fort Kochi',
    subtitle: 'Out of Circulation',
    genres: ['Literary Fiction'],
    description: 'Archived volume retracted from public distribution.',
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 9.99, pageCount: 150 },
      physical: { available: true, price: 15.00, stock: 10, weight: 0.3 },
    },
    featured: false,
    active: false, // Archived
  },
];

const customerSeeds = [
  { email: 'anika@example.com', firstName: 'Anika', lastName: 'Menon' },
  { email: 'rahul@example.com', firstName: 'Rahul', lastName: 'Verma' },
  { email: 'isha@example.com', firstName: 'Isha', lastName: 'Patel' },
  { email: 'david@example.com', firstName: 'David', lastName: 'Miller' },
  { email: 'maria@example.com', firstName: 'Maria', lastName: 'Santos' },
  { email: 'no_orders@example.com', firstName: 'Nora', lastName: 'Oders' },
  {
    email: 'saved_address@example.com',
    firstName: 'Sam',
    lastName: 'Address',
    shippingAddress: {
      firstName: 'Sam',
      lastName: 'Address',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      country: 'United States',
      postalCode: '62704',
      phone: '555-0199',
    },
  },
  {
    email: 'unverified@example.com',
    firstName: 'Uma',
    lastName: 'Unverified',
    emailVerified: false,
  },
  {
    email: 'google_only@example.com',
    firstName: 'Gabe',
    lastName: 'GoogleOnly',
    googleId: 'google_oauth_test_id_123',
    isGoogleOnly: true,
  },
];

const seedSiteSettings = async () => {
  const existing = await Settings.findById('site-settings');
  if (!existing) {
    await Settings.create({
      _id: 'site-settings',
      siteName: 'PS White',
      siteDescription: 'Official website of PS White',
      siteEmail: 'pswhite786@gmail.com',
      allowRegistration: true,
      maintenanceMode: false,
      freeShippingThreshold: 50,
      currency: 'USD',
      timezone: 'America/New_York',
    });
  }
};

const seedAdminUser = async () => {
  await AdminWhitelist.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { $set: { email: ADMIN_EMAIL, role: 'super_admin', active: true } },
    { upsert: true, new: true }
  );

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const user = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        email: ADMIN_EMAIL,
        firstName: 'PS',
        lastName: 'White',
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return user;
};

const seedCustomers = async () => {
  const usersByEmail = new Map();
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const seed of customerSeeds) {
    const updateData = {
      email: seed.email.toLowerCase(),
      firstName: seed.firstName,
      lastName: seed.lastName,
      emailVerified: seed.emailVerified !== undefined ? seed.emailVerified : true,
      role: 'customer',
    };

    if (seed.shippingAddress) {
      updateData.shippingAddress = seed.shippingAddress;
    }
    if (seed.googleId) {
      updateData.googleId = seed.googleId;
    }
    if (!seed.isGoogleOnly) {
      updateData.password = hashedPassword;
    }

    const user = await User.findOneAndUpdate(
      { email: seed.email.toLowerCase() },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    usersByEmail.set(user.email, user);
  }

  return usersByEmail;
};

const seedBooks = async () => {
  const booksByTitle = new Map();

  for (const seed of bookSeeds) {
    const book = await Book.findOneAndUpdate(
      { title: seed.title },
      {
        $set: {
          ...seed,
          author: DEFAULT_AUTHOR,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    booksByTitle.set(book.title, book);
  }

  return booksByTitle;
};

const seedOrders = async (booksByTitle, usersByEmail) => {
  const anika = usersByEmail.get('anika@example.com');
  const rahul = usersByEmail.get('rahul@example.com');
  const savedUser = usersByEmail.get('saved_address@example.com');
  const david = usersByEmail.get('david@example.com');
  const maria = usersByEmail.get('maria@example.com');

  const weightOfSilence = booksByTitle.get('The Weight of Silence');
  const betweenTwoDawns = booksByTitle.get('Between Two Dawns');
  const architecture = booksByTitle.get('The Architecture of Rain');
  const paperLanterns = booksByTitle.get('Paper Lanterns in the Mist');

  if (!anika || !weightOfSilence) return;

  const orderSeeds = [
    // 1. Digital-only, completed (in Anika's library)
    {
      orderNumber: 'ORD-DEMO-001',
      user: anika._id,
      items: [{ book: weightOfSilence._id, title: weightOfSilence.title, format: 'ebook', price: 14.99, quantity: 1 }],
      subtotal: 14.99,
      shipping: { cost: 0, method: 'free' },
      tax: 0,
      total: 14.99,
      currency: 'USD',
      status: 'completed',
      hasPhysicalItems: false,
      payment: { method: 'stripe', status: 'paid', transactionId: 'pi_demo_001', paidAt: new Date() },
      digitalProducts: [{ book: weightOfSilence._id, format: 'ebook', downloadUrl: '/api/reader/download/' + weightOfSilence._id }],
    },
    // 2. Physical-only, processing, below free shipping ($21.99 + $5 = $26.99)
    {
      orderNumber: 'ORD-DEMO-002',
      user: rahul._id,
      items: [{ book: paperLanterns._id, title: paperLanterns.title, format: 'physical', price: 21.99, quantity: 1 }],
      subtotal: 21.99,
      shipping: { cost: 5, method: 'standard' },
      tax: 0,
      total: 26.99,
      currency: 'USD',
      status: 'processing',
      hasPhysicalItems: true,
      shippingAddress: {
        firstName: 'Rahul',
        lastName: 'Verma',
        address: '456 Market St',
        city: 'Austin',
        state: 'TX',
        country: 'United States',
        postalCode: '78701',
        phone: '555-0101',
      },
      payment: { method: 'stripe', status: 'paid', transactionId: 'pi_demo_002', paidAt: new Date() },
    },
    // 3. Mixed order (physical + ebook), shipped with carrier & tracking, above free shipping ($24.99 + $14.99 + $13.99 = $53.97 >= $50 -> shipping free!)
    {
      orderNumber: 'ORD-DEMO-003',
      user: savedUser._id,
      items: [
        { book: weightOfSilence._id, title: weightOfSilence.title, format: 'physical', price: 24.99, quantity: 1 },
        { book: weightOfSilence._id, title: weightOfSilence.title, format: 'ebook', price: 14.99, quantity: 1 },
        { book: betweenTwoDawns._id, title: betweenTwoDawns.title, format: 'ebook', price: 13.99, quantity: 1 },
      ],
      subtotal: 53.97,
      shipping: { cost: 0, method: 'free', carrier: 'FedEx', trackingNumber: 'FDX987654321' },
      tax: 0,
      total: 53.97,
      currency: 'USD',
      status: 'shipped',
      hasPhysicalItems: true,
      shippingAddress: savedUser.shippingAddress,
      payment: { method: 'stripe', status: 'paid', transactionId: 'pi_demo_003', paidAt: new Date() },
      digitalProducts: [
        { book: weightOfSilence._id, format: 'ebook' },
        { book: betweenTwoDawns._id, format: 'ebook' },
      ],
    },
    // 4. Pending order
    {
      orderNumber: 'ORD-DEMO-004',
      user: david._id,
      items: [{ book: architecture._id, title: architecture.title, format: 'ebook', price: 12.99, quantity: 1 }],
      subtotal: 12.99,
      shipping: { cost: 0, method: 'free' },
      tax: 0,
      total: 12.99,
      currency: 'USD',
      status: 'pending',
      payment: { method: 'stripe', status: 'pending' },
    },
    // 5. Cancelled order
    {
      orderNumber: 'ORD-DEMO-005',
      user: maria._id,
      items: [{ book: betweenTwoDawns._id, title: betweenTwoDawns.title, format: 'ebook', price: 13.99, quantity: 1 }],
      subtotal: 13.99,
      shipping: { cost: 0, method: 'free' },
      tax: 0,
      total: 13.99,
      currency: 'USD',
      status: 'cancelled',
      payment: { method: 'stripe', status: 'failed' },
    },
  ];

  for (const seed of orderSeeds) {
    await Order.findOneAndUpdate(
      { orderNumber: seed.orderNumber },
      { $set: seed },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const seedReadingProgress = async (booksByTitle, usersByEmail) => {
  const anika = usersByEmail.get('anika@example.com');
  const rahul = usersByEmail.get('rahul@example.com');
  const weightOfSilence = booksByTitle.get('The Weight of Silence');

  if (!anika || !weightOfSilence) return;

  await ReadingProgress.findOneAndUpdate(
    { user: anika._id, book: weightOfSilence._id },
    {
      $set: {
        user: anika._id,
        book: weightOfSilence._id,
        format: 'ebook',
        currentPosition: {
          cfi: 'epubcfi(/6/4[chap1]!/4/2/1:0)',
          chapter: 'Chapter 1: The Beginning',
          percentage: 35,
          page: 42,
        },
        bookmarks: [
          {
            cfi: 'epubcfi(/6/4[chap1]!/4/2/1:0)',
            chapter: 'Chapter 1',
            percentage: 35,
            page: 42,
            note: 'Memorable line on silence.',
            createdAt: new Date(),
          },
        ],
        completed: false,
        lastRead: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (rahul) {
    await ReadingProgress.findOneAndUpdate(
      { user: rahul._id, book: weightOfSilence._id },
      {
        $set: {
          user: rahul._id,
          book: weightOfSilence._id,
          format: 'ebook',
          currentPosition: { percentage: 100, page: 320, chapter: 'Epilogue' },
          completed: true,
          lastRead: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const seedReviews = async (booksByTitle, usersByEmail) => {
  const anika = usersByEmail.get('anika@example.com');
  const rahul = usersByEmail.get('rahul@example.com');
  const isha = usersByEmail.get('isha@example.com');
  const book = booksByTitle.get('The Weight of Silence');

  if (!book || !anika) return;

  const reviewList = [
    {
      user: anika._id,
      book: book._id,
      rating: 5,
      title: 'Deeply Moving',
      comment: 'PS White captures human emotion with unmatched delicacy.',
      verified: true,
      status: 'approved',
    },
    {
      user: rahul._id,
      book: book._id,
      rating: 4,
      title: 'Atmospheric Storytelling',
      comment: 'Rich descriptions of Kerala and memorable characters.',
      verified: true,
      status: 'approved',
    },
    {
      user: isha._id,
      book: book._id,
      rating: 3,
      title: 'Awaiting moderation review',
      comment: 'A slower paced narrative than anticipated.',
      verified: false,
      status: 'pending',
    },
  ];

  for (const rev of reviewList) {
    await Review.findOneAndUpdate(
      { user: rev.user, book: rev.book },
      { $set: rev },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Recalculate book ratings
  const approvedReviews = await Review.find({ book: book._id, status: 'approved' });
  const total = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = approvedReviews.length > 0 ? Number((total / approvedReviews.length).toFixed(2)) : 0;
  await Book.findByIdAndUpdate(book._id, {
    averageRating,
    reviewCount: approvedReviews.length,
    reviews: approvedReviews.map((r) => r._id),
  });
};

const seedBlogAndQuotes = async (adminId) => {
  const posts = [
    {
      title: 'The Solitude of Writing',
      slug: 'the-solitude-of-writing',
      content: 'Writing is fundamentally an act of listening to what the heart keeps hidden in ordinary hours.',
      excerpt: 'Reflections on finding quiet in a world filled with constant noise.',
      category: 'Writing Life',
      published: true,
      publishDate: new Date(),
      author: DEFAULT_AUTHOR,
    },
    {
      title: 'Draft: Thoughts on the Monsoon Cycle',
      slug: 'thoughts-on-the-monsoon-cycle',
      content: 'Upcoming essay about water and landscape.',
      excerpt: 'Draft essay notes.',
      category: 'Essays',
      published: false,
      author: DEFAULT_AUTHOR,
    },
  ];

  for (const post of posts) {
    await BlogPost.findOneAndUpdate(
      { slug: post.slug },
      { $set: post },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const quotes = [
    {
      text: 'What remains after a promise breaks is not always silence. Sometimes it is the courage to begin again.',
      author: DEFAULT_AUTHOR,
      category: 'Memory',
      active: true,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: adminId,
    },
    {
      text: 'In quiet corners, memories find their true names.',
      author: DEFAULT_AUTHOR,
      category: 'Reflection',
      active: true,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      createdBy: adminId,
    },
  ];

  for (const q of quotes) {
    await Quote.findOneAndUpdate(
      { text: q.text },
      { $set: q },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

export const runSeed = async () => {
  await connectDB();
  const dbName = mongoose.connection.name;
  console.log(`Connected to database for seed: ${dbName}`);

  if (!dbName.endsWith('_local') && !dbName.endsWith('_test')) {
    console.error(`REFUSING TO SEED: Database name "${dbName}" does not end with _local or _test!`);
    process.exit(1);
  }

  await seedSiteSettings();
  const admin = await seedAdminUser();
  const booksByTitle = await seedBooks();
  const usersByEmail = await seedCustomers();
  await seedOrders(booksByTitle, usersByEmail);
  await seedReadingProgress(booksByTitle, usersByEmail);
  await seedReviews(booksByTitle, usersByEmail);
  await seedBlogAndQuotes(admin._id);

  console.log('Seed completed successfully.');
  console.log(`- Database: ${dbName}`);
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Books available: ${booksByTitle.size}`);
  console.log(`- Customer test users: ${usersByEmail.size}`);
};

if (process.argv[1] && process.argv[1].endsWith('seedDatabase.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      mongoose.connection.close();
    });
}

export default runSeed;
