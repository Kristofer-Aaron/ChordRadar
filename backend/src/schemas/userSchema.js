// schemas/userSchema.js
import Joi from "joi";

export const userSchema = Joi.object({
	user_name: Joi.string().max(16).required(),
	first_name: Joi.string().max(16).required(),
	last_name: Joi.string().max(32).required(),
	email_address: Joi.string().email().max(255).required(),
	email_verified: Joi.boolean().default(false),
	password_hash: Joi.string().max(255).required(),
	password_changed_at: Joi.date().required(),
	two_factor_enabled: Joi.boolean().default(false),
	two_factor_method: Joi.string()
		.valid("email", "google_authenticator", "microsoft_authenticator")
		.optional(),
	two_factor_secret: Joi.string().max(255).optional(),
	two_factor_backup: Joi.array().items(Joi.string()).optional(),
	role: Joi.string().valid("user", "admin").default("user"),
	status: Joi.string()
		.valid("active", "pending", "suspended")
		.default("pending"),
	account_created_at: Joi.date().required(),
	last_login_at: Joi.date().required(),
	preferences: Joi.object().required(),
});

export const patchSchema = Joi.object({
  // self-editable
  user_name: Joi.string().max(16).trim(),
  first_name: Joi.string().trim(),
  last_name: Joi.string().trim(),

  email_address: Joi.string().email().max(255).lowercase(),

  // plain password; hashing is done in middleware
  password: Joi.string().min(5),

  // preferences: an object or JSON string
  preferences: Joi.alternatives().try(
    Joi.object().unknown(true),
    Joi.string().custom((v, helpers) => {
      try { JSON.parse(v); return v; } catch { return helpers.error("any.invalid"); }
    })
  ),

  // 2FA flags/fields
  two_factor_enabled: Joi.alternatives().try(
    Joi.boolean(),
    Joi.number().valid(0, 1)
  ),
  two_factor_method: Joi.string()
    .valid("email", "google_authenticator", "microsoft_authenticator")
    .allow(null),
  two_factor_secret: Joi.string().allow(null),
  two_factor_backup: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string().custom((v, helpers) => {
      try {
        const parsed = JSON.parse(v);
        if (!Array.isArray(parsed)) throw new Error();
        return v;
      } catch { return helpers.error("any.invalid"); }
    })
  ),

  // admin-only extras (guarded by forbidNonAdminFields)
  role: Joi.string().valid("user", "admin"),
  status: Joi.string().valid("active", "pending", "suspended"),
  email_verified: Joi.alternatives().try(Joi.number().valid(0, 1), Joi.boolean())
}).min(1) // at least one field
  .unknown(false); // reject unknown keys

  
// schemas/userSchemas.js
export const patchUserSchema = {
  // All fields optional (partial update)
  optional: [
    'user_name',
    'first_name',
    'last_name',
    'email_address',
    'two_factor_enabled',
    'preferences',
    'password',
    // admin-only (middleware blocks for default users, but schema may still allow)
    'email_verified',
    'role',
    'status'
  ]
};
