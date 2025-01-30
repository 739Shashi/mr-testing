import {Request, Response} from 'express';
import rateLimit, {RateLimitRequestHandler} from 'express-rate-limit';

/**
 * Helper function to create rate limiters
 */
const createRateLimiter = (
  windowMs: number,
  limit: (req: Request, res: Response) => number,
  message: string
): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    limit, // Replaces the deprecated "max" option
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_: Request, res: Response) => {
      res.status(429).json({status: 'error', message});
    },
  });

/**
 * Example Rate Limiters
 */
const apiV1RateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  () => 200, // Fixed limit of 200 requests
  'You have exceeded the 200 requests in 15 minutes limit!'
);

const developmentApiLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  () => 1000, // Fixed limit of 1000 requests
  'Too many requests, please try again in 10 minutes.'
);

const recoverPasswordApiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  () => 1, // Fixed limit of 1 request
  'Too many requests to recover password, please try again in 1 minute.'
);

const resetPasswordApiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  () => 10, // Fixed limit of 10 requests
  'Too many requests to reset password, please try again in 1 minute.'
);

export {
  apiV1RateLimiter,
  developmentApiLimiter,
  recoverPasswordApiLimiter,
  resetPasswordApiLimiter,
};
