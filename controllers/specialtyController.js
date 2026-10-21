import Speciality from "../models/speciality.js";
import Dr from "../models/doctor.js";

export const createSpeciality = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;

    if (!name) {
      return next({
        message: "Speciality name is required",
        statusCode: 400
      });
    }

    const existingSpeciality = await Speciality.findOne({
      name: name.trim()
    });

    if (existingSpeciality) {
      return next({
        message: "Speciality already exists",
        statusCode: 409
      });
    }

    const speciality = await Speciality.create({
      name: name.trim(),
      icon: icon || null,
      description: description ? description.trim() : null
    });

    res.status(201).json({
      success: true,
      message: "Speciality created successfully",
      data: speciality
    });

  } catch (err) {
    next(err);
  }
};






export const getSpecialitiesPatients = async (req, res, next) => {
  try {
    
    const specialities = await Speciality.find(
      { active_status: true },
      "name icon" 
    );

    res.status(200).json({
      success: true,
      count: specialities.length,
      data: specialities
    });
  } catch (err) {
    next(err);
  }
};





export const getAllSpecialities = async (req, res, next) => {
  try {
    const specialities = await Speciality.aggregate([
      {
        $lookup: {
          from: "doctors", 
          localField: "_id",
          foreignField: "speciality_id",
          as: "doctors"
        }
      },
      {
        $project: {
          name: 1,
          icon: 1,
          description: 1,
          active_status: 1,
          doctors_count: { $size: "$doctors" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: specialities.length,
      data: specialities
    });
  } catch (err) {
    next(err);
  }
};

export const getSpecialityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [speciality, doctorsCount] = await Promise.all([
      Speciality.findById(id),
      Dr.countDocuments({ speciality_id: id }) 
    ]);

    if (!speciality) {
      return next({ message: "Speciality not found", statusCode: 404 });
    }

    res.status(200).json({
      success: true,
      data: {
        ...speciality.toObject(),
        doctors_count: doctorsCount
      }
    });
  } catch (err) {
    next(err);
  }
};






export const activateSpeciality = async (req, res, next) => {
  try {
    const { id } = req.params;
    const speciality = await Speciality.findById(id);

    if (!speciality) {
      return next({ message: "Speciality not found", statusCode: 404 });
    }

    if (speciality.active_status === true) {
      return res.status(400).json({
        success: false,
        message: "Speciality is already activated"
      });
    }

    speciality.active_status = true;
    await speciality.save();

    res.status(200).json({
      success: true,
      message: `${speciality.name} speciality is now activated`,
      data: speciality
    });
  } catch (err) {
    next(err);
  }
};




export const deactivateSpeciality = async (req, res, next) => {
  try {
    const { id } = req.params;
    const speciality = await Speciality.findById(id);

    if (!speciality) {
      return next({ message: "Speciality not found", statusCode: 404 });
    }

    if (speciality.active_status === false) {
      return res.status(400).json({
        success: false,
        message: "Speciality is already deactivated"
      });
    }

    speciality.active_status = false;
    await speciality.save();

    res.status(200).json({
      success: true,
      message: `${speciality.name} speciality is now deactivated`,
      data: speciality
    });
  } catch (err) {
    next(err);
  }
};








export const createManySpecialities = async (req, res, next) => {
  try {
    const specialities = req.body;

    if (!Array.isArray(specialities) || specialities.length === 0) {
      return next({
        message: "Specialities must be a non-empty array",
        statusCode: 400
      });
    }

    const result = await Speciality.insertMany(specialities, {
      ordered: false
    });

    res.status(201).json({
      success: true,
      message: `${result.length} specialities created successfully`,
      data: result
    });

  } catch (err) {
    next(err);
  }
};



export const updateExistingSpecialitiesStatus = async (req, res, next) => {
  try {
    const result = await Speciality.updateMany(
      { active_status: { $exists: false } },
      { $set: { active_status: true } }
    );

    res.status(200).json({
      success: true,
      message: "All existing specialities updated with active_status: true",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};