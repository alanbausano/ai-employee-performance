/**
 * chaos.js — Simulates real-world API behavior.
 *
 * Adds random latency, occasional server errors, and per-client rate limiting
 * to any Express route. All parameters are configurable via environment variables.
 */

const requestCounts = new Map();

/**
 * Creates middleware that injects chaos into API responses.
 *
 * @param {Object} opts
 * @param {number} opts.errorRate   - Probability (0-1) of returning a random 5xx error.
 * @param {number} opts.minLatency  - Minimum added latency in ms.
 * @param {number} opts.maxLatency  - Maximum added latency in ms.
 * @param {number} opts.rateLimit   - Max requests per minute per client IP.
 */
export function chaosMiddleware({
  errorRate = 0.05,
  minLatency = 50,
  maxLatency = 800,
  rateLimit = 60,
} = {}) {
  return (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    // --- Rate limiting ---
    let record = requestCounts.get(ip);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + 60_000 };
    }
    record.count++;
    requestCounts.set(ip, record);

    if (record.count > rateLimit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter,
        message: `Maximum ${rateLimit} requests per minute. Try again in ${retryAfter}s.`,
      });
    }

    // --- Random error injection ---
    if (Math.random() < errorRate) {
      const errors = [
        { status: 500, message: 'Internal server error' },
        { status: 503, message: 'Service temporarily unavailable' },
        { status: 502, message: 'Bad gateway' },
      ];
      const err = errors[Math.floor(Math.random() * errors.length)];
      return res.status(err.status).json({ error: err.message });
    }

    // --- Random latency ---
    const latency = minLatency + Math.random() * (maxLatency - minLatency);
    setTimeout(() => next(), Math.round(latency));
  };
}
