export const connection = {
  url: process.env.REDIS_URL,
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    age: 86400,
    count: 100,
  },
  removeOnFail: {
    age: 604800,
  },
};
