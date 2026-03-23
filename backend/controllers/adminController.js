import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import ReadingProgress from '../models/ReadingProgress.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

const SALES_STATUSES = ['processing', 'shipped', 'delivered', 'completed'];

const resolvePagination = (query, defaults = { page: 1, limit: 20, maxLimit: 100 }) => {
  const page = Math.max(1, Number.parseInt(query.page || `${defaults.page}`, 10));
  const limit = Math.min(
    defaults.maxLimit,
    Math.max(1, Number.parseInt(query.limit || `${defaults.limit}`, 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSalesOverview = async () => {
  const [totalRevenueAgg, totalOrders, totalCustomers, totalBooks] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: SALES_STATUSES } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Book.countDocuments({ active: true }),
  ]);

  const totalRevenue = Number(totalRevenueAgg[0]?.total || 0);
  const averageOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalBooks,
    averageOrderValue,
  };
};

const buildReadingAnalyticsPayload = async () => {
  const [mostReadRaw, progressRows, activeReaderIds] = await Promise.all([
    ReadingProgress.aggregate([
      {
        $group: {
          _id: '$book',
          readers: { $sum: 1 },
          averageProgress: { $avg: '$progressPercentage' },
          averageReadingTime: { $avg: '$totalReadingTime' },
          completedCount: {
            $sum: {
              $cond: [{ $gte: ['$progressPercentage', 100] }, 1, 0],
            },
          },
        },
      },
      { $sort: { readers: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book',
        },
      },
      {
        $unwind: {
          path: '$book',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          bookId: '$_id',
          title: '$book.title',
          readers: 1,
          averageProgress: 1,
          averageReadingTime: 1,
          completedCount: 1,
        },
      },
    ]),
    ReadingProgress.find().select('currentPage totalReadingTime progressPercentage').lean(),
    ReadingProgress.distinct('user', { progressPercentage: { $gt: 0, $lt: 100 } }),
  ]);

  const totals = progressRows.reduce(
    (acc, row) => {
      acc.totalPagesRead += row.currentPage || 0;
      acc.totalReadingTime += row.totalReadingTime || 0;
      if ((row.progressPercentage || 0) >= 100) {
        acc.booksCompleted += 1;
      }
      if ((row.progressPercentage || 0) > 0 && (row.progressPercentage || 0) < 100) {
        acc.booksInProgress += 1;
      }
      return acc;
    },
    { totalPagesRead: 0, totalReadingTime: 0, booksCompleted: 0, booksInProgress: 0 }
  );

  const totalTrackedBooks = progressRows.length;
  const averageCompletionRate =
    totalTrackedBooks > 0
      ? Number(
          (
            progressRows.reduce((sum, row) => sum + (row.progressPercentage || 0), 0) /
            totalTrackedBooks
          ).toFixed(2)
        )
      : 0;

  return {
    activeReaders: activeReaderIds.length,
    totalTrackedBooks,
    totalPagesRead: totals.totalPagesRead,
    totalReadingTime: totals.totalReadingTime,
    booksCompleted: totals.booksCompleted,
    booksInProgress: totals.booksInProgress,
    averageCompletionRate,
    mostReadBooks: mostReadRaw.map((item) => ({
      ...item,
      title: item.title || 'Unknown Title',
      averageProgress: Number((item.averageProgress || 0).toFixed(1)),
      averageReadingTime: Number((item.averageReadingTime || 0).toFixed(1)),
    })),
  };
};

