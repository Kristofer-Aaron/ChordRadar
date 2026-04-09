import Joi from "joi";

export const LENGTHS = Object.freeze({
  USER_NAME_MAX: 16,
  FIRST_NAME_MAX: 16,
  LAST_NAME_MAX: 32,
  EMAIL_MAX: 255,
  PASSWORD_MAX: 255,
  PASSWORD_MIN: 8,
});

/** Atomic validators */
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

const passwordStr = Joi.string()
  .min(LENGTHS.PASSWORD_MIN)
  .max(LENGTHS.PASSWORD_MAX)
  .messages({
    "string.base": "password must be a string",
    "string.min": `password must be at least ${LENGTHS.PASSWORD_MIN} characters`,
    "string.max": `password must be at most ${LENGTHS.PASSWORD_MAX} characters`,
  });

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

const preferencesObj = Joi.object().messages({
  "object.base": "preferences must be a JSON object",
});

/** TOTP 6-digit code used in loginTotp, totpConfirm, totpDisable */
const totp6 = Joi.string()
  .pattern(/^\d{6}$/)
  .messages({
    "string.pattern.base": "TOTP code must be a 6-digit number",
  });

/** Email verification token: randomBytes(32).toString('hex') => 64 hex chars */
const hex64 = Joi.string()
  .length(64)
  .hex()
  .messages({
    "string.length": "token must be 64 hex characters",
    "string.hex": "token must be a hex string",
  });

/** Optional remember-me query used by login/loginTotp: expects literal "true" or "false" */
export const rememberMeQuerySchema = Joi.object({
  "remember-me": Joi.boolean()
    .truthy("true").falsy("false")
    // optional extras (if you want them):
    .truthy("1").falsy("0")
    .truthy("yes").falsy("no")
    .default(false),
}).unknown(true);

/** ------------------ Auth: login with password ------------------ */
export const loginBodySchema = Joi.object({
  email_address: emailStr.required(),
  password: passwordStr.required(),
})
  .required()
  .messages({ "any.required": "Body is required" });

export const loginQuerySchema = rememberMeQuerySchema;

/** ------------------ Auth: login with TOTP ---------------------- */
export const loginTotpBodySchema = Joi.object({
  email_address: emailStr.required(),
  totp_token: totp6.required(),
})
  .required()
  .messages({ "any.required": "Body is required" });

export const loginTotpQuerySchema = rememberMeQuerySchema;

/** ------------------ Registration ------------------------------- */
export const registerBodySchema = Joi.object({
  user_name: userNameStr.required(),
  first_name: firstNameStr.required(),
  last_name: lastNameStr.required(),
  email_address: emailStr.required(),

  // raw password is hashed in the controller with bcrypt
  password: passwordStr.required(),

  // users.preferences is NOT NULL JSON in your schema; keep required
  preferences: preferencesObj.required(),
})
  .required()
  .messages({ "any.required": "Body is required" });

/** ------------------ Email verification (query) ------------------ */
export const verifyQuerySchema = Joi.object({
  token: hex64.required(), // controller uses req.validatedQuery.token
}).unknown(false);

/** ------------------ TOTP enroll (no input) --------------------- */
// totpEnroll: no body/params/query to validate (operates on req.user)

/** ------------------ TOTP confirm (body: token OR code) --------- */
export const totpConfirmBodySchema = Joi.object({
  token: totp6, // either "token" or "code"
  code: totp6,
})
  .or("token", "code")
  .messages({
    "object.missing": "Provide either 'token' or 'code' (6-digit TOTP) to confirm TOTP authentication",
  });

/** ------------------ TOTP get QR PNG (no input) ----------------- */
// getQrPng: no input to validate (operates on req.user)

/** ------------------ TOTP disable (at least one factor) --------- */
export const totpDisableBodySchema = Joi.object({
  password: passwordStr,      // 1) password path
  totp_token: totp6,          // 2) current TOTP
  // 3) backup code — format is hashed/compared in DB; allow a safe string range
  backup_code: Joi.string().trim().min(6).max(64)
    .messages({
      "string.base": "backup_code must be a string",
      "string.min": "backup_code must be at least 6 characters",
      "string.max": "backup_code must be at most 64 characters",
    }),
})
  .or("password", "totp_token", "backup_code")
  .messages({
    "object.missing": "Provide password, totp_token (6 digits), or a backup_code to disable TOTP authentication",
  });