import Joi from "joi";

export const NotationSchema = Joi.object({
	value: Joi.string().max(16).required(),
});