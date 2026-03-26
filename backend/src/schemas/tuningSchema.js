import Joi from "joi";

export const tuningIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const tuningBodySchema = Joi.object({
  value: Joi.string()
    .trim()
    .lowercase()
    .min(1)
    .max(8)
    .required()
    .messages({
      "string.base":  "value must be a string",
      "string.empty": "value cannot be empty",
      "string.max":   `value must be at most 8 characters`,
      "any.required": "value is required",
    }),
});