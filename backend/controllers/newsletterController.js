import Newsletter from '../models/Newsletter.js';
import { newsletterSchema } from '../utils/validation.js';

const mapStatusFilter = (status) => {
  if (status === 'active') {
    return { status: 'active' };
  }
  if (status === 'unsubscribed') {
    return { status: 'unsubscribed' };
  }
  return {};
};

export const addSubscriber = async (req, res, next) => {
  try {
    const { error, value } = newsletterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const subscriber = await Newsletter.findOneAndUpdate(
      { email: value.email.toLowerCase() },
      {
        $set: {
          email: value.email.toLowerCase(),
          status: 'active',
          subscribedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return res.status(201).json({ success: true, data: { subscriber } });
  } catch (error) {
    return next(error);
  }
};

export const subscribe = addSubscriber;

export const unsubscribe = async (req, res, next) => {
  try {
    const { error, value } = newsletterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const subscriber = await Newsletter.findOneAndUpdate(
      { email: value.email.toLowerCase() },
      { $set: { status: 'unsubscribed' } },
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Email not found in subscribers list' });
    }

    return res.json({ success: true, data: { message: 'Unsubscribed successfully' } });
  } catch (error) {
    return next(error);
  }
};

export const getAllSubscribers = async (req, res, next) => {
  try {
    const filter = mapStatusFilter(req.query.status);
    const subscribers = await Newsletter.find(filter).sort({ subscribedAt: -1 });

    return res.json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error) {
    return next(error);
  }
};

export const getSubscribers = async (req, res, next) => {
  try {
    const filter = mapStatusFilter(req.query.status);
    const subscribers = await Newsletter.find(filter).sort({ subscribedAt: -1 });
    return res.json({ success: true, data: { subscribers } });
  } catch (error) {
    return next(error);
  }
};

export const deleteSubscriber = async (req, res, next) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }

    await subscriber.deleteOne();

    return res.json({ success: true, data: { message: 'Subscriber deleted successfully' } });
  } catch (error) {
    return next(error);
  }
};

export const getStats = async (_req, res, next) => {
  try {
    const total = await Newsletter.countDocuments();
    const active = await Newsletter.countDocuments({ status: 'active' });
    const unsubscribed = total - active;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentGrowth = await Newsletter.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo },
    });

    return res.json({
      success: true,
      data: {
        total,
        active,
        unsubscribed,
        recentGrowth,
      },
    });
  } catch (error) {
    return next(error);
  }
};
