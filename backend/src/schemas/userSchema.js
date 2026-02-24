// schemas/userSchema.js
import Joi from "joi";

export const userSchema = Joi.object({
	user_name: Joi.string().max(16).required(),
	first_name: Joi.string().max(16).required(),
	last_name: Joi.string().max(32).required(),
	email_address: Joi.string().email().max(255).required(),
	email_verified: Joi.boolean().default(false),
	password_hash: Joi.string().max(255).required(),
	password_changed_at: Joi.date().optional(),
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
	account_created_at: Joi.date().optional().default(() => new Date()),
	last_login_at: Joi.date().optional().default(() => new Date()),
	preferences: Joi.object().required(),
});