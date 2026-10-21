import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect,authorize } from "../middleware/authMiddleware.js";
import {createDoctor,
} from "../controllers/doctorController.js";
import {createAdmin,admingetDoctors,createManyDoctors,
    acceptDoctor,cancellDoctor,activateDoctor,deactivateDoctor,
createDoctorbyform,getDrJoinRequests,getDrByIdForAdmin,
getPendingDoctorUploadedDocuments,updateDoctorSchedule,
hideReview,getAllReviewsForAdmin,
completeAppointment,getAppointmentsForAdmin,
getAllPatients,getAdminDashboardCounts,getAppointmentStatusStats,
getPlatformGrowthChart,getBookingsBySpecialtyChart,
getAllDoctorsForAdmin,
getAllSpecialities,getDoctorsBySpeciality,createSpeciality,
globalSearch,
getAdminProfile,updateAdminProfile

} from "../controllers/adminController.js";

import{createManySpecialities,
    getSpecialityById,activateSpeciality,deactivateSpeciality,updateExistingSpecialitiesStatus
} from"../controllers/specialtyController.js";

import{sendEditRequest,getSentMessages,getSentMessageById
} from"../controllers/editsreq_sentmessagescontroller.js";

import { handleDoctorFilesUpload } from "../middleware/upload.js";
import{getReceivedMessages
} from"../controllers/dr_upController.js";



const router = Router();
router.use(protect, authorize('admin')); 


router.get("/mainsearch",globalSearch)

//http://localhost:3000/api/admin/mainsearch?search=noor(dr name or email or specialty name)

//اضافة طبيب
router.post("/create",handleDoctorFilesUpload,createDoctorbyform);

router.get("/view-draccount/:id",getDrByIdForAdmin)
router.post("/requestedits",sendEditRequest)
router.patch("/acceptdr/:id",acceptDoctor)
router.patch("/cancelldr/:id",cancellDoctor)

//عرض الملف الشخصي للادمن


router.get(
  "/profile",
  protect,
  authorize("admin"),
  getAdminProfile
);

router.patch(
  "/profile",
  protect,
  authorize("admin"),
  updateAdminProfile
);

//الرئيسية1

router.get("/dashboard",getAdminDashboardCounts)
//و شارت الدايرة حالة الحجوزات

//2صفحة جميع الاطباء
router.get("/alldrs",getAllDoctorsForAdmin)
//http://localhost:3000/api/admin/alldrs?search=2000&approval_status=accepted&is_active=true&sort=desc
//filters:search=(?),sort=desc-or-asc,approval_status=accepted-require_edits_cancelled_pending,ia_active=true-or-false

//3 صفحة طلبات الانضمام
router.get("/drjoinreq",getDrJoinRequests)
//http://localhost:3000/api/admin/drjoinreq?search=noor&status=accepted
//GET /api/admin/drjoinreq → both pending and needs_edits.
//GET /api/admin/drjoinreq?status=pending →only pending doctors.
//GET /api/admin/drjoinreq?status=needs_edits →  only doctors needing edits.


//4 صفحة المستندات
router.get("/reviewdocuments",getPendingDoctorUploadedDocuments)

//5صفحة عرض التقييمات
router.get("/reviewdrs",getAllReviewsForAdmin)
//http://localhost:3000/api/admin/reviewdrs?search=nour
router.patch("/hidecomment/:id",hideReview)


//6صفحة المرضى
router.get("/allpatients",getAllPatients)
//http://localhost:3000/api/admin/allpatients?search=(name or email)

//7صفحة المواعيد
router.get("/allappointments",getAppointmentsForAdmin)
//http://localhost:3000/api/admin/allappointments?search=(patient name or email)&status=(upcomin-completed-missed)
router.patch("/attend/:id",completeAppointment)

//8صفحة التخصصات

router.post("/addspec",createSpeciality)
router.get("/admingetallspec",getAllSpecialities)
//http://localhost:3000/api/admin/admingetallspec?search=derm
//get drs in one specialty
//http://localhost:3000/api/admin/alldrs?speciality_id=6ac66ea26e7a31656cc52e45
//http://localhost:3000/api/admin/alldrs?search=2000&speciality_id=6ac66ea26e7a31656cc52e45


//9تقارير 

//circle chart
router.get("/statusappoint",getAppointmentStatusStats)
//api/admin/statusappoint/            (gets all)
//api/admin/statusappoint/status-stats?period=today
//api/admin/statusappoint/status-stats?period=last7days
//api/admin/statusappoint/status-stats?period=last30days

router.get("/growthchart",getPlatformGrowthChart)

router.get("/specchart",getBookingsBySpecialtyChart)

//10الاشعارات

router.get("/recievednotfication",getReceivedMessages)
router.get("/sentnotfication",getSentMessages)
router.get("/one-msg/:id",getSentMessageById)



//only admin:
router.post("/",createAdmin)
router.post("/addmanyspec",createManySpecialities)

export default router;



router.get("/admingetonespec/:id",getSpecialityById)

//system don't use this in frontend:
//router.get("/getonemsg/:id",getSentMessageById)
//router.patch("/activatespec/:id",activateSpeciality)
//router.patch("/deactivatespec/:id",deactivateSpeciality)
//router.patch("/activateallspec",updateExistingSpecialitiesStatus)
//router.post("/adminaddmanydrs",createManyDoctors)
//router.post("/adddoctor",createDoctor)
//router.get("/adminviewdr",admingetDoctors)
//router.patch("/adminacceptdr/:id",acceptDoctor)
//router.patch("/admincancelldr/id",cancellDoctor)
//router.patch("/adminactivatedr/id",activateDoctor)
//router.patch("/admindeactivatedr/id",deactivateDoctor)
//router.post("/addmanyspec",createManySpecialities)
router.patch("/addshedule/:id",updateDoctorSchedule)



