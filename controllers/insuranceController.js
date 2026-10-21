import MedicalInsurance from "../models/medicalInsurance.js";
import {
  addInsuranceSchema,
  updateInsuranceSchema,
} from "../validators/insuranceValidator.js";

const parseExpiryDate = (expiryDate) => {
  const [month, year] = expiryDate.split("/");
  const fullYear = 2000 + parseInt(year, 10);
  return new Date(fullYear, parseInt(month, 10) - 1, 1);
};

const parseCoveragePercentage = (coverage) => {
  if (coverage === null || coverage === undefined || coverage === "") {
    return null;
  }
  if (typeof coverage === "number") {
    return coverage;
  }
  if (typeof coverage === "string") {
    const num = parseInt(coverage.replace("%", ""), 10);
    return num;
  }
  return null;
};

export const addInsurance = async (req, res, next) => {
  try {
    const { error, value } = addInsuranceSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next({
        message: error.details.map((d) => d.message).join(", "),
        statusCode: 400,
      });
    }

    const {
      insurance_company,
      card_number,
      card_last4,
      expiry_date,
      card_image,
      birth_date,
      coverage_percentage,
    } = value;

    const insurance = await MedicalInsurance.create({
      patient_id: req.user.id,
      insurance_company,
      card_number,
      card_last4,
      expiry_date: parseExpiryDate(expiry_date),
      card_image: card_image || null,
      birth_date: birth_date || null,
      coverage_percentage: parseCoveragePercentage(coverage_percentage),
    });

    res.status(201).json({
      success: true,
      message: "Insurance added successfully",
      data: insurance,
    });
  } catch (err) {
    if (err.code === 11000) {
      return next({
        message: "Insurance record already exists for this patient. Use update instead.",
        statusCode: 409,
      });
    }
    next(err);
  }
};

export const getInsurance = async (req, res, next) => {
  try {
    const insurance = await MedicalInsurance.findOne({ patient_id: req.user.id });

    if (!insurance) {
      return next({
        message: "No insurance record found for this patient",
        statusCode: 404,
      });
    }

    res.status(200).json({
      success: true,
      data: insurance,
    });
  } catch (err) {
    next(err);
  }
};

export const updateInsurance = async (req, res, next) => {
  try {
    const { error, value } = updateInsuranceSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next({
        message: error.details.map((d) => d.message).join(", "),
        statusCode: 400,
      });
    }

    const insurance = await MedicalInsurance.findOne({ patient_id: req.user.id });

    if (!insurance) {
      return next({
        message: "No insurance record found for this patient",
        statusCode: 404,
      });
    }

    const updateData = { ...value };
    if (updateData.expiry_date) {
      updateData.expiry_date = parseExpiryDate(updateData.expiry_date);
    }
    if (updateData.coverage_percentage !== undefined) {
      updateData.coverage_percentage = parseCoveragePercentage(updateData.coverage_percentage);
    }

    Object.assign(insurance, updateData);
    await insurance.save();

    res.status(200).json({
      success: true,
      message: "Insurance updated successfully",
      data: insurance,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteInsurance = async (req, res, next) => {
  try {
    const insurance = await MedicalInsurance.findOne({ patient_id: req.user.id });

    if (!insurance) {
      return next({
        message: "No insurance record found for this patient",
        statusCode: 404,
      });
    }

    await MedicalInsurance.deleteOne({ _id: insurance._id });

    res.status(200).json({
      success: true,
      message: "Insurance deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
