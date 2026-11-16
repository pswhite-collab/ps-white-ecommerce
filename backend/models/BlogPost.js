import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      default: 'PS White',
      trim: true,
    },
    excerpt: { type: String, trim: true },
    content: { type: String, trim: true },
    featuredImage: { type: String, trim: true },
    category: { type: String, trim: true, index: true },
    published: { type: Boolean, default: false, index: true },
    publishDate: { type: Date },
    commentsEnabled: { type: Boolean, default: true },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, trim: true },
        comment: { type: String, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

blogPostSchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 100);
  }
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