const getAdminOrdersList = async (query = {}) => {
  const { page, limit, skip } = resolvePagination(query, { page: 1, limit: 20, maxLimit: 100 });
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filters.$or = [
      { orderNumber: { $regex: escaped, $options: 'i' } },
      { guestEmail: { $regex: escaped, $options: 'i' } },
    ];
  }

  const dateFromRaw = query.dateFrom || query.date_from;
  const dateToRaw = query.dateTo || query.date_to;
  if (dateFromRaw || dateToRaw) {
    filters.createdAt = {};

    if (dateFromRaw) {
      const fromDate = new Date(dateFromRaw);
      if (!Number.isNaN(fromDate.getTime())) {
        filters.createdAt.$gte = fromDate;
      }
    }

    if (dateToRaw) {
      const toDate = new Date(dateToRaw);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        filters.createdAt.$lte = toDate;
      }
    }

    if (!Object.keys(filters.createdAt).length) {
      delete filters.createdAt;
    }
  }

  if (query.userId && mongoose.Types.ObjectId.isValid(query.userId)) {
    filters.user = new mongoose.Types.ObjectId(query.userId);
  }

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filters),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const getAdminDashboard = async (_req, res, next) => {
  try {
    const [sales, reading, recentOrders, topBooks] = await Promise.all([
      buildSalesOverview(),
      buildReadingAnalyticsPayload(),
      Order.find()
        .select('orderNumber total status createdAt user guestEmail')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Book.find({ active: true }).select('title totalSales').sort({ totalSales: -1 }).limit(5).lean(),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          ...sales,
          activeReaders: reading.activeReaders,
        },
        reading,
        recentOrders,
        topBooks,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getDashboardReadingStats = async (_req, res, next) => {
  try {
    const reading = await buildReadingAnalyticsPayload();
    return res.json({ success: true, data: { reading } });
  } catch (error) {
    return next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const data = await getAdminOrdersList(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getAdminCustomers = async (req, res, next) => {
  try {
    const { page, limit, skip } = resolvePagination(req.query, { page: 1, limit: 20, maxLimit: 100 });

    const [customers, total] = await Promise.all([
      User.find({ role: 'customer' })
        .select('firstName lastName email stats createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: 'customer' }),
    ]);

    const customerIds = customers.map((customer) => customer._id);
    const [orderAgg, readingAgg, reviewAgg] = customerIds.length
      ? await Promise.all([
          Order.aggregate([
            { $match: { user: { $in: customerIds } } },
            {
              $group: {
                _id: '$user',
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$total' },
              },
            },
          ]),
          ReadingProgress.aggregate([
            { $match: { user: { $in: customerIds } } },
            {
              $group: {
                _id: '$user',
                currentlyReading: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gt: ['$progressPercentage', 0] },
                          { $lt: ['$progressPercentage', 100] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                completedBooks: {
                  $sum: {
                    $cond: [{ $gte: ['$progressPercentage', 100] }, 1, 0],
                  },
                },
              },
            },
          ]),
          Review.aggregate([
            { $match: { user: { $in: customerIds } } },
            { $group: { _id: '$user', totalReviews: { $sum: 1 } } },
          ]),
        ])
      : [[], [], []];

    const orderMap = new Map(orderAgg.map((row) => [String(row._id), row]));
    const readingMap = new Map(readingAgg.map((row) => [String(row._id), row]));
    const reviewMap = new Map(reviewAgg.map((row) => [String(row._id), row.totalReviews]));

    const enrichedCustomers = customers.map((customer) => {
      const order = orderMap.get(String(customer._id));
      const reading = readingMap.get(String(customer._id));

      return {
        ...customer,
        orderSummary: {
          totalOrders: order?.totalOrders || 0,
          totalSpent: Number((order?.totalSpent || 0).toFixed(2)),
        },
        readingSummary: {
          currentlyReading: reading?.currentlyReading || 0,
          completedBooks: reading?.completedBooks || 0,
        },
        totalReviews: reviewMap.get(String(customer._id)) || 0,
      };
    });

    return res.json({
      success: true,
      data: {
        customers: enrichedCustomers,
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

export const getAdminCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid customer id' });
    }

    const customer = await User.findOne({ _id: id, role: 'customer' })
      .select('firstName lastName email stats createdAt shippingAddress wishlist')
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const [recentOrders, readingProgress, orderSummaryAgg, totalReviews] = await Promise.all([
      Order.find({ user: customer._id })
        .select('orderNumber total status createdAt items')
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
      ReadingProgress.find({ user: customer._id })
        .populate('book', 'title coverImage formats.ebook.pageCount')
        .sort({ lastReadAt: -1 })
        .lean(),
      Order.aggregate([
        { $match: { user: customer._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
          },
        },
      ]),
      Review.countDocuments({ user: customer._id }),
    ]);

    const orderSummary = orderSummaryAgg[0] || { totalOrders: 0, totalSpent: 0 };

    return res.json({
      success: true,
      data: {
        customer,
        orderSummary: {
          totalOrders: orderSummary.totalOrders || 0,
          totalSpent: Number((orderSummary.totalSpent || 0).toFixed(2)),
        },
        totalReviews,
        recentOrders,
        readingProgress,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getCustomerReading = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid customer id' });
    }

    const customer = await User.findOne({ _id: id, role: 'customer' })
      .select('firstName lastName email')
      .lean();
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const readingProgress = await ReadingProgress.find({ user: customer._id })
      .populate('book', 'title coverImage formats.ebook.pageCount')
      .sort({ lastReadAt: -1 })
      .lean();

    const summary = readingProgress.reduce(
      (acc, row) => {
        acc.totalBooks += 1;
        acc.totalPagesRead += row.currentPage || 0;
        acc.totalReadingTime += row.totalReadingTime || 0;
        if ((row.progressPercentage || 0) >= 100) {
          acc.completed += 1;
        }
        if ((row.progressPercentage || 0) > 0 && (row.progressPercentage || 0) < 100) {
          acc.currentlyReading += 1;
        }
        return acc;
      },
      { totalBooks: 0, totalPagesRead: 0, totalReadingTime: 0, completed: 0, currentlyReading: 0 }
    );

    return res.json({
      success: true,
      data: {
        customer,
        summary,
        readingProgress,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getReadingAnalytics = async (_req, res, next) => {
  try {
    const reading = await buildReadingAnalyticsPayload();
    return res.json({ success: true, data: reading });
  } catch (error) {
    return next(error);
  }
};

export const getAdminAnalytics = async (_req, res, next) => {
  try {
    const [sales, reading] = await Promise.all([buildSalesOverview(), buildReadingAnalyticsPayload()]);
    return res.json({ success: true, data: { sales, reading } });
  } catch (error) {
    return next(error);
  }
};
