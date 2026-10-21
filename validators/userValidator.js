import Joi from "joi";

export const updateProfileSchema = Joi.object({
    full_name:   Joi.string().min(2).max(50),
    phone:       Joi.string().pattern(/^01[0125][0-9]{8}$/),
    gender:      Joi.string().valid("male", "female"),
    governorate: Joi.string().max(50),
}).min(1);

export const changePasswordSchema = Joi.object({
    current_password: Joi.string().required(),
    new_password:     Joi.string().min(8).max(64).required(),
    confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .messages({ "any.only": "Passwords do not match" }),
});