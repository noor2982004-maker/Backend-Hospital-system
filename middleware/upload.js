import multer from "multer";

const ALLOWED = ["image/jpeg", "image/png", "image/webp","image/jfif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      const err = new Error("Only JPG, PNG or WEBP images are allowed");
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
}).single("avatar");

export const handleAvatarUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return next({ message: "Image must be 2MB or less", statusCode: 400 });
    }
    next({ message: err.message, statusCode: err.statusCode || 400 });
  });
};





const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      const err = new Error("Only PDF files are allowed");
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
}).single("document");

export const handleDocumentUpload = (req, res, next) => {
  documentUpload(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return next({
        message: "PDF must be 10MB or less",
        statusCode: 400,
      });
    }

    next({
      message: err.message,
      statusCode: err.statusCode || 400,
    });
  });
};








const doctorFilesUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 11 },
  fileFilter: (req, file, cb) => {
    const isImage = ["image/jpeg", "image/png", "image/webp"]
      .includes(file.mimetype);
    const isPdf = file.mimetype === "application/pdf";

    const valid = file.fieldname === "image"
      ? isImage
      : file.fieldname === "certificates" && (isImage || isPdf);

    cb(valid ? null : new Error("Invalid file type"), valid);
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "certificates", maxCount: 10 },
]);

export const handleDoctorFilesUpload = (req, res, next) => {
  doctorFilesUpload(req, res, (err) => {
    if (!err) return next();
    next({
      message: err.code === "LIMIT_FILE_SIZE"
        ? "Each file must be 10MB or less"
        : err.message,
      statusCode: 400,
    });
  });
};
