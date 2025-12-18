export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  },
  file: {
    maxSizeMB: parseInt(process.env.FILE_MAX_SIZE_MB) || 10,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'yourSecretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  mongodb: {
    host: process.env.MONGODB_HOST || '127.0.0.1',
    port: parseInt(process.env.MONGODB_PORT) || 27017,
    database: process.env.MONGODB_DB || 'test',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASS || '',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    database: parseInt(process.env.REDIS_DB) || 0,
  },
});
