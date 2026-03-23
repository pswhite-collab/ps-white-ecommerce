import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import AdminWhitelist from '../models/AdminWhitelist.js';
import BlogPost from '../models/BlogPost.js';
import Book from '../models/Book.js';
import Quote from '../models/Quote.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

dotenv.config();

const DEFAULT_PASSWORD = 'Password@123';
const DEFAULT_AUTHOR = 'PS White';
const ADMIN_EMAIL = (process.env.ADMIN_WHITELIST_EMAIL || 'pswhite786@gmail.com').toLowerCase();

const loremExcerpt =
  'The night was heavy with rain and unfinished memories. In the quiet between thunder and breath, every page of the past felt newly alive, asking difficult questions about love, guilt, and the cost of becoming someone else. Streets slept beneath dim lamps while old letters waited in locked drawers, and somewhere a train crossed the river like a thought refusing to fade. What remains after a promise breaks is not always silence. Sometimes it is a softer language made of small acts, second chances, and the courage to stay when leaving would be easier. Through monsoon skies and restless mornings, each chapter follows hearts learning to forgive, to return, and to begin again with open hands.';

const bookSeeds = [
  {
    title: 'The Weight of Silence',
    subtitle: 'A Novel of Grief and Grace',
    genres: ['Literary Fiction', 'Drama'],
    description:
      'Set in post-war Kerala, this novel follows a family learning to live with a loss they cannot name out loud. As old secrets surface, each character is forced to choose between comfort and truth. Rich in atmosphere and emotional depth, it is a story about memory, guilt, and redemption.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000001/ps-white/covers/the-weight-of-silence.jpg',
      publicId: 'ps-white/covers/the-weight-of-silence',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000001/ps-white/covers/the-weight-of-silence.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: {
        available: true,
        price: 14.99,
        files: {
          epub: {
            url: 'https://res.cloudinary.com/demo/raw/upload/v1700000001/ps-white/ebooks/the-weight-of-silence.epub',
            publicId: 'ps-white/ebooks/the-weight-of-silence-epub',
            size: 2400000,
          },
          pdf: {
            url: 'https://res.cloudinary.com/demo/raw/upload/v1700000001/ps-white/ebooks/the-weight-of-silence.pdf',
            publicId: 'ps-white/ebooks/the-weight-of-silence-pdf',
            size: 6800000,
          },
        },
        pageCount: 320,
      },
      physical: {
        available: true,
        price: 24.99,
        stock: 150,
        weight: 0.52,
        dimensions: { length: 21, width: 14, height: 2.4 },
      },
      audiobook: {
        available: true,
        price: 19.99,
        file: {
          url: 'https://res.cloudinary.com/demo/video/upload/v1700000001/ps-white/audio/the-weight-of-silence.mp3',
          publicId: 'ps-white/audio/the-weight-of-silence',
          size: 98000000,
          duration: 630,
        },
      },
    },
    featured: true,
    active: true,
  },
  {
    title: 'Between Two Dawns',
    subtitle: 'Truth Never Sleeps',
    genres: ['Mystery', 'Thriller'],
    description:
      'A journalist receives an unsigned confession linked to a cold case that once divided her city. What begins as an assignment turns into a race against power, fear, and a clock that will not stop. Tense and layered, this thriller explores the price of uncovering the truth.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000002/ps-white/covers/between-two-dawns.jpg',
      publicId: 'ps-white/covers/between-two-dawns',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000002/ps-white/covers/between-two-dawns.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 13.99, pageCount: 286 },
      physical: {
        available: true,
        price: 22.99,
        stock: 120,
        weight: 0.48,
        dimensions: { length: 21, width: 14, height: 2.1 },
      },
      audiobook: { available: true, price: 18.99 },
    },
    featured: true,
    active: true,
  },
  {
    title: 'A Garden of Echoes',
    subtitle: 'Love in the Time of Distance',
    genres: ['Romance', 'Contemporary Fiction'],
    description:
      'Two strangers meet through letters that were never meant to be sent. Across cities and seasons, their words build a world where love feels possible again. Tender and intimate, this story celebrates vulnerability, hope, and emotional courage.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000003/ps-white/covers/a-garden-of-echoes.jpg',
      publicId: 'ps-white/covers/a-garden-of-echoes',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000003/ps-white/covers/a-garden-of-echoes.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 11.99, pageCount: 274 },
      physical: {
        available: true,
        price: 20.99,
        stock: 110,
        weight: 0.44,
        dimensions: { length: 20, width: 13, height: 1.8 },
      },
      audiobook: { available: false, price: 0 },
    },
    featured: true,
    active: true,
  },
  {
    title: 'Letters to the Unsent',
    subtitle: 'Poems for Quiet Hearts',
    genres: ['Poetry'],
    description:
      'An intimate collection of poems about longing, healing, and the language we carry in silence. Each piece is crafted with gentle precision and emotional honesty. Perfect for readers who seek reflection and calm in the middle of noise.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000004/ps-white/covers/letters-to-the-unsent.jpg',
      publicId: 'ps-white/covers/letters-to-the-unsent',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000004/ps-white/covers/letters-to-the-unsent.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 9.99, pageCount: 160 },
      physical: {
        available: true,
        price: 17.99,
        stock: 90,
        weight: 0.31,
        dimensions: { length: 19, width: 12, height: 1.4 },
      },
      audiobook: { available: false, price: 0 },
    },
    featured: true,
    active: true,
  },
  {
    title: 'The Monsoon Diaries',
    subtitle: 'Memoirs of Rain and Return',
    genres: ['Memoir', 'Non-fiction'],
    description:
      'In this personal memoir, PS White traces formative years through family, migration, and the monsoons that shaped every beginning and ending. Honest and observant, these essays explore identity, belonging, and reinvention with warmth.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000005/ps-white/covers/the-monsoon-diaries.jpg',
      publicId: 'ps-white/covers/the-monsoon-diaries',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000005/ps-white/covers/the-monsoon-diaries.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 12.99, pageCount: 238 },
      physical: {
        available: true,
        price: 21.99,
        stock: 100,
        weight: 0.39,
        dimensions: { length: 20, width: 13, height: 1.7 },
      },
      audiobook: { available: true, price: 16.99 },
    },
    featured: false,
    active: true,
  },
  {
    title: 'Midnight in Mumbai',
    subtitle: 'A Crime Story',
    genres: ['Crime', 'Thriller'],
    description:
      'A suspended detective is pulled into one final unofficial case that connects city politics to a string of disappearances. Fast-paced and cinematic, this novel captures Mumbai at night in all its danger and beauty.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000006/ps-white/covers/midnight-in-mumbai.jpg',
      publicId: 'ps-white/covers/midnight-in-mumbai',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000006/ps-white/covers/midnight-in-mumbai.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 13.49, pageCount: 301 },
      physical: {
        available: true,
        price: 23.49,
        stock: 125,
        weight: 0.5,
        dimensions: { length: 21, width: 14, height: 2.2 },
      },
      audiobook: { available: true, price: 18.49 },
    },
    featured: false,
    active: true,
  },
  {
    title: "The Stargazer's Daughter",
    subtitle: 'History, Hope, and Inheritance',
    genres: ['Historical Fiction'],
    description:
      'Spanning three decades, this historical novel follows a young woman preserving her family legacy through letters, maps, and the stars. A sweeping narrative about lineage, duty, and the freedom to rewrite inherited stories.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000007/ps-white/covers/the-stargazers-daughter.jpg',
      publicId: 'ps-white/covers/the-stargazers-daughter',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000007/ps-white/covers/the-stargazers-daughter.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 12.49, pageCount: 294 },
      physical: {
        available: true,
        price: 22.49,
        stock: 115,
        weight: 0.46,
        dimensions: { length: 21, width: 14, height: 2.0 },
      },
      audiobook: { available: false, price: 0 },
    },
    featured: false,
    active: true,
  },
  {
    title: 'Finding Home',
    subtitle: 'A Contemporary Journey',
    genres: ['Contemporary Fiction', 'Drama'],
    description:
      'After a decade abroad, a musician returns home to rebuild relationships and rediscover meaning. Through friendship, failure, and second chances, this contemporary novel asks what it really means to belong.',
    excerpt: loremExcerpt,
    coverImage: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1700000008/ps-white/covers/finding-home.jpg',
      publicId: 'ps-white/covers/finding-home',
      thumbnail:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_480,h_640/v1700000008/ps-white/covers/finding-home.jpg',
    },
    languages: ['English'],
    formats: {
      ebook: { available: true, price: 11.49, pageCount: 248 },
      physical: {
        available: true,
        price: 19.99,
        stock: 130,
        weight: 0.41,
        dimensions: { length: 20, width: 13, height: 1.9 },
      },
      audiobook: { available: true, price: 15.49 },
    },
    featured: false,
    active: true,
  },
];

