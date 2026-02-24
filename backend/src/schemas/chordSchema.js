import Joi from "joi";

export const chordSchema = Joi.object({
	notation_id: Joi.number().integer().required(),
	tuning_id: Joi.number().integer().required(),
	grip_id: Joi.number().integer().required(),
});
