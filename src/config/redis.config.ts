import Redis from 'ioredis';


let redis: Redis;

/**
 * Function to check if the Redis connection is established
 * @returns
 */
const initRedis = async (): Promise<boolean> => {
  try {
    redis = new Redis(
      `${process.env.REDIS_URL}`
    );
    const response = await redis.ping();
    console.log('Redis connection established:', response);
    return true;
  } catch (error) {
    console.error('Failed to establish Redis connection:', error);
    return false;
  }
};
export {redis, initRedis};
