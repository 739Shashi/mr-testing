import express, {Response} from 'express';
import _ from 'lodash';
import authRouter from './auth.route';
import swaggerRouter from './swagger.route';
import typedocRouter from './typedoc.route';
import {ICustomExpressRequest} from "../bin/server";
import {apiV1RateLimiter, developmentApiLimiter} from "../middlewares/rate-limiting.middleware";
import {catchAsyncHandler} from "../middlewares/error-handling.middleware";
import caregiverRoute from "./caregiver.route";

const apiV1Router = express.Router();

// Ping endpoint
apiV1Router.get('/ping', catchAsyncHandler(async (_: ICustomExpressRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Healthy check completed successfully',
  });
}));

// Default routes for API
const defaultRoutes = [
  {
    path: '/auth',
    route: authRouter,
  },
  {
    path: '/caregiver',
    route: caregiverRoute,
  },
];

// Development-only routes
const devRoutes = [
  {
    path: '/documentation',
    route: swaggerRouter,
  },
  {
    path: '/typedoc', // this route will serve typedoc generated documentation
    route: typedocRouter,
  },
];

// Apply catchAsyncHandler to all default routes
_.forEach(defaultRoutes, route => {
  apiV1Router.use(apiV1RateLimiter); // Apply rate limiter to default routes
  apiV1Router.use(route.path, catchAsyncHandler(route.route)); // Wrap each route with catchAsyncHandler
});

// Apply development-specific routes and rate limiting
if (process.env.NODE_ENV === 'development') {
  _.forEach(devRoutes, route => {
    apiV1Router.use(developmentApiLimiter); // Apply rate limiter to dev routes
    apiV1Router.use(route.path, catchAsyncHandler(route.route)); // Wrap each route with catchAsyncHandler
  });
}

export default apiV1Router;
