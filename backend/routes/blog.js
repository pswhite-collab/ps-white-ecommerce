import { Router } from 'express';
import { getBlogPostBySlug, getBlogPosts } from '../controllers/blogController.js';

const router = Router();

router.get('/', getBlogPosts);
router.get('/:slug', getBlogPostBySlug);

export default router;
