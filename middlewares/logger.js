import Log from '../models/Log.js';

export async function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    try {
      await Log.create({
        method: req.method,
        route: req.originalUrl,
        status: res.statusCode,
        requestBody: req.body,
        requestQuery: req.query,
        requestParams: req.params,
        responseTimeMs: duration,
        userId: req.user?.id
      });
    } catch (e) {
      console.error('Failed to write log', e.message);
    }
  });

  next();
}
