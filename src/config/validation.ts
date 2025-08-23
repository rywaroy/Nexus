import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'online')
    .default('development'),
  APP_PORT: Joi.number().default(3000),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // MongoDB
  MONGODB_HOST: Joi.string().default('127.0.0.1'),
  MONGODB_PORT: Joi.number().default(27017),
  MONGODB_DB: Joi.string().default('test'),
  MONGODB_USER: Joi.string().allow('').default(''),
  MONGODB_PASS: Joi.string().allow('').default(''),

  // Redis
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),
});
