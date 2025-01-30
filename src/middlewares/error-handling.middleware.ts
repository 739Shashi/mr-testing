import dotenv from 'dotenv';
import {NextFunction, Request, Response} from 'express';
import Logger from '../utils/logger';
import {ICustomExpressRequest} from "../bin/server";
import {CustomError} from "../utils/errors";

dotenv.config();

const errorHandlingMiddleware = (
  err: CustomError,
  _: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const isProduction = process.env.NODE_ENV === 'production';

  // If headers are already sent, delegate error handling to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error details in non-production environments
  if (!isProduction) {
    Logger.error('Error stack:', err.stack);
  }

  // Construct error response
  const errorResponse = {
    status: 'error',
    message: err.message || 'Internal Server Error',
    error: {
      message: err.message,
      ...(isProduction ? {} : {trace: err.stack}), // Include stack trace only in non-production
    },
  };

  // Send the response with the error details
  return res.status(err.statusCode || 500).json(errorResponse);
};

const catchAsyncHandler = (fn: Function) =>
  async (
    request: ICustomExpressRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      fn(request, response, next);
    } catch (error) {
      return next(error);
    }
  };
export {errorHandlingMiddleware, catchAsyncHandler};
