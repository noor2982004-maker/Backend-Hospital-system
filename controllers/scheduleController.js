import mongoose from "mongoose";
import Doctor from "../models/doctor.js";
import Appointment from "../models/appointment.js";
import { updateScheduleSchema, availabilityQuerySchema } from "../validators/scheduleValidator.js";
import { parseDate, isFuture, generateSlots, scheduleSummary,cairoNow } from "../utils/slots.js";

const dateOnly = (d) => new Date(d).toISOString().slice(0, 10);

export const getSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return next({ message: "Invalid doctor id", statusCode: 400 });

    const doctor = await Doctor.findById(id)
      .select("is_active schedule slot_duration_minutes days_off")
      .lean();
    if (!doctor || !doctor.is_active) return next({ message: "Doctor not found", statusCode: 404 });

    res.status(200).json({
      success: true,
      data: {
        schedule: scheduleSummary(doctor),
        days_off: (doctor.days_off || []).map(dateOnly),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return next({ message: "Invalid doctor id", statusCode: 400 });

    const { error, value } = availabilityQuerySchema.validate(req.query, { stripUnknown: true });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });

    const first = parseDate(value.date);
    if (!first) return next({ message: "Invalid date", statusCode: 400 });

    const doctor = await Doctor.findById(id)
      .select("is_active schedule slot_duration_minutes days_off")
      .lean();
    if (!doctor || !doctor.is_active) return next({ message: "Doctor not found", statusCode: 404 });

    const dates = Array.from({ length: value.days }, (_, i) => {
      const d = new Date(first);
      d.setUTCDate(d.getUTCDate() + i);
      return d;
    });

    const booked = await Appointment.find({
      doctor_id: doctor._id,
      status: "upcoming",
      appointment_date: { $gte: dates[0], $lte: dates[dates.length - 1] },
    })
      .select("appointment_date appointment_time")
      .lean();
    const bookedSet = new Set(booked.map((a) => `${dateOnly(a.appointment_date)}|${a.appointment_time}`));

    const data = dates.map((d) => {
      const dateStr = dateOnly(d);
      const slots = generateSlots(doctor, dateStr).map((time) => ({
        time,
        available: isFuture(dateStr, time) && !bookedSet.has(`${dateStr}|${time}`),
      }));
      return { date: dateStr, is_working_day: slots.length > 0, slots };
    });

    res.status(200).json({ success: true, data, schedule: scheduleSummary(doctor) });
  } catch (err) {
    next(err);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return next({ message: "Invalid doctor id", statusCode: 400 });

    const { error, value } = updateScheduleSchema.validate(req.body, { stripUnknown: true });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });

    const doctor = await Doctor.findById(id);
    if (!doctor) return next({ message: "Doctor not found", statusCode: 404 });

    let daysOff;
    if (value.days_off) {
      daysOff = [];
      for (const d of value.days_off) {
        const parsed = parseDate(d);
        if (!parsed) return next({ message: `Invalid days_off date: ${d}`, statusCode: 400 });
        daysOff.push(parsed);
      }
    }

    doctor.schedule = {
      working_days: [...value.working_days].sort((a, b) => a - b),
      start_time: value.start_time,
      end_time: value.end_time,
      break_start: value.break_start ?? null,
      break_end: value.break_end ?? null,
    };
    if (value.slot_duration_minutes) doctor.slot_duration_minutes = value.slot_duration_minutes;
    if (daysOff) doctor.days_off = daysOff;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: { schedule: scheduleSummary(doctor) },
    });
  } catch (err) {
    next(err);
  }
};


