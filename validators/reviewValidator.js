import Joi from "joi";

export const listReviewsSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const addReviewSchema = Joi.object({
  rating:  Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow("").optional(),
});