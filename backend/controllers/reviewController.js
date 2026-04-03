import Review from '../models/Review.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import { serializeReviewsForClient } from '../utils/serializeBookForClient.js';
import { reviewSchema } from '../utils/validation.js';

const PURCHASE_STATUSES = ['processing', 'shipped', 'delivered', 'completed'];

const checkOwnership = async (userId, bookId) => {
  const order = await Order.findOne({
    user: userId,
    status: { $in: PURCHASE_STATUSES },
    'items.book': bookId,
  });

  return Boolean(order);
};

const refreshBookReviewStats = async (bookId) => {
  const approvedReviews = await Review.find({ book: bookId, status: 'approved' }).select('_id rating');
  const reviewCount = approvedReviews.length;
  const averageRating =
    reviewCount > 0
      ? approvedReviews.reduce((sum, row) => sum + row.rating, 0) / reviewCount
      : 0;

  await Book.findByIdAndUpdate(bookId, {
    $set: {
      averageRating: Number(averageRating.toFixed(2)),
      reviewCount,
      reviews: approvedReviews.map((row) => row._id),
    },
  });
};

const parsePagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { page, limit, skip } = parsePagination(req);

    const sortBy = req.query.sort || 'newest';
    const sort =
      sortBy === 'highest'
        ? { rating: -1, createdAt: -1 }
        : sortBy === 'helpful'
          ? { helpfulVotes: -1, createdAt: -1 }
          : { createdAt: -1 };

    const query = { book: bookId, status: 'approved' };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'firstName lastName avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        reviews,
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

export const getFeaturedReviews = async (req, res, next) => {
  try {
    const limit = Math.min(12, Math.max(1, Number.parseInt(req.query.limit || '3', 10)));
    const reviews = await Review.find({ status: 'approved' })
      .populate('user', 'firstName lastName')
      .populate('book', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
    const serializedReviews = await serializeReviewsForClient(reviews);

    return res.json({
      success: true,
      data: {
        reviews: serializedReviews,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { status, book, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (book) {
      filter.book = book;
    }

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ title: regex }, { comment: regex }];
    }

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('book', 'title coverImage')
      .sort({ createdAt: -1 });
    const serializedReviews = await serializeReviewsForClient(reviews);

    const grouped = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      all: await Review.countDocuments(),
      pending: grouped.find((row) => row._id === 'pending')?.count || 0,
      approved: grouped.find((row) => row._id === 'approved')?.count || 0,
      rejected: grouped.find((row) => row._id === 'rejected')?.count || 0,
    };

    return res.json({
      success: true,
      count: serializedReviews.length,
      statusCounts,
      data: {
        reviews: serializedReviews,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!value.comment || !value.comment.trim()) {
      return res.status(400).json({ success: false, error: 'Review comment is required' });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      book: value.bookId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this book',
      });
    }

    const ownsBook = await checkOwnership(req.user._id, value.bookId);
    if (!ownsBook) {
      return res.status(403).json({ success: false, error: 'Purchase required to review this book' });
    }

    const review = await Review.create({
      book: value.bookId,
      user: req.user._id,
      rating: value.rating,
      title: value.title,
      comment: value.comment,
      status: 'approved',
      verifiedPurchase: true,
      verified: true,
    });

    await refreshBookReviewStats(value.bookId);

    return res.status(201).json({
      success: true,
      data: {
        review,
        message: 'Review submitted successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const isOwner = String(review.user) === String(req.user._id);
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    review.rating = req.body.rating ?? review.rating;
    review.title = req.body.title ?? review.title;
    review.comment = req.body.comment ?? review.comment;

    if (!isAdmin) {
      review.status = 'approved';
    }

    await review.save();
    await refreshBookReviewStats(review.book);

    return res.json({ success: true, data: { review } });
  } catch (error) {
    return next(error);
  }
};

export const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'approved' } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    await refreshBookReviewStats(review.book);

    return res.json({
      success: true,
      message: 'Review approved successfully',
      data: { review },
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected' } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    await refreshBookReviewStats(review.book);

    return res.json({
      success: true,
      message: 'Review rejected successfully',
      data: { review },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const isOwner = String(review.user) === String(req.user._id);
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const bookId = review.book;
    await review.deleteOne();
    await refreshBookReviewStats(bookId);

    return res.json({
      success: true,
      message: 'Review deleted successfully',
      data: {
        message: 'Review deleted successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const voteHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const userId = String(req.user._id);
    const alreadyVoted = review.helpfulBy.some((id) => String(id) === userId);

    if (alreadyVoted) {
      review.helpfulBy = review.helpfulBy.filter((id) => String(id) !== userId);
    } else {
      review.helpfulBy.push(req.user._id);
    }

    review.helpfulVotes = review.helpfulBy.length;
    review.helpful = review.helpfulVotes;
    await review.save();

    return res.json({
      success: true,
      data: {
        helpfulVotes: review.helpfulVotes,
      },
    });
  } catch (error) {
    return next(error);
  }
};
