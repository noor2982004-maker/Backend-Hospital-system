import Joi from "joi";

export const listAppointmentsSchema = Joi.object({
  tab:   Joi.string().valid("upcoming", "past").default("upcoming"),
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const bookAppointmentSchema = Joi.object({
  doctor_id:        Joi.string().hex().length(24).required(),
  appointment_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),           // 2026-10-11
  appointment_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),     // 17:30
  notes:            Joi.string().trim().max(500).allow("", null),
});