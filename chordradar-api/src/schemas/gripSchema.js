import Joi from "joi";

export const gripIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const gripBodySchema = Joi.object({
  strings: Joi.string()
    .trim()
    .min(1)
    .max(8)
    .required()
    .messages({
      "string.base":  "strings must be a string",
      "string.empty": "strings cannot be empty",
      "string.max":   "strings must be at most 8 characters",
      "any.required": "strings is required",
    }),
});