const formatTo12Hour = (time24) => {
  if (!time24) return null;
  const [hourStr, minuteStr] = time24.split(":");
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  const period = hours >= 12 ? "PM" : "AM";
  
  hours = hours % 12;
  hours = hours ? hours : 12; 
  
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${formattedMinutes} ${period}`;
};





export const newgetDoctorScheduleForPatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findOne({
      _id: id,
      approval_status: "accepted",
      is_active: true,
    })
      .select("user_id speciality_id schedule slot_duration_minutes days_off is_active")
      .populate({
        path: "user_id",
        select: "full_name",
      })
      .populate({
        path: "speciality_id",
        select: "name",
      })
      .lean();

    if (!doctor || !doctor.user_id) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or not available for booking",
      });
    }

    // الوقت والتاريخ الحاليان بتوقيت القاهرة
    const now = cairoNow();
    const [currentHours, currentMinutes] = now.time.split(":").map(Number);
    const todayMinutes = currentHours * 60 + currentMinutes;

    // إنشاء تاريخ اليوم باستخدام UTC لتجنب اختلاف التوقيت
    const [year, month, day] = now.date.split("-").map(Number);
    const today = new Date(Date.UTC(year, month - 1, day));

    const schedule = doctor.schedule || {};
    const workingDays = schedule.working_days || [];
    const slotDuration = doctor.slot_duration_minutes || 30;

    const formatDateKey = (date) => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const formatDayName = (date) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "UTC",
        weekday: "long",
      }).format(date);

    const formatMonthName = (date) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "UTC",
        month: "long",
      }).format(date);

    const daysOff = new Set(
      (doctor.days_off || []).map((date) =>
        new Date(date).toISOString().slice(0, 10)
      )
    );

    const datesArray = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() + i);
      return d;
    });

    const startDate = datesArray[0];
    const endDate = datesArray[datesArray.length - 1];

    const bookedAppointments = await Appointment.find({
      doctor_id: doctor._id,
      status: "upcoming",
      appointment_date: { $gte: startDate,$lte: endDate },
    })
      .select("appointment_date appointment_time")
      .lean();

    const bookedSet = new Set(
      bookedAppointments.map(
        (a) => `${new Date(a.appointment_date).toISOString().slice(0, 10)}|${a.appointment_time}`
      )
    );

    const days = [];

    for (let i = 0; i < datesArray.length; i++) {
      const date = datesArray[i];
      const dateKey = formatDateKey(date);
      const dayOfWeek = date.getUTCDay();

      const isWorkingDay = workingDays.includes(dayOfWeek);
      const isDayOff = daysOff.has(dateKey);

      if (!isWorkingDay || isDayOff) {
        continue;
      }

      let rawSlots = generateSlots(doctor, dateKey);

      if (i === 0) {
        rawSlots = rawSlots.filter((slot) => {
          const [hours, minutes] = slot.split(":").map(Number);
          return hours * 60 + minutes > todayMinutes;
        });
      }

      // تصفية الخانات المتاحة فقط (غير المحجوزة)
      const availableSlots = rawSlots.filter(
        (slot) => !bookedSet.has(`${dateKey}|${slot}`)
      );

      // تحويل الأوقات إلى الصيغة المفهومة للمريض (12 ساعة AM/PM)
      const formattedSlots = availableSlots.map((slot) => formatTo12Hour(slot));

      const dayObj = {
        date: dateKey,
        day_name: formatDayName(date),
        day: date.getUTCDate(),
        month: formatMonthName(date),
        display_date: `${formatDayName(date)} ${date.getUTCDate()} ${formatMonthName(date)}`,
      };

      //  جميع الأوقات محجوزة أو منتهية
      if (formattedSlots.length === 0) {
        dayObj.slots = [];
        dayObj.message = "All slots for this day are complete";
      } else {
        dayObj.slots = formattedSlots;
      }

      days.push(dayObj);
    }

    return res.status(200).json({
      success: true,
      data: {
        doctor_id: doctor._id,
        doctor_name: doctor.user_id.full_name,
        speciality: doctor.speciality_id?.name ?? null,
        slot_duration_minutes: slotDuration,
        days,
      },
    });
  } catch (err) {
    next(err);
  }
};