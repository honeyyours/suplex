function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Internal Server Error',
  };
  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV === 'development' && status >= 500) {
    payload.stack = err.stack;
  }
  if (status >= 500) console.error('[error]', err);
  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
