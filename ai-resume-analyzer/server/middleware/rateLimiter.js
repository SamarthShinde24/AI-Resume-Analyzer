import rateLimit from "express-rate-limit";

/**
 * Sliding window rate limiter for brute-force sensitive authentication routes
 * Target: POST /api/auth/login
 * Window: 15 minutes
 * Standard RateLimit-* headers enabled
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute sliding window
  max: process.env.NODE_ENV === "test" ? 100 : 15, // 15 login attempts per window per IP
  standardHeaders: true, // Draft-6/Draft-7 RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  statusCode: 429,
  message: {
    error: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
  skip: (req) => {
    return req.headers["x-test-bypass-ratelimit"] === "true" && process.env.NODE_ENV === "test";
  },
});

/**
 * Sliding window rate limiter for computationally intensive LLM endpoints
 * Targets: /api/analyze, /api/tailor, /api/cover-letter, /api/interview-prep
 * Window: 15 minutes
 * Mitigates API token exhaustion, model hallucination storms, and Denial-of-Service
 */
export const llmRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute sliding window
  max: process.env.NODE_ENV === "test" ? 200 : 30, // 30 AI generations per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: "AI generation rate limit exceeded. Maximum 30 requests per 15 minutes allowed per IP.",
  },
  skip: (req) => {
    return req.headers["x-test-bypass-ratelimit"] === "true" && process.env.NODE_ENV === "test";
  },
});

/**
 * Factory for creating custom-scoped rate limiters (e.g. for testing rate limit thresholds)
 */
export function createCustomRateLimiter(options = {}) {
  const { message, ...rest } = options;
  const resolvedMessage =
    typeof message === "object" && message !== null
      ? message
      : { error: message || "Rate limit threshold reached." };

  return rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    ...rest,
    message: resolvedMessage,
  });
}
