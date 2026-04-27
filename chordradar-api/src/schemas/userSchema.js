import Joi from "joi";

/** DB-driven limits (users table): */
export const LENGTHS = Object.freeze({
  USER_NAME_MAX: 16,
  FIRST_NAME_MAX: 16,
  LAST_NAME_MAX: 32,
  EMAIL_MAX: 255,
  PASSWORD_HASH_MAX: 255, // stored as varchar(255)
});

const idParam = Joi.number().integer().positive().required();

const userNameStr = Joi.string().trim().max(LENGTHS.USER_NAME_MAX).messages({
  "string.base": "user_name must be a string",
  "string.max": `user_name must be at most ${LENGTHS.USER_NAME_MAX} characters`,
});

const firstNameStr = Joi.string().trim().max(LENGTHS.FIRST_NAME_MAX).messages({
  "string.base": "first_name must be a string",
  "string.max": `first_name must be at most ${LENGTHS.FIRST_NAME_MAX} characters`,
});

const lastNameStr = Joi.string().trim().max(LENGTHS.LAST_NAME_MAX).messages({
  "string.base": "last_name must be a string",
  "string.max": `last_name must be at most ${LENGTHS.LAST_NAME_MAX} characters`,
});

const emailStr = Joi.string()
  .trim()
  .lowercase()
  .email()
  .max(LENGTHS.EMAIL_MAX)
  .messages({
    "string.base": "email_address must be a string",
    "string.email": "email_address must be a valid email",
    "string.max": `email_address must be at most ${LENGTHS.EMAIL_MAX} characters`,
  });

/** Passwords are stored as password_hash (varchar(255)); keep flexible but sane */
const passwordHashStr = Joi.string().trim().min(50).max(LENGTHS.PASSWORD_HASH_MAX).messages({
  "string.base": "password_hash must be a string",
  "string.min": "password_hash looks too short",
  "string.max": `password_hash must be at most ${LENGTHS.PASSWORD_HASH_MAX} characters`,
});

/** Enums from DB */
const roleEnum = Joi.string().valid("user", "admin").messages({
  "any.only": "role must be either 'user' or 'admin'",
});

const statusEnum = Joi.string().valid("active", "pending", "suspended").messages({
  "any.only": "status must be one of 'active', 'pending', 'suspended'",
});

/** Common booleans */
const boolFlag = Joi.boolean();

const preferencesObj = Joi.object().messages({
  "object.base": "preferences must be a JSON object",
});

/** :id param for routes like PATCH /users/:id, DELETE /users/:id, GET by id */
export const idParamSchema = Joi.object({ id: idParam });

export const getBySelectorParamsSchema = Joi.object({
  selector: Joi.string().valid("id", "email").required(),
  value: Joi.alternatives()
    .conditional("selector", {
      is: "id",
      then: Joi.string()
        .trim()
        .regex(/^\d+$/)
        .required()
        .messages({ "string.pattern.base": "value must be a positive integer when selector is 'id'" }),
    })
    .conditional("selector", {
      is: "email",
      then: emailStr.required(),
    }),
});

export const createUserBodySchema = Joi.object({
  user_name: userNameStr.required(),
  first_name: firstNameStr.required(),
  last_name: lastNameStr.required(),
  email_address: emailStr.required(),

  password_hash: passwordHashStr.required(),
  password_changed_at: Joi.date().optional()/*.messages({
    "date.base": "password_changed_at must be a valid date",
    "any.required": "password_changed_at is required",
  }),*/,

  preferences: preferencesObj.optional(),

  role: roleEnum.optional(),
  status: statusEnum.optional(),
  email_verified: boolFlag.optional(),

  account_created_at: Joi.date().optional(),
  last_login_at: Joi.date().optional(),
})
  .required()
  .messages({ "any.required": "Body is required" });

export const patchUserBodySchema = Joi.object({
  user_name: userNameStr,
  first_name: firstNameStr,
  last_name: lastNameStr,
  email_address: emailStr,
  role: roleEnum,
  status: statusEnum,
  email_verified: boolFlag,
  two_factor_enabled: boolFlag,
  preferences: preferencesObj,
})
  .min(1)
  .messages({ "object.min": "Provide at least one updatable field" });

export const selfPatchUserBodySchema = Joi.object({
  user_name: userNameStr,
  first_name: firstNameStr,
  last_name: lastNameStr,
  email_address: emailStr,
  preferences: preferencesObj,
})
  .min(1)
  .messages({ "object.min": "Provide at least one updatable field" });