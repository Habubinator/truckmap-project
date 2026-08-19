import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('test', 'development', 'production').required(),
  PORT: Joi.number().required(),
  CORS_ORIGINS: Joi.string().required(),
  DOMAIN: Joi.string().required(),
  CLIENT_URL: Joi.string().required(),
  API_URL: Joi.string().required(),
  CSRF_SECRET: Joi.string().required(),
  POSTGRES_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),
  MAILGUN_API_KEY: Joi.string().required(),
  MAILGUN_FROM_MAIL: Joi.string().required(),
  PUBLIC_KEY_RSA_PATH: Joi.string().required(),
  PRIVATE_KEY_RSA_PATH: Joi.string().required(),
  MULTER_DEST: Joi.string().required(),
  MESIBO_URL: Joi.string().required(),
  MESIBO_TOKEN: Joi.string().required(),
  APP_ID: Joi.string().required(),
  // Mesibo v2 Token Configuration (optional for now, will use defaults if not provided)
  ANDROID_PACKAGE: Joi.string().optional(),
  IOS_BUNDLE: Joi.string().optional(),
});

const validationResult = schema.validate(process.env, {
  stripUnknown: true,
});

if (validationResult.error) {
  throw new Error('.env validation failed', validationResult.error);
}
