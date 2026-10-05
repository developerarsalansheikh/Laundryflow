const SupportTicket = require("../models/supportModels");
const User = require("../models/userModels");
const Laundry = require("../models/laundryModels");
const mongoose = require("mongoose");

// Generate a short readable ticket ID
const generateTicketId = () => {
  const prefix = "TKT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// ─────────────────────────────────────────────
// @desc    Get all support tickets (SuperAdmin)
// @route   GET /api/super-admin/support-tickets
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getAllTickets = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
      }).select("_id");

      filter.$or = [
        { subject: searchRegex },
        { ticketId: searchRegex },
        { user: { $in: matchedUsers.map((u) => u._id) } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const [tickets, total, statusCounts] = await Promise.all([
      SupportTicket.find(filter)
        .populate("user", "name email phone role")
        .populate("laundryId", "name city")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      SupportTicket.countDocuments(filter),
      SupportTicket.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: await SupportTicket.countDocuments(),
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };
    statusCounts.forEach((s) => {
      if (stats.hasOwnProperty(s._id)) stats[s._id] = s.count;
    });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      stats,
      data: tickets,
    });
  } catch (error) {
    console.error("GetAllTickets error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch support tickets. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single ticket by ID
// @route   GET /api/super-admin/support-tickets/:id
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const getTicketById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid Ticket ID" });
    }

    const ticket = await SupportTicket.findById(req.params.id)
      .populate("user", "name email phone role")
      .populate("laundryId", "name city phone")
      .populate("responses.sender", "name email role")
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("GetTicketById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch ticket details. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Update ticket status
// @route   PUT /api/super-admin/support-tickets/:id/status
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Valid status required: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("user", "name email role")
      .populate("laundryId", "name city");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("UpdateTicketStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update ticket status. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Reply to a ticket (SuperAdmin)
// @route   POST /api/super-admin/support-tickets/:id/reply
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const replyTicket = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Reply message is required" });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    ticket.responses.push({
      sender: req.user._id,
      message: message.trim(),
      timestamp: new Date(),
    });

    // Auto-move to in_progress when superadmin replies to open ticket
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate("user", "name email role")
      .populate("laundryId", "name city")
      .populate("responses.sender", "name email role");

    return res.status(200).json({ success: true, data: updatedTicket });
  } catch (error) {
    console.error("ReplyTicket error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to send reply. Please try again.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Create a support ticket (SuperAdmin portal for manual entry)
// @route   POST /api/super-admin/support-tickets
// @access  Private/SuperAdmin
// ─────────────────────────────────────────────
const createTicket = async (req, res) => {
  try {
    const { userId, laundryId, subject, description, category, priority } = req.body;

    if (!userId || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "userId, subject, and description are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const ticket = await SupportTicket.create({
      ticketId: generateTicketId(),
      user: userId,
      laundryId: laundryId || null,
      subject,
      description,
      category: category || "general",
      priority: priority || "medium",
      status: "open",
    });

    const populated = await ticket.populate("user", "name email role");

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error("CreateTicket error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create ticket. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  replyTicket,
  createTicket,
};
