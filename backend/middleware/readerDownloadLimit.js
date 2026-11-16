const WINDOW_MS = 24 * 60 * 60 * 1000;
const ledger = new Map();

const getMaxDownloads = () => {
  const configured = Number.parseInt(process.env.READER_DAILY_DOWNLOAD_LIMIT || '5', 10);
  if (Number.isNaN(configured) || configured < 1) {
    return 5;
  }
  return configured;
};

export const readerDownloadLimit = (req, res, next) => {
  const userId = req.user?._id ? String(req.user._id) : null;
  const bookId = req.params.bookId ? String(req.params.bookId) : null;

  if (!userId || !bookId) {
    return next();
  }

  const maxDownloads = getMaxDownloads();
  const key = `${userId}:${bookId}`;
  const now = Date.now();
  const current = ledger.get(key);

  if (!current || now - current.windowStart >= WINDOW_MS) {
    ledger.set(key, { count: 1, windowStart: now });
    res.setHeader('X-Reader-Download-Limit', maxDownloads);
    res.setHeader('X-Reader-Download-Remaining', Math.max(0, maxDownloads - 1));
    return next();
  }

  if (current.count >= maxDownloads) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - current.windowStart)) / 1000);
    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(429).json({
      success: false,
      error: `Daily download limit reached for this book. Try again in ${Math.ceil(
        retryAfterSeconds / 3600
      )} hour(s).`,
    });
  }

  current.count += 1;
  ledger.set(key, current);

  res.setHeader('X-Reader-Download-Limit', maxDownloads);
  res.setHeader('X-Reader-Download-Remaining', Math.max(0, maxDownloads - current.count));
  return next();
};

export default readerDownloadLimit;

