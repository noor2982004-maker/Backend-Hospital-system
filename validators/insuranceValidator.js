import Joi from "joi";

export const addInsuranceSchema = Joi.object({
  insurance_company: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Insurance company name is required",
    "string.min": "Insurance company name must be at least 2 characters",
    "string.max": "Insurance company name cannot exceed 100 characters",
  }),
  card_number: Joi.string()
    .pattern(/^[0-9]{13,19}$/)
    .required()
    .messages({
      "string.empty": "Card number is required",
      "string.pattern.base": "Card number must be 13-19 digits",
    }),
  card_last4: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required()
    .messages({
      "string.empty": "Last 4 digits are required",
      "string.pattern.base": "Last 4 digits must be exactly 4 digits",
    }),
  expiry_date: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .required()
    .messages({
      "string.empty": "Expiry date is required",
      "string.pattern.base": "Expiry date must be in MM/YY format",
    }),
  card_image: Joi.string().uri().allow(null, "").optional().messages({
    "string.uri": "Card image must be a valid URL",
  }),
  birth_date: Joi.date().iso().optional().allow(null, "").messages({
    "date.format": "Birth date must be a valid ISO date (YYYY-MM-DD)",
  }),
  coverage_percentage: Joi.alternatives()
    .try(
      Joi.number().min(0).max(100),
      Joi.string().pattern(/^\d+%$/).custom((value, helpers) => {
        const num = parseInt(value.replace("%", ""), 10);
        if (num < 0 || num > 100) {
          return helpers.error("any.invalid");
        }
        return num;
      })
    )
    .optional()
    .allow(null, "")
    .messages({
      "any.invalid": "Coverage percentage must be between 0 and 100",
    }),
});

export const updateInsuranceSchema = Joi.object({
  insurance_company: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Insurance company name must be at least 2 characters",
    "string.max": "Insurance company name cannot exceed 100 characters",
  }),
  card_number: Joi.string()
    .pattern(/^[0-9]{13,19}$/)
    .optional()
    .messages({
      "string.pattern.base": "Card number must be 13-19 digits",
    }),
  card_last4: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .optional()
    .messages({
      "string.pattern.base": "Last 4 digits must be exactly 4 digits",
    }),
  expiry_date: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .optional()
    .messages({
      "string.pattern.base": "Expiry date must be in MM/YY format",
    }),
  card_image: Joi.string().uri().allow(null, "").optional().messages({
    "string.uri": "Card image must be a valid URL",
  }),
  birth_date: Joi.date().iso().optional().allow(null, "").messages({
    "date.format": "Birth date must be a valid ISO date (YYYY-MM-DD)",
  }),
  coverage_percentage: Joi.alternatives()
    .try(
      Joi.number().min(0).max(100),
      Joi.string().pattern(/^\d+%$/).custom((value, helpers) => {
        const num = parseInt(value.replace("%", ""), 10);
        if (num < 0 || num > 100) {
          return helpers.error("any.invalid");
        }
        return num;
      })
    )
    .optional()
    .allow(null, "")
    .messages({
      "any.invalid": "Coverage percentage must be between 0 and 100",
    }),
  status: Joi.string().valid("active", "inactive").optional().messages({
    "any.only": "Status must be either active or inactive",
  }),
}).min(1);
