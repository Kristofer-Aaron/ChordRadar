import Joi from "joi";

export const chordSchema = Joi.object({
	name: Joi.string().required(),
	tuning_id: Joi.number().integer().required(),
	grip_id: Joi.number().integer().required(),
});
