const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const payload = {
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
    payload.path = req.originalUrl;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
