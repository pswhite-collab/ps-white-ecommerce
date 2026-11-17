const errorHandler = (err, req, res, _next) => {
  const isMulterFileSizeError = err?.code === 'LIMIT_FILE_SIZE';
  const isCastError = err?.name === 'CastError';
  const isCorsError = err?.message === 'Origin not allowed by CORS';
  const statusCode =
    err.statusCode ||
    (isMulterFileSizeError ? 413 : isCastError ? 404 : isCorsError ? 403 : 500);
  const oauthRaw = err?.oauthError?.data;
  let oauthDetails = null;

  if (typeof oauthRaw === 'string') {
    try {
      oauthDetails = JSON.parse(oauthRaw);
    } catch (_parseErr) {
      oauthDetails = { raw: oauthRaw };
    }
  } else if (oauthRaw && typeof oauthRaw === 'object') {
    oauthDetails = oauthRaw;
  }

  const normalizedErrorMessage =
    oauthDetails?.error_description ||
    oauthDetails?.error ||
    err.message ||
    'Internal Server Error';

  const payload = {
    success: false,
    error: isMulterFileSizeError
      ? 'Uploaded file is too large for this endpoint.'
      : normalizedErrorMessage,
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
    payload.path = req.originalUrl;
    if (oauthDetails) {
      payload.oauth = oauthDetails;
    }
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
