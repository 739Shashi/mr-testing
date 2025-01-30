import mongoose from 'mongoose';
import Logger from '../utils/logger';
import {CustomError} from "../utils/errors";

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => {
  Logger.info('Database connection established');
});

mongoose.connection.on('reconnected', () => {
  Logger.warn('Database connection reconnected');
});

mongoose.connection.on('disconnected', () => {
  Logger.warn('Database disconnected');
});

mongoose.connection.on('close', () => {
  Logger.warn('Database connection closed');
});

mongoose.connection.on('error', (error: string) => {
  Logger.error(`🤦🏻 Database ERROR: ${error}`);
  process.exit(1);
});

export default {
  connect: async () => {
    try {
      await mongoose.connect(<string>process.env.MONGO_URI, {
        serverSelectionTimeoutMS: process.env.SERVER_SELECTION_TIMEOUT_MS
          ? parseInt(process.env.SERVER_SELECTION_TIMEOUT_MS, 10)
          : 5000, // Increase timeout for server selection
        maxPoolSize: process.env.MONGO_POOL_SIZE ? parseInt(process.env.MONGO_POOL_SIZE, 10) : 10, // Set pool size (default is 5)
        minPoolSize: 1, // Minimum number of connections in the pool
      });

      Logger.info(`Connected to database: ${mongoose.connection.name}`);
    } catch (error) {
      Logger.error('Database connection error' + error);
      if (error instanceof CustomError) {
        throw new CustomError(500, error.message);
      }
    }
  },
};