const reviewSeeds = [
  { book: 'The Weight of Silence', user: 'anika@example.com', rating: 5, title: 'Beautifully written', comment: 'A moving and deeply human novel. The prose is elegant and the emotional arc feels honest from beginning to end.' },
  { book: 'The Weight of Silence', user: 'rahul@example.com', rating: 5, title: 'Could not put it down', comment: 'The pacing is quiet but gripping. Every chapter reveals something meaningful.' },
  { book: 'Between Two Dawns', user: 'isha@example.com', rating: 4, title: 'Sharp thriller', comment: 'Excellent tension and atmosphere. The final twist landed perfectly.' },
  { book: 'Between Two Dawns', user: 'anika@example.com', rating: 5, title: 'Top-tier mystery', comment: 'Great character work and a mystery that never feels predictable.' },
  { book: 'A Garden of Echoes', user: 'david@example.com', rating: 4, title: 'Tender and sincere', comment: 'A soft, emotional story with strong chemistry between the leads.' },
  { book: 'Letters to the Unsent', user: 'maria@example.com', rating: 5, title: 'Pure poetry', comment: 'Short poems, big feelings. I keep returning to this collection.' },
  { book: 'The Monsoon Diaries', user: 'isha@example.com', rating: 4, title: 'Thoughtful memoir', comment: 'A personal and reflective read with vivid cultural detail.' },
  { book: 'Midnight in Mumbai', user: 'rahul@example.com', rating: 5, title: 'Fast and cinematic', comment: 'High-stakes crime story with great city atmosphere and memorable side characters.' },
  { book: "The Stargazer's Daughter", user: 'david@example.com', rating: 4, title: 'Epic and heartfelt', comment: 'The historical backdrop is rich and immersive, with strong emotional payoff.' },
  { book: 'Finding Home', user: 'maria@example.com', rating: 5, title: 'Warm and relatable', comment: 'A story of returning and rebuilding that feels genuine and hopeful.' },
  { book: 'Finding Home', user: 'anika@example.com', rating: 4, title: 'Comforting read', comment: 'A grounded contemporary novel with realistic relationships and growth.' },
  { book: 'The Monsoon Diaries', user: 'rahul@example.com', rating: 5, title: 'Beautifully observed', comment: 'Loved the writing style and honesty in each chapter.' },
];

