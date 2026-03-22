import { Router } from 'express';
import { getBookById, getBooks, searchBooks } from '../controllers/bookController.js';

const router = Router();

router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/:id', getBookById);

export default router;
