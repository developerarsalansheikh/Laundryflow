const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createCustomerTicket,
  getMyTickets,
  getOrderTickets,
} = require("../controllers/supportController");

const router = express.Router();

// All customer support routes are protected
router.use(protect);

router.post("/tickets", createCustomerTicket);       // POST /api/support/tickets — submit support ticket
router.get("/my-tickets", getMyTickets);             // GET  /api/support/my-tickets — list user's tickets
router.get("/order/:orderId", getOrderTickets);      // GET  /api/support/order/:orderId — list tickets for specific order

module.exports = router;
