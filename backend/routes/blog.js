import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import {
  addComment,
  createPost,
  deletePost,
  getAdminPosts,
  getAllPosts,
  getPostBySlug,
  updatePost,
} from '../controllers/blogController.js';

const router = Router();

router.get('/admin/posts', protect, adminProtect, getAdminPosts);
router.get('/posts', getAllPosts);
router.get('/posts/:slug', getPostBySlug);
router.post('/posts', protect, adminProtect, createPost);
router.put('/posts/:id', protect, adminProtect, updatePost);
router.delete('/posts/:id', protect, adminProtect, deletePost);
router.post('/posts/:id/comments', protect, addComment);

export default router;
