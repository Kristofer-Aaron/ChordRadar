import Joi from "joi";

export const GripSchema = Joi.object({
	strings: Joi.string().max(8).required()
});