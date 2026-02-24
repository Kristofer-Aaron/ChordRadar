import Joi from "joi";

export const notationSchema = Joi.object({
	value: Joi.string().required(),
});