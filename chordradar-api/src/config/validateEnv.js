import Joi from "joi";

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),

  BACKEND_URL: Joi.string().uri({ scheme: ["http", "https"] }).required(),
  FRONTEND_URL: Joi.string().uri({ scheme: ["http", "https"] }).required(),

  JWT_SECRET: Joi.string().min(32).required(),

  API_TOKEN_EXPIRATION: Joi.number().integer().min(60).required(),
  API_TOKEN_EXPIRATION_LONG: Joi.number().integer().min(3600).required(),
  EMAIL_TOKEN_EXPIRATION: Joi.number().integer().min(300).default(86400),

  DB_HOST: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().allow("").required(),
  DB_NAME: Joi.string().required(),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().integer().min(1).max(65535).required(),
  SMTP_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),

  DEFAULT_CHORDS_NUMBER: Joi.number().integer().min(1).default(50),
})
  .unknown(true);

export default function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    const details = error.details.map((d) => `- ${d.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  // Optional: normalize values back to process.env strings
  process.env.NODE_ENV = value.NODE_ENV;
  process.env.API_TOKEN_EXPIRATION = String(value.API_TOKEN_EXPIRATION);
  process.env.API_TOKEN_EXPIRATION_LONG = String(value.API_TOKEN_EXPIRATION_LONG);
  process.env.EMAIL_TOKEN_EXPIRATION = String(value.EMAIL_TOKEN_EXPIRATION);
  process.env.SMTP_PORT = String(value.SMTP_PORT);
  process.env.SMTP_SECURE = String(value.SMTP_SECURE);
  process.env.DEFAULT_CHORDS_NUMBER = String(value.DEFAULT_CHORDS_NUMBER);
}