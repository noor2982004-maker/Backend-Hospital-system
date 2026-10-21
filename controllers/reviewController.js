import mongoose from "mongoose";
import "../models/user.js";
import Doctor from "../models/doctor.js";
import Review from "../models/review.js";
import Appointment from "../models/appointment.js";
import { listReviewsSchema, addReviewSchema } from "../validators/reviewValidator.js";

const refreshDoctorRating = async (doctorId) => {
  const [stats] = await Review.aggregate([
    // Hidden reviews (is_visible: false) are excluded from the rating
    { $match: { doctor_id: doctorId, is_visible: { $ne: false } } },
    { $group: { _id: "$doctor_id", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const rating_average = stats ? Math.round(stats.avg * 10) / 10 : 0;
  const rating_count = stats ? stats.count : 0;
  await Doctor.updateOne({ _id: doctorId }, { rating_average, rating_count });
  return { rating_average, rating_count };
};

const toDto = (r) => ({
  id: r._id,
  rating: r.rating,
  comment: r.comment ?? "",
  created_at: r.created_at,
  patient_name: r.patient_id?.full_name ? r.patient_id.full_name.split(" ")[0] : null, 
});

// ---------------- GET /api/doctors/:id/reviews ----------------
export const getDoctorReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next({ message: "Invalid doctor id", statusCode: 400 });
    }

    const { error, value } = listReviewsSchema.validate(req.query, { stripUnknown: true });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });
    const { page, limit } = value;

    const doctor = await Doctor.findById(id).select("rating_average rating_count is_active").lean();
    if (!doctor || !doctor.is_active) {
      return next({ message: "Doctor not found", statusCode: 404 });
    }

    // Patients only see visible reviews (old reviews without the field count as visible)
    const filter = { doctor_id: id, is_visible: { $ne: false } };

    const [items, total] = await Promise.all([
      Review.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("patient_id", "full_name")
        .lean(),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: items.map(toDto),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        rating_average: doctor.rating_average,
        rating_count: doctor.rating_count,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------- POST /api/doctors/:id/reviews ----------------
export const addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next({ message: "Invalid doctor id", statusCode: 400 });
    }

    const { error, value } = addReviewSchema.validate(req.body, { stripUnknown: true });
    if (error) return next({ message: error.details[0].message, statusCode: 400 });

    const doctor = await Doctor.findById(id).select("_id is_active");
    if (!doctor || !doctor.is_active) {
      return next({ message: "Doctor not found", statusCode: 404 });
    }

    const completed = await Appointment.exists({
      patient_id: req.user.id,
      doctor_id: doctor._id,
      status: "completed",
    });
    if (!completed) {
      return next({
        message: "You can only review a doctor after a completed appointment",
        statusCode: 403,
      });
    }

    let review;
    try {
      review = await Review.create({
        patient_id: req.user.id,
        doctor_id: doctor._id,
        rating: value.rating,
        comment: value.comment,
      });
    } catch (err) {
      if (err.code === 11000) {
        return next({ message: "You have already reviewed this doctor", statusCode: 409 });
      }
      throw err;
    }

    const doctorRating = await refreshDoctorRating(doctor._id);

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: {
        id: review._id,
        rating: review.rating,
        comment: review.comment ?? "",
        created_at: review.created_at,
      },
      doctor: doctorRating,
    });
  } catch (err) {
    next(err);
  }
};