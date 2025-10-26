import Joi from 'joi';

export const gripSchema = Joi.object({
  strings: Joi.string().required()
});