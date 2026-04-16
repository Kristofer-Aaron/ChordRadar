import Joi from "joi";

export const LENGTHS = Object.freeze({
  NOTATION_MAX: 16,
  TUNING_MAX: 8,
  GRIP_MAX: 8,
});

// Atomic validators
const idParam = Joi.number().integer().positive().required();

const notationStr = Joi.string().trim().max(LENGTHS.NOTATION_MAX).messages({
  "string.base": "notation must be a string",
  "string.max": `notation must be at most ${LENGTHS.NOTATION_MAX} characters`,
});

const tuningStr = Joi.string().trim().lowercase().max(LENGTHS.TUNING_MAX).messages({
  "string.base": "tuning must be a string",
  "string.max": `tuning must be at most ${LENGTHS.TUNING_MAX} characters`,
});

const gripStr = Joi.string().trim().max(LENGTHS.GRIP_MAX).messages({
  "string.base": "grip must be a string",
  "string.max": `grip must be at most ${LENGTHS.GRIP_MAX} characters`,
});

/*
export const fieldsObjectSchema = Joi.object({
  notation: Joi.string().valid("value"),
  tuning: Joi.string().valid("value"),
  grip: Joi.string().valid("value"),
}).unknown(false);

export const getAllQuerySchema = Joi.object({
  fields: fieldsObjectSchema.optional(),
}).unknown(true);

export const getAllRawQuerySchema = Joi.object({
  fields: Joi.string().optional(), // JSON string; parse in middleware, then validate with fieldsObjectSchema
}).unknown(true);
*/

/** :id param schema (used in getById, patch, remove). */
export const idParamSchema = Joi.object({ id: idParam });

/** GET /chords/by/:selector/:selectorValue/:tuningValue */
export const getBySelectorParamsSchema = Joi.object({
  selector: Joi.string().valid("notation", "grip").required(),
  selectorValue: Joi.alternatives()
    .conditional("selector", { is: "notation", then: notationStr.required() })
    .conditional("selector", { is: "grip", then: gripStr.required() }),
  tuningValue: tuningStr.required(),
});

/** POST /chords body (human-readable only; all required). */
export const createChordBodySchema = Joi.object({
  notation: notationStr.required(),
  tuning: tuningStr.required(),
  grip: gripStr.required(),
})
  .required()
  .messages({ "any.required": "Body is required" });

/** PATCH /chords/:id body (human-readable; at least one). */
export const patchChordBodySchema = Joi.object({
  notation: notationStr,
  tuning: tuningStr,
  grip: gripStr,
})
  .or("notation", "tuning", "grip")
  .messages({ "object.missing": "Provide at least one of: notation, tuning, grip" });