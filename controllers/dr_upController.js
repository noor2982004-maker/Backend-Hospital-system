
import crypto from "node:crypto";
import Doctor from "../models/doctor.js";
import RequestEdits from "../models/sentmessages_reqedit.js";
import DoctorDocument from "../models/documents_dr_images.js";
import ReceivedMessages from "../models/recievedmessage.js";
import cloudinary from "../config/cloudinary.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function renderPage(res, title, message, form = "", status = 200) {
  return res.status(status).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f7fb;
          padding: 24px;
          color: #222;
        }
        main {
          max-width: 480px;
          margin: 50px auto;
          padding: 28px;
          background: white;
          border-radius: 12px;
        }
        input, button {
          width: 100%;
          box-sizing: border-box;
          margin-top: 16px;
          padding: 12px;
        }
        button {
          background: #1769aa;
          color: white;
          border: 0;
          border-radius: 7px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <main>
        <h2>${title}</h2>
        <p>${message}</p>
        ${form}
      </main>
    </body>
    </html>
  `);
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "doctor-documents",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}



// GET /api/up/doctor-upload?token=...الصفحة اللي هتظهر للدكتور لما يدوس اللينك في الايميل
export const showDoctorUploadPage = async (req, res) => {
  try {
    const { token } = req.query;

    if (typeof token !== "string" || !token) {
      return renderPage(
        res,
        "Invalid link",
        "The upload link is missing or invalid.",
        "",
        400
      );
    }

    const request = await RequestEdits.findOne({
      token_hash: hashToken(token),
      expires_at: { $gt: new Date() },
    }).select("+token_hash +expires_at");

    if (!request) {
      return renderPage(
        res,
        "Link expired",
        "This link is invalid, expired, or has already been used.",
        "",
        410
      );
    }

    
    const form = `
      <form
        action="/api/up/doctor-upload?token=${encodeURIComponent(token)}"
        method="POST"
        enctype="multipart/form-data"
      >
        <label for="avatar">
          Choose an image (JPG, PNG, WEBP — max 2 MB)
        </label>

        <input
          id="avatar"
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          required
        >

        <button type="submit">Upload</button>
      </form>
    `;

    return renderPage(
      res,
      "Upload requested document",
      "Choose the requested image, then click Upload.",
      form
    );
  } catch (error) {
    console.error("Show upload page error:", error);

    return renderPage(
      res,
      "Error",
      "Something went wrong. Please try again later.",
      "",
      500
    );
  }
};











// POST /api/up/doctor-upload?token=... لما الدكتور يختار الصورة ويدوس ابلود
export const uploadDoctorDocument = async (req, res) => {
  let uploadedPublicId;

  try {
    const { token } = req.query;

    if (typeof token !== "string" || !token) {
      return renderPage(res, "Invalid link", "The upload link is invalid.", "", 400);
    }

    if (!req.file) {
      return renderPage(res, "No image selected", "Please choose an image.", "", 400);
    }

    
    const request = await RequestEdits.findOne({
      token_hash: hashToken(token),
      expires_at: { $gt: new Date() },
    }).select("+token_hash +expires_at");

    if (!request) {
      return renderPage(
        res,
        "Link expired",
        "This link is invalid, expired, or has already been used.",
        "",
        410
      );
    }

    const doctor = await Doctor.findById(request.doctor_id).populate(
      "user_id",
      "full_name"
    );

    if (!doctor || !doctor.user_id) {
      return renderPage(res, "Error", "Doctor not found.", "", 404);
    }

    
    const uploaded = await uploadToCloudinary(req.file.buffer);
    uploadedPublicId = uploaded.public_id;

    
    await DoctorDocument.create({
      doctor_id: doctor._id,
      file_name: req.file.originalname,
      file_url: uploaded.secure_url,
      file_public_id: uploaded.public_id,
      uploaded_by_role: "doctor",
    });

    //الدكتور هيرجع قيد المراجعة تاني لو رد عالايميل ورفع الصورة المطلوبة
    doctor.approval_status = "pending";
    await doctor.save();

    //هيوصل للادمن اشعار في الرسايل المستلمة ان دكتور فلان رفع ملف صورة
    const doctorName = doctor.user_id.full_name || "The doctor";

    await ReceivedMessages.create({
      title: "New document needs review",
      message: `${doctorName} uploaded a new document. The account needs to be reviewed.`,
      doctor_id: doctor._id,
      read: false,
    });

   
    request.token_hash = null;
    request.expires_at = null;
    await request.save();

    return renderPage(
      res,
      "Upload successful",
      "Your image has been uploaded. The administration will review your account."
    );
  } catch (error) {
    console.error("Upload doctor document error:", error);

    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    return renderPage(
      res,
      "Upload failed",
      error.statusCode === 400
        ? error.message
        : "The upload failed. Please try again later.",
      "",
      error.statusCode || 500
    );
  }
};





export const getReceivedMessages = async (req, res, next) => {
  try {
    const receivedMessages = await ReceivedMessages.find({})
      .sort({ createdAt: -1 })
      .lean();

    const data = receivedMessages.map((msg) => {
      let formattedDate = null;
      let formattedTime = null;

      if (msg.createdAt) {
        const d = new Date(msg.createdAt);
        const day = d.getUTCDate();
        const month = d.getUTCMonth() + 1;
        const year = d.getUTCFullYear();
        formattedDate = `${day}-${month}-${year}`;

        formattedTime = d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Africa/Cairo",
        });
      }

      return {
        message_id: msg._id,
        title: msg.title,
        message: msg.message,
        doctor_id: msg.doctor_id,
        is_read: msg.read,
        icon: msg.icon,
        received_at: formattedDate && formattedTime ? `${formattedDate} ${formattedTime}` : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};