const blogSeeds = [
  {
    title: 'Welcome to My Literary World',
    category: 'Announcements',
    excerpt: 'A quick hello and a glimpse into the stories, themes, and voices that inspire my writing journey.',
    content:
      'Welcome to the official PS White blog. This space is where I will share behind-the-scenes notes, writing updates, and reflections from the road. If you love stories that stay with you, you are in the right place.',
  },
  {
    title: "The Story Behind 'The Weight of Silence'",
    category: 'Behind the Book',
    excerpt: 'How memory, family history, and Kerala landscapes shaped my most personal novel to date.',
    content:
      "The Weight of Silence began with a single question: what do families carry forward when they avoid the truth? In this post, I share the themes, research, and moments that shaped the book's emotional core.",
  },
  {
    title: '5 Writing Tips for Aspiring Authors',
    category: 'Writing Craft',
    excerpt: 'Practical lessons on routine, revision, character depth, and finishing your first complete draft.',
    content:
      'Write consistently, edit ruthlessly, and read widely. These are the foundations I return to in every project. Here are five practical habits that help transform ideas into finished manuscripts.',
  },
  {
    title: 'Why I Write About India',
    category: 'Author Notes',
    excerpt: 'A reflection on place, language, memory, and why Indian stories continue to shape my imagination.',
    content:
      'India is not just a setting in my books, it is a living character. Its contrasts, rhythms, and emotional landscapes influence the way I build scenes, dialogue, and conflict.',
  },
  {
    title: 'Upcoming Events & Book Signings 2026',
    category: 'Events',
    excerpt: 'Where to meet me this year, including readings, literary festivals, and signing sessions.',
    content:
      'I am excited to meet readers across multiple cities this year. This post will be updated with event dates, venue details, and registration links as they are confirmed.',
  },
];

const quoteSeeds = [
  {
    text: 'A book is a dream that you hold in your hand.',
    author: 'Neil Gaiman',
    category: 'reading',
  },
  {
    text: 'There is no greater agony than bearing an untold story inside you.',
    author: 'Maya Angelou',
    category: 'writing',
  },
  {
    text: 'Reading is to the mind what exercise is to the body.',
    author: 'Joseph Addison',
    category: 'motivation',
  },
];

const customerSeeds = [
  { email: 'anika@example.com', firstName: 'Anika', lastName: 'Sharma' },
  { email: 'rahul@example.com', firstName: 'Rahul', lastName: 'Menon' },
  { email: 'isha@example.com', firstName: 'Isha', lastName: 'Kapoor' },
  { email: 'david@example.com', firstName: 'David', lastName: 'Thomas' },
  { email: 'maria@example.com', firstName: 'Maria', lastName: 'Fernandez' },
];

