import Joi from "joi";

export const notationIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const notationBodySchema = Joi.object({
  value: Joi.string()
    .trim()
    .min(1)
    .max(16)
    .required()
    .messages({
      "string.base": "value must be a string",
      "string.empty": "value cannot be empty",
      "string.max": `value must be at most 16 characters`,
      "any.required": "value is required",
    }),
});