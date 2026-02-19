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