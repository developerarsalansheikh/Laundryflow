const express = require("express")
const { getAllServices, 
        getServiceById, 
        createService,
        updateService,
        deleteService, 
        toggleServiceStatus } = require("../controllers/serviceController")
const { protect, restrictTo } = require("../middleware/authMiddleware")
const { serviceUpload } = require("../middleware/upload.middleware")



const router = express.Router()

router.get("/", getAllServices)
router.get("/:id", getServiceById)

// ── Admin only routes ─────────────────────────
router.post("/", protect, restrictTo("admin"), serviceUpload.single("image"), createService)                   // POST   /api/services
router.put("/:id", protect, restrictTo("admin"), serviceUpload.single("image"), updateService);                  // PUT    /api/services/:id
router.delete("/:id", protect, restrictTo("admin"), deleteService);               // DELETE /api/services/:id
router.put("/:id/toggle", protect, restrictTo("admin"), toggleServiceStatus);     // PUT    /api/services/:id/toggle



module.exports = router