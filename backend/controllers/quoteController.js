import Quote from '../models/Quote.js';

const parseDate = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getTodaysQuote = async (_req, res, next) => {
  try {
    const quote = await Quote.getTodaysQuote();

    if (!quote) {
      return res.json({
        success: true,
        data: null,
        message: 'No quote available today',
      });
    }

    quote.viewCount += 1;
    await quote.save();

    return res.json({
      success: true,
      data: {
        id: quote._id,
        text: quote.text,
        author: quote.author,
        category: quote.category,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllQuotes = async (req, res, next) => {
  try {
    const { status = '' } = req.query;
    const now = new Date();
    let filter = {};

    if (status === 'active') {
      filter = {
        active: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      };
    } else if (status === 'upcoming') {
      filter = {
        active: true,
        startDate: { $gt: now },
      };
    } else if (status === 'expired') {
      filter = {
        endDate: { $lt: now },
      };
    }

    const quotes = await Quote.find(filter).sort({ startDate: -1 }).populate('createdBy', 'firstName lastName email');

    return res.json({
      success: true,
      count: quotes.length,
      data: quotes,
    });
  } catch (error) {
    return next(error);
  }
};

export const createQuote = async (req, res, next) => {
  try {
    const { text, author, category, startDate, endDate, active } = req.body;
    const normalizedStartDate = parseDate(startDate);
    const normalizedEndDate = parseDate(endDate);

    if (!text || !normalizedStartDate || !normalizedEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Text, start date, and end date are required.',
      });
    }

    if (normalizedEndDate < normalizedStartDate) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date.',
      });
    }

    const quote = await Quote.create({
      text,
      author: author || 'PS White',
      category: category || 'general',
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      active: active === undefined ? true : Boolean(active),
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found.',
      });
    }

    const { text, author, category, startDate, endDate, active } = req.body;
    const normalizedStartDate = parseDate(startDate);
    const normalizedEndDate = parseDate(endDate);
    const finalStartDate = normalizedStartDate || quote.startDate;
    const finalEndDate = normalizedEndDate || quote.endDate;

    if (finalEndDate < finalStartDate) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date.',
      });
    }

    if (typeof text === 'string') {
      quote.text = text;
    }
    if (typeof author === 'string') {
      quote.author = author;
    }
    if (typeof category === 'string') {
      quote.category = category;
    }
    quote.startDate = finalStartDate;
    quote.endDate = finalEndDate;
    if (active !== undefined) {
      quote.active = Boolean(active);
    }

    await quote.save();

    return res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found.',
      });
    }

    await quote.deleteOne();
    return res.json({
      success: true,
      message: 'Quote deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

export const getQuoteStats = async (_req, res, next) => {
  try {
    const now = new Date();
    const [totalQuotes, activeQuotes, upcomingQuotes, totalViews] = await Promise.all([
      Quote.countDocuments(),
      Quote.countDocuments({
        active: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
      Quote.countDocuments({
        active: true,
        startDate: { $gt: now },
      }),
      Quote.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
    ]);

    return res.json({
      success: true,
      data: {
        totalQuotes,
        activeQuotes,
        upcomingQuotes,
        totalViews: totalViews[0]?.total || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

