import Joi from "joi";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateScheduleSchema = Joi.object({
  working_days: Joi.array()
    .items(Joi.number().integer().min(0).max(6))
    .unique()
    .min(1)
    .required(),
  start_time: Joi.string().pattern(TIME).required(),
  end_time: Joi.string().pattern(TIME).required(),
  break_start: Joi.string().pattern(TIME).allow(null),
  break_end: Joi.string().pattern(TIME).allow(null),
  slot_duration_minutes: Joi.number().integer().min(5).max(240),
  days_off: Joi.array().items(Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)),
})
  .and("break_start", "break_end")
  .custom((v, helpers) => {
    if (v.start_time >= v.end_time)
      return helpers.message("end_time must be after start_time");
    if (v.break_start) {
      if (v.break_start >= v.break_end)
        return helpers.message("break_end must be after break_start");
      if (v.break_start < v.start_time || v.break_end > v.end_time) {
        return helpers.message("break must be inside working hours");
      }
    }
    return v;
  });

export const availabilityQuerySchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  days: Joi.number().integer().min(1).max(14).default(1),
});
