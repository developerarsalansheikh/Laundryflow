const express = require("express");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  replyTicket,
  createTicket,
} = require("../controllers/supportController");

const router = express.Router();

router.use(protect, restrictTo("superadmin"));

router.get("/", getAllTickets);               // GET  /api/super-admin/support-tickets
router.post("/", createTicket);              // POST /api/super-admin/support-tickets
router.get("/:id", getTicketById);           // GET  /api/super-admin/support-tickets/:id
router.put("/:id/status", updateTicketStatus); // PUT  /api/super-admin/support-tickets/:id/status
router.post("/:id/reply", replyTicket);      // POST /api/super-admin/support-tickets/:id/reply

module.exports = router;
