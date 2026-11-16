import BlogPost from '../models/BlogPost.js';
import { blogMutationSchema } from '../utils/validation.js';

const resolveQueryFilters = ({ includeDrafts = false, category, status }) => {
  const query = {};

  if (status === 'published') {
    query.published = true;
  } else if (status === 'draft') {
    query.published = false;
  } else if (!includeDrafts) {
    query.published = true;
  }

  if (category) {
    query.category = category;
  }

  return query;
};

const fetchPosts = async ({ page, limit, query }) => {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    BlogPost.find(query).sort({ publishDate: -1, createdAt: -1 }).skip(skip).limit(limit),
    BlogPost.countDocuments(query),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const getAllPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));
    const query = resolveQueryFilters({
      includeDrafts: false,
      category: req.query.category,
      status: req.query.status,
    });
    const data = await fetchPosts({ page, limit, query });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10)));
    const query = resolveQueryFilters({
      includeDrafts: true,
      category: req.query.category,
      status: req.query.status,
    });
    const data = await fetchPosts({ page, limit, query });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, published: true });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data: { post } });
  } catch (error) {
    return next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { error, value } = blogMutationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const payload = { ...value };
    if (payload.published && !payload.publishDate) {
      payload.publishDate = new Date();
    }

    const post = await BlogPost.create({
      ...payload,
      author: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'PS White',
    });

    return res.status(201).json({ success: true, data: { post } });
  } catch (error) {
    return next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const { error, value } = blogMutationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const currentPost = await BlogPost.findById(req.params.id);
    if (!currentPost) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const payload = { ...value };
    if (payload.published && !currentPost.publishDate && !payload.publishDate) {
      payload.publishDate = new Date();
    }

    const post = await BlogPost.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });

    return res.json({ success: true, data: { post } });
  } catch (error) {
    return next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    return res.json({ success: true, data: { message: 'Post deleted' } });
  } catch (error) {
    return next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const comment = (req.body.comment || '').trim();
    if (!comment) {
      return res.status(400).json({ success: false, error: 'Comment is required' });
    }

    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (!post.commentsEnabled) {
      return res.status(400).json({ success: false, error: 'Comments are disabled for this post' });
    }

    post.comments.push({
      user: req.user._id,
      name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
      comment,
      createdAt: new Date(),
    });

    await post.save();

    return res.status(201).json({ success: true, data: { comments: post.comments } });
  } catch (error) {
    return next(error);
  }
};
