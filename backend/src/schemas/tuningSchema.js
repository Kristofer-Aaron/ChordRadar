import Joi from "joi";

export const TuningSchema = Joi.object({
	value: Joi.string().max(8).required(),
});