const ensureUser = async ({
  email,
  firstName,
  lastName,
  role = 'customer',
  password = DEFAULT_PASSWORD,
}) => {
  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      role,
      emailVerified: true,
    });
    return user;
  }

  let shouldSave = false;

  if (!user.firstName && firstName) {
    user.firstName = firstName;
    shouldSave = true;
  }
  if (!user.lastName && lastName) {
    user.lastName = lastName;
    shouldSave = true;
  }
  if (!user.emailVerified) {
    user.emailVerified = true;
    shouldSave = true;
  }
  if (role && user.role !== role && normalizedEmail === ADMIN_EMAIL) {
    user.role = role;
    shouldSave = true;
  }
  if (!user.password && !user.googleId && password) {
    user.password = password;
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  return user;
};

const seedAdminUser = async () => {
  const admin = await ensureUser({
    email: ADMIN_EMAIL,
    firstName: 'PS',
    lastName: 'White',
    role: 'admin',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  });

  await AdminWhitelist.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        email: ADMIN_EMAIL,
        role: 'super_admin',
        active: true,
      },
    },
    { upsert: true, new: true }
  );

  return admin;
};

const seedBooks = async () => {
  const booksByTitle = new Map();

  for (const seed of bookSeeds) {
    let book = await Book.findOne({ title: seed.title });
    if (!book) {
      book = await Book.create({
        ...seed,
        author: DEFAULT_AUTHOR,
      });
    }
    booksByTitle.set(book.title, book);
  }

  return booksByTitle;
};

const seedCustomers = async () => {
  const usersByEmail = new Map();
  for (const seed of customerSeeds) {
    const user = await ensureUser(seed);
    usersByEmail.set(user.email.toLowerCase(), user);
  }
  return usersByEmail;
};

const recalculateBookRatings = async (book) => {
  const reviews = await Review.find({ book: book._id, status: 'approved' });
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? Number((total / reviews.length).toFixed(2)) : 0;

  await Book.findByIdAndUpdate(book._id, {
    $set: {
      averageRating,
      reviews: reviews.map((review) => review._id),
    },
  });
};

const seedReviews = async (booksByTitle, usersByEmail) => {
  let createdOrUpdated = 0;

  for (const seed of reviewSeeds) {
    const book = booksByTitle.get(seed.book);
    const user = usersByEmail.get(seed.user);

    if (!book || !user) {
      continue;
    }

    await Review.findOneAndUpdate(
      { book: book._id, user: user._id },
      {
        $set: {
          rating: seed.rating,
          title: seed.title,
          comment: seed.comment,
          verified: true,
          status: 'approved',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdOrUpdated += 1;
  }

  for (const book of booksByTitle.values()) {
    await recalculateBookRatings(book);
  }

  return createdOrUpdated;
};

const seedBlogPosts = async () => {
  let created = 0;

  for (const seed of blogSeeds) {
    const slug = seed.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 100);

    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      continue;
    }

    await BlogPost.create({
      ...seed,
      author: DEFAULT_AUTHOR,
      slug,
      featuredImage: `https://res.cloudinary.com/demo/image/upload/v1700000100/ps-white/blog/${slug}.jpg`,
      published: true,
      publishDate: new Date(),
    });
    created += 1;
  }

  return created;
};

const seedQuotes = async (adminId) => {
  const now = new Date();
  let created = 0;

  for (let index = 0; index < quoteSeeds.length; index += 1) {
    const seed = quoteSeeds[index];
    const startDate = new Date(now.getTime() + index * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + (index + 1) * 24 * 60 * 60 * 1000);

    const existing = await Quote.findOne({
      text: seed.text,
      author: seed.author,
    });

    if (existing) {
      continue;
    }

    await Quote.create({
      text: seed.text,
      author: seed.author,
      category: seed.category,
      startDate,
      endDate,
      active: true,
      createdBy: adminId,
    });
    created += 1;
  }

  return created;
};

const runSeed = async () => {
  await connectDB();

  const admin = await seedAdminUser();
  const booksByTitle = await seedBooks();
  const usersByEmail = await seedCustomers();
  const reviewCount = await seedReviews(booksByTitle, usersByEmail);
  const blogCount = await seedBlogPosts();
  const quoteCount = await seedQuotes(admin._id);

  console.log('Seed completed successfully.');
  console.log(`Admin ready: ${admin.email}`);
  console.log(`Books available: ${booksByTitle.size}`);
  console.log(`Customer test users: ${usersByEmail.size}`);
  console.log(`Reviews seeded: ${reviewCount}`);
  console.log(`Blog posts created: ${blogCount}`);
  console.log(`Quotes created: ${quoteCount}`);
  console.log('Test user password:', DEFAULT_PASSWORD);
};

runSeed()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
