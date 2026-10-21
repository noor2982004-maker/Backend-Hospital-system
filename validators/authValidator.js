import Joi from "joi";

export const registerSchema = Joi.object({
  full_name:   Joi.string().min(2).max(50).required(),
  email:       Joi.string().email().required(),
  phone:       Joi.string().pattern(/^01[0125][0-9]{8}$/),
  password:    Joi.string().min(8).max(64).required(),
  gender:      Joi.string().valid("male", "female"),
  governorate: Joi.string().max(50),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

export const emailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  otp:   Joi.string().pattern(/^\d{6}$/).required(),
});

export const resetPasswordSchema = Joi.object({
  email:            Joi.string().email().required(),
  new_password:     Joi.string().min(8).max(64).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({ "any.only": "Passwords do not match" }),
});

export const googleLoginSchema = Joi.object({
  id_token: Joi.string().required(),
});

export const createAdminSchema = Joi.object({
  full_name: Joi.string().min(2).max(50).required(),

  email: Joi.string().email().required(),

  password: Joi.string().min(8).max(64).required(),
});
