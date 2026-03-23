import Joi from "joi";

export const chordSchema = Joi.object({
	notation_id: Joi.number().integer().required(),
	tuning_id: Joi.number().integer().required(),
	grip_id: Joi.number().integer().required(),
});

export const createChordSchema = Joi.object({
	notation: Joi.string().trim().min(1).max(16).required(),
	tuning: Joi.string().trim().min(1).max(8).required(),
	grip: Joi.string().trim().min(1).max(8).required(),
}).required().unknown(false);


export const patchChordSchema = Joi.object({
	notation: Joi.string().trim().max(16)
	  .messages({
		"string.base": "notation must be a string",
		"string.max": "notation must be at most 16 characters",
	  }),
	tuning: Joi.string().trim().lowercase().max(8)
	  .messages({
		"string.base": "tuning must be a string",
		"string.max": "tuning must be at most 8 characters",
	  }),
	grip: Joi.string().trim().max(8)
	  .messages({
		"string.base": "grip must be a string",
		"string.max": "grip must be at most 8 characters",
	  }),
  })
  .or("notation", "tuning", "grip")
  .messages({
	"object.missing": "Provide at least one of: notation, tuning, grip",
  });  