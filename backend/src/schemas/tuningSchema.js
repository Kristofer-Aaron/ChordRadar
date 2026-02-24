import Joi from "joi";

export const tuningSchema = Joi.object({
	value: Joi.string().required(),
});