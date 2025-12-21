// src/schemas/authSchemas.js
import Joi from 'joi';

export const loginSchema = Joi.object({
  email_address: Joi.string().email().max(255).lowercase().required(),
  password: Joi.string().min(5).required(),
}).unknown(false);

export const registerSchema = Joi.object({
  user_name: Joi.string().trim().max(16).required(),
  first_name: Joi.string().trim().max(16).required(),
  last_name: Joi.string().trim().max(32).required(),
  email_address: Joi.string().email().max(255).lowercase().required(),
  password: Joi.string().min(6).required(),
  preferences: Joi.alternatives().try(
    Joi.object().unknown(true),
    Joi.string().custom((v, helpers) => { try { JSON.parse(v); return v; } catch { return helpers.error('any.invalid'); } })
  ).optional()
}).unknown(false);

export const verifySchema = Joi.object({
  token: Joi.string().length(64).hex().required(), // 32-byte hex token
}).unknown(false);
